import { Candle } from "../types/types";

export function calculateSMA(candles: Candle[], index: number, period: number): number | null {
  if (index < period - 1) return null;
  const slice = candles.slice(index - period + 1, index + 1);
  const sum = slice.reduce((acc, candle) => acc + candle.close, 0);
  return sum / period;
}
