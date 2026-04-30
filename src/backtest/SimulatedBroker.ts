import { Broker, Candle } from "../types/types";

export class SimulatedBroker implements Broker {
  private balance: number;
  private initialBalance: number;
  private positions: {
    symbol: string;
    qty: number;
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
    timestamp: number;
  }[] = [];

  private trades: {
    symbol: string;
    entry: number;
    exit: number;
    qty: number;
    pnl: number;
    percent: number;
    reason: string;
  }[] = [];

  constructor(initialBalance = 10000) {
    this.initialBalance = initialBalance;
    this.balance = initialBalance;
  }

  // --- Interface Implementation ---

  async getAvailableBalance(): Promise<number> {
    return this.balance;
  }

  async hasOpenPosition(symbol: string): Promise<boolean> {
    const isPosition = this.positions.some((p) => p.symbol === symbol);
    console.log("Checking open position for", symbol, "=>", isPosition);
    return isPosition;
  }

  async openPositionsCount(): Promise<number> {
    const count = this.positions.length;
    console.log("Current open positions count:", count);
    return count;
  }

  // Necessary to satisfy the interface, even if empty
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async setLeverage(symbol: string, leverage: number): Promise<void> {
    // In simulation, we can assume leverage is handled by the strategy's QTY calculation
    return;
  }

  async submitShortOrder(params: {
    symbol: string;
    qty: number;
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
  }): Promise<void> {
    if (!params.qty || isNaN(params.qty) || params.qty <= 0) {
      console.error(
        `[!] Ошибка: Попытка открыть Short ${params.symbol} с qty=NaN`,
      );
      return;
    }
    if (
      isNaN(params.entryPrice) ||
      isNaN(params.stopLoss) ||
      isNaN(params.takeProfit)
    ) {
      console.error(
        `[!] Ошибка: Попытка открыть Short ${params.symbol} с NaN в ценах`,
      );
      return;
    }
    const cost = params.qty * params.entryPrice;

    if (cost > this.balance) return;

    this.positions.push({
      ...params,
      timestamp: Date.now(),
    });
  }

  // --- Market Simulation Logic ---

  async updateMarket(candle: Candle, symbol: string): Promise<void> {
    for (let i = this.positions.length - 1; i >= 0; i--) {
      const p = this.positions[i];
      if (p.symbol !== symbol) continue;

      let exitPrice: number | null = null;
      let reason = "";

      // Logic for SHORT:
      // Price goes UP -> Hit Stop Loss
      if (candle.high >= p.stopLoss) {
        exitPrice = p.stopLoss;
        reason = "SL";
      }
      // Price goes DOWN -> Hit Take Profit
      else if (candle.low <= p.takeProfit) {
        exitPrice = p.takeProfit;
        reason = "TP";
      }

      if (exitPrice !== null) {
        this.executeClose(i, exitPrice, reason);
      }
    }
  }

  async closeAllPositions(price: number): Promise<void> {
    if (isNaN(price)) {
      console.error("closeAllPositions: price is NaN, skipping");
      return;
    }
    for (let i = this.positions.length - 1; i >= 0; i--) {
      this.executeClose(i, price, "Force Close");
    }
  }

  private executeClose(index: number, exitPrice: number, reason: string) {
    if (isNaN(exitPrice)) {
      console.error("executeClose: exitPrice is NaN, skipping");
      return;
    }
    const p = this.positions[index];
    const pnl = (p.entryPrice - exitPrice) * p.qty; // Short PnL formula

    this.balance += pnl;
    this.trades.push({
      symbol: p.symbol,
      entry: p.entryPrice,
      exit: exitPrice,
      qty: p.qty,
      pnl: pnl,
      percent: ((p.entryPrice - exitPrice) / p.entryPrice) * 100,
      reason: reason,
    });

    this.positions.splice(index, 1);
  }

  // --- Getters for Analytics ---

  getTrades() {
    return this.trades;
  }

  getFinalBalance() {
    return this.balance;
  }
}
