import dotenv from "dotenv";

dotenv.config();

export const config = {
  apiKey: process.env.SCALP_API_KEY || "",
  apiSecret: process.env.SCALP_API_SECRET || "",

  leverage: 1,
  orderQty: 0.1,

  depth: 1000,

  wallMultiplier: 10,
  wallEntryBuffer: 0.0005,

  maxDistancePercent: 0.0015,

  takeProfitPercent: 0.002,
  stopLossPercent: 0.0005,

  symbols: ["TONUSDT", "XRPUSDT"],
};
