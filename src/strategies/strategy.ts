import { Candle } from "../types/types";

export type Position = {
  entry: number;
  stopLoss: number;
  takeProfit: number;
  qty?: number;
};

/**
 * Рассчитывает Simple Moving Average
 */
function calculateSMA(
  candles: Candle[],
  index: number,
  period: number,
): number | null {
  if (index < period - 1) return null;
  const slice = candles.slice(index - period + 1, index + 1);
  const sum = slice.reduce((acc, candle) => acc + candle.close, 0);
  return sum / period;
}

/**
 * Рассчитывает RSI (Relative Strength Index)
 */
function calculateRSI(
  candles: Candle[],
  index: number,
  period: number,
): number | null {
  if (index < period) return null;

  let gains = 0;
  let losses = 0;

  for (let i = index - period + 1; i <= index; i++) {
    const difference = candles[i].close - candles[i - 1].close;
    if (difference >= 0) gains += difference;
    else losses -= difference;
  }

  if (losses === 0) return 100;

  const rs = gains / losses;
  return 100 - 100 / (1 + rs);
}

export function checkSignal(
  candles: Candle[],
  index: number,
): Position | null {
  const SMA_PERIOD = 200; // Определяем основной тренд
  const RSI_PERIOD = 14; // Ищем локальную перекупленность
  if (index < SMA_PERIOD || !candles[index]) return null;

  const currentPrice = candles[index].close;
  const sma = calculateSMA(candles, index, SMA_PERIOD);
  const rsi = calculateRSI(candles, index, RSI_PERIOD);

  if (!sma || !rsi) return null;

  // УСЛОВИЯ ДЛЯ ШОРТА:
  // 1. Тренд нисходящий (цена ниже SMA)
  const isDownTrend = currentPrice < sma;
  // 2. Локальный отскок (RSI выше 60-70)
  const isOverbought = rsi > 65;

  if (isDownTrend && isOverbought) {
    const entry = currentPrice;


    return {
      entry,
      stopLoss: entry * 1.2,
      takeProfit: entry * 0.6,
    };
  }

  return null;
}
