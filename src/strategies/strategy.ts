import {
  STRATEGY_MIN_WEEKLY_GROWTH,
  STRATEGY_RSI_OVERBOUGHT,
  STRATEGY_RSI_PERIOD,
  STRATEGY_SMA_PERIOD_SLOW,
} from "../config/main_config";
import { calculateRSI } from "../indicators/rsi";
import { Candle } from "../types/types";

export function checkSignal(candles: Candle[], index: number): boolean {
  const weeklyOffset = 24 * 7;
  if (
    index < weeklyOffset ||
    index < STRATEGY_SMA_PERIOD_SLOW ||
    !candles[index]
  )
    return false;

  const currentPrice = candles[index].close;
  const priceWeekAgo = candles[index - weeklyOffset].close;

  // 0. Проверка на рост 20% за неделю
  // (Текущая цена / Цена неделю назад) >= 1.20
  const isWeeklyGrowth =
    currentPrice / priceWeekAgo >= STRATEGY_MIN_WEEKLY_GROWTH;

  // const smaSlow = calculateSMA(candles, index, STRATEGY_SMA_PERIOD_SLOW);
  // const smaFast = calculateSMA(candles, index, STRATEGY_SMA_PERIOD_FAST);
  const rsi = calculateRSI(candles, index, STRATEGY_RSI_PERIOD);

  if (!rsi) return false;

  // const isGlobalDownTrend = smaFast < smaSlow;
  // const isPriceCorrection = currentPrice > smaFast;
  const isOverbought = rsi > STRATEGY_RSI_OVERBOUGHT;

  // Теперь сигнал сработает только если актив сильно вырос за неделю,
  // но в моменте начал показывать слабость в рамках нисходящего тренда
  return isWeeklyGrowth && isOverbought;
}
