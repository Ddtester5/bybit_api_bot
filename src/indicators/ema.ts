import { Candle } from "../types/types";

export function calculateEMA(
  candles: Candle[],
  index: number,
  period: number,
  previousEma: number | null = null,
): number | null {
  // Если данных меньше, чем период, EMA не считается
  if (index < period - 1) return null;

  const closePrice = candles[index].close;
  const multiplier = 2 / (period + 1);

  // Если это самая первая точка расчета (точка старта)
  if (previousEma === null) {
    // В качестве первой EMA обычно берут SMA за этот период
    const slice = candles.slice(index - period + 1, index + 1);
    const sma = slice.reduce((acc, candle) => acc + candle.close, 0) / period;
    return sma;
  }

  // Формула EMA: (Close - PreviousEMA) * Multiplier + PreviousEMA
  return (closePrice - previousEma) * multiplier + previousEma;
}
