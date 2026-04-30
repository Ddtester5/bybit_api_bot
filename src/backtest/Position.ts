export interface Position {
  symbol: string;

  side: "short";

  qty: number;

  entryPrice: number;

  stopLoss: number;

  takeProfit: number;

  openedAt: number;
}
