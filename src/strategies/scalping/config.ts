import dotenv from "dotenv";

dotenv.config();

export const SCALP_API_KEY = process.env.SCALP_API_KEY || "";
export const SCALP_API_SECRET = process.env.SCALP_API_SECRET || "";

export const SYMBOL = "ETHUSDT";

export const LEVERAGE = 10;
export const ORDER_QTY = 0.01;

// orderbook
export const DEPTH = 20;

// wall strategy
export const WALL_THRESHOLD = 500;
export const MAX_DISTANCE_PERCENT = 0.0015;
export const WALL_MIN_LIFETIME_MS = 3000;
export const MIN_WALL_REMAIN_PERCENT = 0.7;
export const MIN_AGGRESSIVE_VOLUME = 20;
// TP/SL
export const TAKE_PROFIT_PERCENT = 0.002;
export const STOP_LOSS_BUFFER = 0.0005;

// cooldown
export const COOLDOWN_MS = 15000;
