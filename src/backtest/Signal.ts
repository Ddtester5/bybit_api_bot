export interface Signal {
  symbol: string;

  side: "short";

  entryPrice: number;

  stopLoss: number;

  takeProfit: number;

  qty: number;
}
