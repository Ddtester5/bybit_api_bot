import { runEngine } from "./engine";
import { getInitialData } from "./get_initial_data";
import { calculateMetrics } from "./metrics";

import { BACKTEST_START_BALANCE, MAX_POSITIONS } from "../config/main_config";
import { StrategyParams } from "../types/types";

async function run(params: StrategyParams) {
  const result = runEngine({
    symbols: params.symbols,
    candlesBySymbol: params.candlesBySymbol,
    maxLength: params.maxLength,
    startBalance: BACKTEST_START_BALANCE,
    maxPositions: MAX_POSITIONS,
    rsiOverbought: params.rsiOverbought,
  });

  const stats = calculateMetrics(
    result.closedTrades,
    result.equityCurve,
    BACKTEST_START_BALANCE,
    result.balance,
  );
  if (params.metrics) {
    console.log("\n--- BACKTEST RESULT ---");

    console.log(`Balance: ${result.balance.toFixed(2)}`);
    console.log(`PnL:     ${stats.pnl.toFixed(2)}`);

    console.log("\n--- TRADES ---");
    console.log(`Total:    ${stats.totalTrades}`);
    console.log(`Win rate: ${stats.winRate.toFixed(2)}%`);

    console.log("\n--- PERFORMANCE ---");
    console.log(`Avg Win:       ${stats.avgWin.toFixed(2)}`);
    console.log(`Avg Loss:      ${stats.avgLoss.toFixed(2)}`);
    console.log(`Profit Factor: ${stats.profitFactor.toFixed(2)}`);
    console.log(`Expectancy:    ${stats.expectancy.toFixed(2)}`);

    console.log("\n--- RISK ---");
    console.log(`Max Drawdown: ${(stats.maxDrawdown * 100).toFixed(2)}%`);

    console.log("\n--- BEHAVIOR ---");
    console.log(`Avg Hold: ${stats.avgBars.toFixed(2)} bars`);

    console.log("-----------------------\n");
  }

  return stats.pnl.toFixed(2);
}

(async function () {
  const { symbols, candlesBySymbol, maxLength } = await getInitialData({
    testMode: true,
  });
  const res = new Map<number, string>();
  for (let i = 0; i <= 100; i++) {
    console.log(`=== TESTING RSI Overbought = ${i} ===`);
    const pnl = await run({
      rsiOverbought: i,
      symbols,
      candlesBySymbol,
      maxLength,
      metrics: false,
    });
    res.set(i, pnl);
  }
  console.log("\n\n=== SUMMARY ===");

  const sorted = Array.from(res.entries()).sort(
    (a, b) => parseFloat(b[1]) - parseFloat(a[1]),
  );

  console.log("\n--- TOP 5 ---");
  console.table(
    sorted.slice(0, 5).map(([rsi, pnl]) => ({
      rsi,
      pnl,
    })),
  );

  console.log("\n--- WORST 5 ---");
  console.table(
    sorted
      .slice(-5)
      .reverse()
      .map(([rsi, pnl]) => ({
        rsi,
        pnl,
      })),
  );
})();

// (async function () {
//   const { symbols, candlesBySymbol, maxLength } = await getInitialData({
//     testMode: true,
//   });
//   run({
//     rsiOverbought: 70,
//     symbols,
//     candlesBySymbol,
//     maxLength,
//     metrics: true,
//   });
// })();
