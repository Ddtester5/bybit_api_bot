import { getInitialData } from "./get_initial_data";
import { runEngine } from "./engine";
import { calculateMetrics } from "./metrics";

import { BACKTEST_START_BALANCE, MAX_POSITIONS } from "../config/main_config";

async function run() {
  const { symbols, candlesBySymbol, maxLength } = await getInitialData({
    testMode: true,
  });

  const result = runEngine({
    symbols,
    candlesBySymbol,
    maxLength,
    startBalance: BACKTEST_START_BALANCE,
    maxPositions: MAX_POSITIONS,
  });

  const stats = calculateMetrics(
    result.closedTrades,
    result.equityCurve,
    BACKTEST_START_BALANCE,
    result.balance,
  );

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

run();
