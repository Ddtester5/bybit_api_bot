import dotenv from "dotenv";

dotenv.config();

export const config = {
  apiKey: process.env.SCALP_API_KEY || "",
  apiSecret: process.env.SCALP_API_SECRET || "",
  leverage: 1,
  orderQty: 10,
  order_time_life_second: 5 * 60,
  depth: 1000,

  wallMultiplier: 20,
  wallEntryBuffer: 0.0005,
  minWallStability: 10,

  maxDistancePercent: 0.005,

  takeProfitPercent: 0.009,
  stopLossPercent: 0.003,

  symbols: ["HANAUSDT"],
};
