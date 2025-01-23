import dotenv from "dotenv";

dotenv.config();

export const leverage = 25;
export const timeFrame = 5;
export const tradingPair = "ACEUSDT"; // Торговая пара
export const takeProfitRatio = 0.05; // Тейк-профит: 2%
export const stopLossRatio = 0.04; // Стоп-лосс: 1%
export const pullbackThreshold = 0.005; // Уровень отката: 0.5%
export const positionSize = "0.01"; // Размер позиции (например, 0.01 BTC)
export const candleCountAnalize = 4;
