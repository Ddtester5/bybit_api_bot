import dotenv from "dotenv";

dotenv.config();

export const apiKey = process.env.API_KEY;
export const apiSecret = process.env.API_SECRET;

export const MAX_POSITIONS = 25;
export const MAX_RISK = 0.02;
export const LEVERAGE = 5;

export const BACKTEST_SYMBOLS_COUNT = 3000;
export const BACKTEST_START_BALANCE = 1000;
export const BACKTEST_CANDLE_INTERVAL = 60;
export const BACKTEST_CANDLES_COUNT = 3 * 365 * 24;
export const BACKTEST_COMMISSION_RATE = 0.001;
export const BACKTEST_FUNDING_RATE_ESTIMATE = 0.0001;

export const STRATEGY_SMA_PERIOD_SLOW = 200;
export const STRATEGY_SMA_PERIOD_FAST = 50;
export const STRATEGY_RSI_PERIOD = 14;
export const STRATEGY_RSI_OVERBOUGHT = 48;
export const STRATEGY_STOP_LOSS_DELTA = 0.15;
export const STRATEGY_TAKE_PROFIT_DELTA = 0.2;
export const STRATEGY_ATR_PERIOD = 14;
export const STRATEGY_ATR_MULTIPLIER = 2.2;
