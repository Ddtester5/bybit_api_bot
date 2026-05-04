import { ClosedTrade, MetricsResult } from "../types/types";

export function calculateMetrics(
  closedTrades: ClosedTrade[],
  equityCurve: number[],
  startBalance: number,
  endBalance: number,
): MetricsResult {
  const wins = closedTrades.filter((t) => t.win);
  const losses = closedTrades.filter((t) => !t.win);

  const winRate =
    closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0;

  const avgWin = wins.reduce((s, t) => s + t.pnl, 0) / (wins.length || 1);

  const avgLoss =
    losses.length > 0
      ? losses.reduce((s, t) => s + t.pnl, 0) / losses.length
      : 0;

  const grossProfit = wins.reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));

  const profitFactor = grossLoss === 0 ? 0 : grossProfit / grossLoss;

  const expectancy = (winRate / 100) * avgWin + (1 - winRate / 100) * avgLoss;

  let peak = equityCurve[0] || 0;
  let maxDrawdown = 0;

  for (const val of equityCurve) {
    if (val > peak) peak = val;

    const dd = peak > 0 ? (peak - val) / peak : 0;

    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  const avgBars =
    closedTrades.reduce((s, t) => s + t.barsHeld, 0) /
    (closedTrades.length || 1);

  return {
    winRate,
    avgWin,
    avgLoss,
    profitFactor,
    expectancy,
    maxDrawdown,
    avgBars,
    totalTrades: closedTrades.length,
    pnl: endBalance - startBalance,
  };
}
