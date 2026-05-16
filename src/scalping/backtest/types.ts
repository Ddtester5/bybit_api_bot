export type ReplayRow = {
  ts: number;
  data: string;
};

export type SimulatedPosition = {
  symbol: string;
  side: "Buy" | "Sell";
  entryPrice: number;
  tpPrice: number;
  slPrice: number;
  openedAt: number;
};

export type SimulatedTrade = {
  symbol: string;
  side: "Buy" | "Sell";
  entryPrice: number;
  exitPrice: number;
  pnlPercent: number;
  result: "TP" | "SL";
  openedAt: number;
  closedAt: number;
};
