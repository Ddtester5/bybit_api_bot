import dotenv from "dotenv";

dotenv.config();

export const config = {
  apiKey: process.env.SCALP_API_KEY || "",
  apiSecret: process.env.SCALP_API_SECRET || "",
  backtest: true,
  clearBacktestDataOnStartup: true,

  leverage: 1,
  orderQty: 0.1,

  depth: 1000,

  wallMultiplier: 20,
  wallEntryBuffer: 0.0005,
  minWallStability: 10,

  maxDistancePercent: 0.002,

  takeProfitPercent: 0.003,
  stopLossPercent: 0.001,

  symbols: ["XRPUSDT"],
};
