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
  symbol: string;
}

export interface EngineInput {
  candlesBySymbol: Map<string, Candle[]>;
  maxLength: number;
  startBalance: number;
  config: StrategyConfig;
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

export type StrategyParams = {
  symbols: string[];
  candlesBySymbol: Map<string, Candle[]>;
  maxLength: number;
  metrics: boolean;
};
// types/strategy_config.ts

export interface StrategyConfig {
  apiKey: string;
  apiSecret: string;

  leverage: number;
  maxPositions: number;
  maxRisk: number;

  strategySmaPeriodSlow: number;
  strategySmaPeriodFast: number;
  strategyRsiPeriod: number;
  strategyRsiOverbought: number;
  strategyStopLossDelta: number;
  strategyTakeProfitDelta: number;

  backtestCandleInterval: number;
  pauseCandlesAfterLoss: number;

  symbols: string[];
}
