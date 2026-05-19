import dotenv from "dotenv";

dotenv.config();

export const config = {
  apiKey: process.env.SCALP_API_KEY || "",
  apiSecret: process.env.SCALP_API_SECRET || "",
  leverage: 1,
  riskPercent: 0.1,
  order_time_life_second: 1 * 60,
  depth: 1000,

  wallMultiplier: 2,
  wallEntryBuffer: 0.0005,
  minWallStability: 1,

  maxDistancePercent: 0.005,

  takeProfitPercent: 0.002,
  stopLossPercent: 0.002,

  symbols: ["HANAUSDT"],
};
