import dotenv from "dotenv";

dotenv.config();

export const apiKey = process.env.API_KEY;
export const apiSecret = process.env.API_SECRET;

export const MAX_POSITIONS = 50;
export const MAX_RISK = 0.01;
export const LEVERAGE = 10;

export const BACKTEST_SYMBOLS_COUNT = 3;
export const BACKTEST_START_BALANCE = 10;
export const BACKTEST_CANDLE_INTERVAL = 60;
export const BACKTEST_CANDLES_COUNT = 365 * 24;
export const BACKTEST_COMMISSION_RATE = 0.002;
export const BACKTEST_FUNDING_RATE_ESTIMATE = 0.0;

export const STRATEGY_SMA_PERIOD_SLOW = 15 * 24;
export const STRATEGY_SMA_PERIOD_FAST = 10;
export const STRATEGY_RSI_PERIOD = 15;
export const STRATEGY_RSI_OVERBOUGHT = 75;
export const STRATEGY_STOP_LOSS_DELTA = 0.1;
export const STRATEGY_TAKE_PROFIT_DELTA = 0.15;
