import {
  BACKTEST_COMMISSION_RATE,
  BACKTEST_FUNDING_RATE_ESTIMATE,
  BACKTEST_START_BALANCE,
  MAX_POSITIONS,
  MAX_RISK,
  STRATEGY_STOP_LOSS_DELTA,
  STRATEGY_TAKE_PROFIT_DELTA,
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

  const closedTrades: {
    pnl: number;
    win: boolean;
    barsHeld: number;
  }[] = [];

  const equityCurve: number[] = [];

  for (let i = 0; i < maxLength; i++) {
    for (const symbol of symbols) {
      const candles = candlesBySymbol.get(symbol);
      if (!candles || !candles[i]) continue;

      const candle = candles[i];
      const position = positions.get(symbol);

      // =========================
      // EXIT LOGIC
      // =========================
      if (position) {
        if (position.openIndex === i) continue;

        let exitPrice = 0;
        let isClosing = false;

        if (candle.high >= position.stopLoss) {
          exitPrice = position.stopLoss;
          isClosing = true;
        } else if (candle.low <= position.takeProfit) {
          exitPrice = position.takeProfit;
          isClosing = true;
        }

        if (isClosing) {
          const pnl = (position.entry - exitPrice) * position.qty;

          const fees =
            (position.entry + exitPrice) *
            position.qty *
            BACKTEST_COMMISSION_RATE;

          const barsHeld = i - position.openIndex;

          const funding =
            (position.entry *
              position.qty *
              BACKTEST_FUNDING_RATE_ESTIMATE *
              barsHeld) /
            8;

          const finalResult = pnl - fees - funding;

          if (!isFinite(finalResult)) continue;

          balance += finalResult;

          closedTrades.push({
            pnl: finalResult,
            win: finalResult > 0,
            barsHeld,
          });

          positions.delete(symbol);
        }
      }

      // =========================
      // ENTRY LOGIC
      // =========================
      if (!positions.has(symbol) && positions.size < MAX_POSITIONS) {
        if (checkSignal(candles, i)) {
          const entryPrice = candle.close;

          const stopLoss = entryPrice * (1 + STRATEGY_STOP_LOSS_DELTA);
          const takeProfit = entryPrice * (1 - STRATEGY_TAKE_PROFIT_DELTA);

          const risk = balance * MAX_RISK;

          const stopDistance = Math.abs(entryPrice - stopLoss);
          if (stopDistance === 0) continue;

          // ✅ FIXED (без leverage)
          const qty = risk / stopDistance;

          if (!isFinite(qty) || qty <= 0) continue;

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

    equityCurve.push(balance);
  }

  // =========================
  // METRICS
  // =========================

  if (!closedTrades.length) {
    console.log("Нет сделок");
    return;
  }

  const wins = closedTrades.filter((t) => t.win);
  const losses = closedTrades.filter((t) => !t.win);

  const winRate = (wins.length / closedTrades.length) * 100;

  const avgWin = wins.reduce((s, t) => s + t.pnl, 0) / (wins.length || 1);

  const avgLoss =
    losses.length > 0
      ? losses.reduce((s, t) => s + t.pnl, 0) / losses.length
      : 0;

  const grossProfit = wins.reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));

  const profitFactor = grossLoss === 0 ? 0 : grossProfit / grossLoss;

  const winProb = winRate / 100;

  const expectancy = winProb * avgWin + (1 - winProb) * avgLoss;

  // =========================
  // DRAWNDOWN
  // =========================

  let peak = equityCurve.length ? equityCurve[0] : 0;
  let maxDrawdown = 0;

  for (const val of equityCurve) {
    if (val > peak) peak = val;

    const dd = peak > 0 ? (peak - val) / peak : 0;

    if (dd > maxDrawdown) {
      maxDrawdown = dd;
    }
  }

  const avgBars =
    closedTrades.reduce((s, t) => s + t.barsHeld, 0) / closedTrades.length;

  // =========================
  // OUTPUT
  // =========================

  if (!isFinite(balance)) {
    console.error("Balance NaN/Infinity — ошибка в расчётах");
    return;
  }

  console.log("\n--- BACKTEST RESULT ---");

  console.log(`Balance:         ${balance.toFixed(2)}`);
  console.log(
    `PnL:             ${(balance - BACKTEST_START_BALANCE).toFixed(2)}`,
  );

  console.log("\n--- TRADES ---");
  console.log(`Total:           ${closedTrades.length}`);
  console.log(`Win rate:        ${winRate.toFixed(2)}%`);

  console.log("\n--- PERFORMANCE ---");
  console.log(`Avg Win:         ${avgWin.toFixed(2)}`);
  console.log(`Avg Loss:        ${avgLoss.toFixed(2)}`);
  console.log(`Profit Factor:   ${profitFactor.toFixed(2)}`);
  console.log(`Expectancy:      ${expectancy.toFixed(2)}`);

  console.log("\n--- RISK ---");
  console.log(`Max Drawdown:    ${(maxDrawdown * 100).toFixed(2)}%`);

  console.log("\n--- BEHAVIOR ---");
  console.log(`Avg Hold (bars): ${avgBars.toFixed(2)}`);

  console.log("-----------------------\n");
}

run();
