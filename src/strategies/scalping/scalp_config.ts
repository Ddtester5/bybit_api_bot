import dotenv from "dotenv";

dotenv.config();

export const config = {
  apiKey: process.env.SCALP_API_KEY || "",
  apiSecret: process.env.SCALP_API_SECRET || "",

  leverage: 1,
  orderQty: 0.1,

  depth: 1000,

  wallMultiplier: 10,
  wallEntryBuffer: 0.001,
  minWallStability: 3,

  maxDistancePercent: 0.0015,

  takeProfitPercent: 0.002,
  stopLossPercent: 0.001,

  symbols: [
    "TONUSDT",
    "XRPUSDT",
    // "SOLUSDT",
    // "BNBUSDT",
    // "ADAUSDT",
    // "DOGEUSDT",
    // "TRXUSDT",
    // "LINKUSDT",
    // "AVAXUSDT",
    // "DOTUSDT",
  ],
};
