import { getTradingPairs } from "../modules/get_tradings_pair";
import { loadHistoricalCandles } from "../modules/loadHistoricalCandles";
import { checkSignal, Position } from "../strategies/strategy";
import { Candle } from "../types/types";

const MAX_POSITIONS = 100;
const MAX_RISK = 0.005;

async function run() {
  const pairs = await getTradingPairs();
  const symbols = pairs.slice(0, 500);
  const candlesBySymbol = new Map<string, Candle[]>();
  for (const symbol of symbols) {
    const candles = await loadHistoricalCandles(symbol);
    if (!candles?.length) {
      console.warn(`${symbol}: empty data`);
      continue;
    }

    candlesBySymbol.set(symbol, candles);
  }
  const init = 10;
  let balance = init;

  const positions = new Map<string, Position>();

  let trades = 0;
  let stopcount = 0;
  let ptofitcount = 0;
  let totalstop = 0;
  let totalprofit = 0;

  let maxLength = 0;
  for (const candles of candlesBySymbol.values()) {
    if (candles.length > maxLength) maxLength = candles.length;
  }

  for (let i = 0; i < maxLength; i++) {
    for (const symbol of symbols) {
      const candles = candlesBySymbol.get(symbol)!;
      if (!candles || !candles[i]) continue;
      const candle = candles[i];

      const position = positions.get(symbol);

      const COMMISSION_RATE = 0.002; // 0.2% (комиссия + минимальное проскальзывание)
      const FUNDING_RATE_ESTIMATE = 0.0002; // 0.01% за свечу (упрощенно)

      // ... внутри цикла по символам ...

      // === EXIT ===
      if (position) {
        let exitPrice = 0;
        let isClosing = false;

        // Для ЛОНГА
        if (candle.high >= position.takeProfit) {
          exitPrice = position.takeProfit;
          isClosing = true;
        } else if (candle.low <= position.stopLoss) {
          exitPrice = position.stopLoss;
          isClosing = true;
        }

        if (isClosing) {
          // 1. Считаем грязный PnL
          const pnl = (exitPrice - position.entry) * position.qty!;

          // 2. Вычитаем комиссии (за открытие и за закрытие)
          const fees =
            (position.entry + exitPrice) * position.qty! * COMMISSION_RATE;

          // 3. Вычитаем фандинг (зависит от того, сколько свечей просидели)
          // (i - position.openIndex) - нужно добавить openIndex в объект позиции
          const barsHeld = i - (position.openIndex ?? 0);
          const funding =
            position.entry * position.qty! * FUNDING_RATE_ESTIMATE * barsHeld;

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

      // === ENTRY ===
      if (!position && positions.size < MAX_POSITIONS) {
        const signal = checkSignal(candles, i);
        if (signal) {
          const stopDistance = Math.abs(signal.entry - signal.stopLoss);
          const qty = (balance * MAX_RISK) / stopDistance;

          positions.set(symbol, {
            ...signal,
            qty,
            openIndex: i, // Запоминаем время входа для фандинга
          });
        }
      }
    }
  }

  console.log("\nRESULT:");
  console.log("Balance:", balance.toFixed(2));
  console.log("PnL:", (balance - init).toFixed(2));
  console.log("Trades:", trades);
  console.log("Stop count:", stopcount);
  console.log("Profit count:", ptofitcount);
  console.log("total stop:", totalstop);
  console.log("total profit:", totalprofit);
}

run();
