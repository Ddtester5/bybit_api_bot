import {
  STRATEGY_RSI_OVERBOUGHT,
  STRATEGY_RSI_PERIOD,
  STRATEGY_SMA_PERIOD_FAST,
  STRATEGY_SMA_PERIOD_SLOW,
} from "../config/main_config";
import { calculateRSI } from "../indicators/rsi";
import { calculateSMA } from "../indicators/sma";
import { Candle } from "../types/types";

export function checkSignal(candles: Candle[], index: number): boolean {
  if (index < STRATEGY_SMA_PERIOD_SLOW || !candles[index]) return false;

  const currentPrice = candles[index].close;
  const smaSlow = calculateSMA(candles, index, STRATEGY_SMA_PERIOD_SLOW);
  const smaFast = calculateSMA(candles, index, STRATEGY_SMA_PERIOD_FAST);
  const rsi = calculateRSI(candles, index, STRATEGY_RSI_PERIOD);

  if (!smaSlow || !smaFast || !rsi) return false;

  // 1. Глобально падаем (быстрая под медленной)
  const isGlobalDownTrend = smaFast < smaSlow;

  // 2. Цена находится в зоне между средней и быстрой (коррекция)
  const isPriceCorrection = currentPrice > smaFast;

  // 3. RSI подтверждает перекупленность на откате
  const isOverbought = rsi > STRATEGY_RSI_OVERBOUGHT;

  // Сигнал: Тренд вниз, но сейчас случился заброс цены вверх + RSI перегрет
  return isGlobalDownTrend && isPriceCorrection && isOverbought;
}
