import { Candle } from "../types/types";

export function calculateRSI(candles: Candle[], index: number, period: number): number | null {
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
