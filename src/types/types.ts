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

export interface Position {
  symbol: string;
  entry: number;
  stopLoss: number;
  takeProfit: number;
  qty: number;
  openIndex: number;
}

export interface ClosedTrade {
  pnl: number;
  win: boolean;
  barsHeld: number;
}

export interface EngineInput {
  symbols: string[];
  candlesBySymbol: Map<string, Candle[]>;
  maxLength: number;
  startBalance: number;
  maxPositions: number;
}

export interface EngineResult {
  balance: number;
  closedTrades: ClosedTrade[];
  equityCurve: number[];
}

export interface MetricsResult {
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  expectancy: number;
  maxDrawdown: number;
  avgBars: number;
  totalTrades: number;
  pnl: number;
}
