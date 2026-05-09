import { Candle } from "../types/types";

export function calculateATR(candles: Candle[], index: number, period: number): number | null {
  if (index < period) return null;

  let sumTR = 0;

  for (let i = index - period + 1; i <= index; i++) {
    const current = candles[i];
    const prev = candles[i - 1];

    if (!current || !prev) continue;

    const tr = Math.max(
      current.high - current.low,
      Math.abs(current.high - prev.close),
      Math.abs(current.low - prev.close),
    );

    sumTR += tr;
  }

  return sumTR / period;
}
