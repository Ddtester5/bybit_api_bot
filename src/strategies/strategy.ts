import {
  STRATEGY_RSI_PERIOD,
  STRATEGY_SMA_PERIOD_FAST,
  STRATEGY_SMA_PERIOD_SLOW,
} from "../config/main_config";

import { calculateRSI } from "../indicators/rsi";
import { calculateEMA } from "../indicators/ema";
import { calculateATR } from "../indicators/atr";
import { Candle } from "../types/types";

export function checkSignal(
  candles: Candle[],
  index: number,
  rsiOverbought: number,
): boolean {
  // === защита от нехватки данных ===
  if (index < STRATEGY_SMA_PERIOD_SLOW + 5) return false;

  const current = candles[index];
  const prev = candles[index - 1];
  const prev2 = candles[index - 2];

  if (!current || !prev || !prev2) return false;

  const price = current.close;

  // === индикаторы ===
  const emaSlow = calculateEMA(candles, index, STRATEGY_SMA_PERIOD_SLOW);
  const emaFast = calculateEMA(candles, index, STRATEGY_SMA_PERIOD_FAST);
  const rsi = calculateRSI(candles, index, STRATEGY_RSI_PERIOD);
  const prevRsi = calculateRSI(candles, index - 1, STRATEGY_RSI_PERIOD);
  const atr = calculateATR(candles, index, 14);

  if (!emaSlow || !emaFast || !rsi || !prevRsi || !atr) return false;

  // =========================================================
  // 1. СИЛЬНЫЙ НИСХОДЯЩИЙ ТРЕНД
  // =========================================================
  const trendStrength = (emaSlow - emaFast) / emaSlow;
  const isStrongDownTrend =
    price < emaSlow &&
    emaFast < emaSlow &&
    trendStrength > 0.005; // фильтр силы тренда

  // =========================================================
  // 2. АДАПТИВНЫЙ ОТКАТ (через ATR)
  // =========================================================
  const deviation = (price - emaFast) / atr;
  const isPullback = deviation > 1.2;

  // =========================================================
  // 3. ВОЛАТИЛЬНОСТЬ (не торгуем мертвый рынок)
  // =========================================================
  const atrPercent = atr / price;
  const isVolatile = atrPercent > 0.003;

  // =========================================================
  // 4. RSI: перекупленность + разворот вниз
  // =========================================================
  const isOverbought = rsi > rsiOverbought;
  const isRSITurningDown = rsi < prevRsi;

  // =========================================================
  // 5. СВЕЧНОЙ РАЗВОРОТ
  // =========================================================
  const isReversal =
    prev.close < prev.open &&   // красная свеча
    prev2.close > prev2.open;  // до этого была зеленая

  // =========================================================
  // 6. АНТИ-ПАМП (не ловим ножи)
  // =========================================================
  const lastMove = (price - prev.close) / prev.close;
  const isNotParabolic = lastMove < 0.03;

  // =========================================================
  // FINAL SIGNAL
  // =========================================================
  return (
    isStrongDownTrend &&
    isPullback &&
    isVolatile &&
    isOverbought &&
    isRSITurningDown &&
    isReversal &&
    isNotParabolic
  );
}
