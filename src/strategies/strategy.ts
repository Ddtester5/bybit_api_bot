import { Candle } from "../types/types";

export type Position = {
  entry: number;
  stopLoss: number;
  takeProfit: number;
  qty:number;
};

export function checkSignal(candles: Candle[], index: number,balance:number): Position | null {
  // Нужно минимум 7 дней (если 1h свечи → 168)
  const LOOKBACK = 24 * 7;

  if (index < LOOKBACK) return null;

  const current = candles[index];
  const weekAgo = candles[index - LOOKBACK];

  const change = ((current.close - weekAgo.close) / weekAgo.close) * 100;

  // твоя идея: если рост > X → шорт
  if (change < 50) return null;

  const entry = current.close;
const qty = (balance * 0.01) / entry
  return {
    entry,
    stopLoss: entry * 1.1,
    takeProfit: entry * 0.8,
    qty
  };
}
