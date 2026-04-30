import { Candle } from "../types/types";
import { Position } from "./Position";

export class Portfolio {
  private cash: number;

  private initialBalance: number;

  private positions: Position[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private closedTrades: any[] = [];

  constructor(initialBalance = 10000) {
    this.cash = initialBalance;
    this.initialBalance = initialBalance;
  }

  hasPosition(symbol: string) {
    return this.positions.some((p) => p.symbol === symbol);
  }

  openShort(params: {
    symbol: string;

    qty: number;

    entryPrice: number;

    stopLoss: number;

    takeProfit: number;

    timestamp: number;
  }) {
    if (this.hasPosition(params.symbol)) return;

    this.positions.push({
      symbol: params.symbol,

      side: "short",

      qty: params.qty,

      entryPrice: params.entryPrice,

      stopLoss: params.stopLoss,

      takeProfit: params.takeProfit,

      openedAt: params.timestamp,
    });
  }

  updateMarket(candle: Candle) {
    for (let i = this.positions.length - 1; i >= 0; i--) {
      const p = this.positions[i];

      if (p.symbol !== candle.symbol) continue;

      let exitPrice = null;

      let reason = "";

      if (candle.high >= p.stopLoss) {
        exitPrice = p.stopLoss;

        reason = "SL";
      } else if (candle.low <= p.takeProfit) {
        exitPrice = p.takeProfit;

        reason = "TP";
      }

      if (exitPrice !== null) {
        this.closePosition(i, exitPrice, reason);
      }
    }
  }

  private closePosition(index: number, exitPrice: number, reason: string) {
    const p = this.positions[index];

    const pnl = (p.entryPrice - exitPrice) * p.qty;

    this.cash += pnl;

    this.closedTrades.push({
      symbol: p.symbol,

      pnl,

      reason,
    });

    this.positions.splice(index, 1);
  }

  forceCloseAll(lastPrices: Map<string, number>) {
    for (let i = this.positions.length - 1; i >= 0; i--) {
      const p = this.positions[i];

      const price = lastPrices.get(p.symbol);

      if (!price) continue;

      this.closePosition(i, price, "ForceClose");
    }
  }

  getClosedTrades() {
    return this.closedTrades;
  }

  getBalance() {
    return this.cash;
  }
}
