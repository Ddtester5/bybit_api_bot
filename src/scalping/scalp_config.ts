import dotenv from "dotenv";

dotenv.config();

export const config = {
  apiKey: process.env.SCALP_API_KEY || "",
  apiSecret: process.env.SCALP_API_SECRET || "",
  leverage: 15,
  riskPercent: 0.1,
  order_time_life_second: 3 * 60,
  depth: 200,

  wallMultiplier: 5,
  wallEntryBuffer: 0.0005,
  minWallStability: 4000,

  minDistancePercent: 0.0004, // Стена должна стоять МИНИМУМ в 0.05% от средней цены
  maxDistancePercent: 0.005, // и МАКСИМУМ в 0.5% от средней цены

  takeProfitPercent: 0.003,
  stopLossPercent: 0.005,

  // symbols: ["SOLUSDT", "XRPUSDT", "SUIUSDT"],
  symbols: ["SUIUSDT"],
};
