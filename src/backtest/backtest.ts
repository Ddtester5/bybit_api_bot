import {
  BACKTEST_COMMISSION_RATE,
  BACKTEST_FUNDING_RATE_ESTIMATE,
  BACKTEST_START_BALANCE,
  MAX_POSITIONS,
  MAX_RISK,
  STRATEGY_STOP_LOSS_DELTA,
  STRATEGY_TAKE_PROFIT_DELTA,
  LEVERAGE,
} from "../config/main_config";
import { checkSignal } from "../strategies/strategy";
import { Position } from "../types/types";
import { getInitialData } from "./get_initial_data";

async function run() {
  const { symbols, candlesBySymbol, maxLength } = await getInitialData({
    testMode: true,
  });

  let balance = BACKTEST_START_BALANCE;
  const positions = new Map<string, Position>();

  let trades = 0;
  let stopcount = 0;
  let ptofitcount = 0;
  let totalstop = 0;
  let totalprofit = 0;

  for (let i = 0; i < maxLength; i++) {
    for (const symbol of symbols) {
      const candles = candlesBySymbol.get(symbol)!;
      if (!candles || !candles[i]) continue;
      const candle = candles[i];

      const position = positions.get(symbol);

      // === EXIT LOGIC ===
      if (position) {
        // Пропускаем свечу, на которой открылись, чтобы избежать "заглядывания в будущее"
        if (position.openIndex === i) continue;

        let exitPrice = 0;
        let isClosing = false;

        // Для SHORT: Стоп лосс наверху (High), Тейк профит внизу (Low)
        if (candle.high >= position.stopLoss) {
          exitPrice = position.stopLoss;
          isClosing = true;
        } else if (candle.low <= position.takeProfit) {
          exitPrice = position.takeProfit;
          isClosing = true;
        }

        if (isClosing) {
          // PnL для Short: (Вход - Выход) * Кол-во
          const pnl = (position.entry - exitPrice) * (position.qty || 0);

          const fees =
            (position.entry + exitPrice) *
            (position.qty || 0) *
            BACKTEST_COMMISSION_RATE;

          const barsHeld = i - (position.openIndex ?? 0);
          const funding =
            (position.entry *
              (position.qty || 0) *
              BACKTEST_FUNDING_RATE_ESTIMATE *
              barsHeld) /
            8;

          const finalResult = pnl - fees - funding;
          balance += finalResult;

          if (finalResult > 0) {
            totalprofit += finalResult;
            ptofitcount++;
          } else {
            totalstop += finalResult;
            stopcount++;
          }

          positions.delete(symbol);
          trades++;
          continue;
        }
      }

      // === ENTRY LOGIC ===
      if (!position && positions.size < MAX_POSITIONS) {
        if (checkSignal(candles, i)) {
          const entryPrice = candle.close;

          // РАСЧЕТ ДЛЯ SHORT:
          // Стоп = Цена * 1,01, Тейк = Цена * 0,98
          const stopLoss = entryPrice * (1 + STRATEGY_STOP_LOSS_DELTA); // Наверх
          const takeProfit = entryPrice * (1 - STRATEGY_TAKE_PROFIT_DELTA); // Вниз

          const risk = balance * MAX_RISK;

          const stopDistance = Math.abs(entryPrice - stopLoss);

          if (stopDistance === 0) continue;

          const qty = (risk * LEVERAGE) / stopDistance;

          positions.set(symbol, {
            entry: entryPrice,
            stopLoss,
            takeProfit,
            qty,
            openIndex: i,
          });
        }
      }
    }
  }

  console.log("\n--- BACKTEST RESULT ---");
  console.log(`Final Balance:  ${balance.toFixed(2)}`);
  console.log(
    `Total PnL:      ${(balance - BACKTEST_START_BALANCE).toFixed(2)}`,
  );
  console.log(`Total Trades:   ${trades}`);
  console.log(`Profits:        ${ptofitcount} (${totalprofit.toFixed(2)})`);
  console.log(`Stops:          ${stopcount} (${totalstop.toFixed(2)})`);
  console.log("-----------------------\n");
}

run();
