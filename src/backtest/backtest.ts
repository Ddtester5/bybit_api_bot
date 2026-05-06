import { runEngine } from "./engine";
import { getInitialData } from "./get_initial_data";
import { calculateMetrics } from "./metrics";

import { BACKTEST_START_BALANCE, MAX_POSITIONS } from "../config/main_config";
import { ClosedTrade, StrategyParams } from "../types/types";

async function run(params: StrategyParams) {
  const result = runEngine({
    symbols: params.symbols,
    candlesBySymbol: params.candlesBySymbol,
    maxLength: params.maxLength,
    startBalance: BACKTEST_START_BALANCE,
    maxPositions: MAX_POSITIONS,
    rsiOverbought: params.rsiOverbought,
    stopLossPercent: params.stopLossPercent,
    takeProfitPercent: params.takeProfitPercent,
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

    // Описываем структуру объекта статистики
    interface SymbolStats {
      Symbol: string;
      Wins: number;
      Losses: number;
      TotalPnL: number;
      WinRate?: number; // Опционально, так как добавим позже
    }

    // 1. Агрегация с явным указанием типа Record<string, SymbolStats>
    const statsMap = result.closedTrades.reduce<Record<string, SymbolStats>>(
      (acc, trade: ClosedTrade) => {
        const sym = trade.symbol;

        if (!acc[sym]) {
          acc[sym] = { Symbol: sym, Wins: 0, Losses: 0, TotalPnL: 0 };
        }

        if (trade.win) {
          acc[sym].Wins += 1;
        } else {
          acc[sym].Losses += 1;
        }

        acc[sym].TotalPnL = Number((acc[sym].TotalPnL + trade.pnl).toFixed(2));

        return acc;
      },
      {},
    );

    // 2. Добавляем расчет WinRate
    const allStats: SymbolStats[] = Object.values(statsMap).map((item) => {
      const total = item.Wins + item.Losses;
      return {
        ...item,
        WinRate: total > 0 ? Number(((item.Wins / total) * 100).toFixed(2)) : 0,
      };
    });

    // 3. Сортировка по лузам и вывод
    console.log("Full Stats (Sorted by Losses):");
    console.table([...allStats].sort((a, b) => b.Losses - a.Losses));

    // 4. Список символов с WinRate < 50%
    const lowWinRateSymbols: string[] = allStats
      .filter((item) => (item.WinRate ?? 0) > 50)
      .map((item) => item.Symbol);

    console.log(JSON.stringify(lowWinRateSymbols, null, 2));

    console.log("-----------------------\n");
  }

  return stats;
}

// (async function () {
//   const { symbols, candlesBySymbol, maxLength } = await getInitialData({
//     testMode: true,
//   });
//   const res = new Map<
//     { rsi: number; stop: number; take: number },
//     { pnl: string }
//   >();
//   for (let rsi = 30; rsi <= 70; rsi += 5) {
//     for (let stop = 0.1; stop <= 0.3; stop += 0.01) {
//       for (let take = 0.1; take <= 0.3; take += 0.01) {
//         console.log(
//           `=== TESTING RSI Overbought = ${rsi} , Stop Loss = ${stop} , Take Profit = ${take}  ===`,
//         );
//         const stats = await run({
//           rsiOverbought: rsi,
//           symbols,
//           candlesBySymbol,
//           maxLength,
//           metrics: false,
//           stopLossPercent: stop,
//           takeProfitPercent: take,
//         });
//         console.log(
//           "pnl : ",
//           stats.pnl.toFixed(2),
//           "\n",
//           "drawdown : ",
//           (stats.maxDrawdown * 100).toFixed(2),
//         );
//         res.set({ rsi, stop, take }, { pnl: stats.pnl.toFixed(2) });
//       }
//     }
//   }
//   console.log("\n\n=== SUMMARY ===");

//   const sorted = Array.from(res.entries()).sort(
//     (a, b) => parseFloat(b[1].pnl) - parseFloat(a[1].pnl),
//   );

//   console.log("\n--- TOP 10 ---");
//   console.table(
//     sorted.slice(0, 10).map(([params, { pnl }]) => ({
//       rsi: params.rsi,
//       stop: params.stop,
//       take: params.take,
//       pnl,
//     })),
//   );

//   console.log("\n--- WORST 5 ---");
//   console.table(
//     sorted.slice(0, -5).map(([params, { pnl }]) => ({
//       rsi: params.rsi,
//       stop: params.stop,
//       take: params.take,
//       pnl,
//     })),
//   );
// })();

(async function () {
  const { symbols, candlesBySymbol, maxLength } = await getInitialData({
    testMode: true,
  });
  run({
    stopLossPercent: 0.1,
    takeProfitPercent: 0.17,
    rsiOverbought: 40,
    symbols,
    candlesBySymbol,
    maxLength,
    metrics: true,
  });
})();
