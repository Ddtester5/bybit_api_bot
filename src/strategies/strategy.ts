import { calculateEMA } from "../indicators/ema";
import { calculateRSI } from "../indicators/rsi";
import { Candle } from "../types/types";

export function checkSignal({
  candles,
  index,
  rsiOverbought,
  rsi_period,
  sma_fast,
  sma_slow,
}: {
  candles: Candle[];
  index: number;
  rsiOverbought: number;
  rsi_period: number;
  sma_fast: number;
  sma_slow: number;
}): boolean {
  // Недостаточно данных
  if (index < sma_slow + 2) return false;

  const current = candles[index];
  const prev = candles[index - 1];
  const prev2 = candles[index - 2];

  if (!current || !prev || !prev2) return false;

  const currentPrice = current.close;

  const emaSlow = calculateEMA(candles, index, sma_slow);
  const emaFast = calculateEMA(candles, index, sma_fast);
  const rsi = calculateRSI(candles, index, rsi_period);

  if (!emaSlow || !emaFast || !rsi) return false;

  // === 1. Глобальный нисходящий тренд ===
  const isDownTrend = currentPrice < emaSlow;

  // === 2. Сильный откат вверх ===
  const deviation = (currentPrice - emaFast) / emaFast;
  const isStrongPullback = deviation > 0.02; // >2% откат

  // === 3. Перекупленность ===
  const isOverbought = rsi > rsiOverbought; // ставь 70–75

  // === 4. Подтверждение разворота ===
  const isReversal =
    prev.close < prev.open && // красная свеча
    prev2.close > prev2.open; // перед ней была зеленая

  // === Итоговый сигнал ===
  return isDownTrend && isStrongPullback && isOverbought && isReversal;
}
