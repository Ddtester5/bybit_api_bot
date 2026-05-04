export interface Candle {
  symbol: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  turnover: number;
}

export type Position = {
  entry: number;
  stopLoss: number;
  takeProfit: number;
  qty: number;
  openIndex: number;
};
