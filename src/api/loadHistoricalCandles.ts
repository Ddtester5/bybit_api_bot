import { KlineIntervalV3 } from "bybit-api";
import {
  BACKTEST_CANDLES_COUNT,
  BACKTEST_CANDLE_INTERVAL,
} from "../config/main_config";
import { Candle } from "../types/types";
import { client } from "./bybit_api_client_v5";

export async function loadHistoricalCandles(
  symbol: string,
  hours: number = BACKTEST_CANDLES_COUNT,
  candle_interval: number = BACKTEST_CANDLE_INTERVAL,
): Promise<Candle[]> {
  const candles: Candle[] = [];
  const limit = 200; // Лимит для V5 Linear
  const totalNeeded = Math.floor((hours * 60) / candle_interval);

  // Рассчитываем точку старта (самая старая свеча)
  let startTime = Date.now() - hours * 60 * 60 * 1000;

  while (candles.length < totalNeeded) {
    const response = await client.getKline({
      category: "linear",
      symbol,
      interval: candle_interval.toString() as KlineIntervalV3,
      start: startTime,
      limit,
    });

    const list = response.result?.list || [];
    if (!list.length) break;

    // Bybit V5 возвращает [0] - самая новая, [last] - самая старая.
    // Для удобства бэктеста разворачиваем, чтобы было по порядку.
    const newCandles = list
      .map((c: string[]) => ({
        symbol,
        timestamp: Number(c[0]),
        open: Number(c[1]),
        high: Number(c[2]),
        low: Number(c[3]),
        close: Number(c[4]),
        volume: Number(c[5]),
        turnover: Number(c[6]),
      }))
      .reverse();

    candles.push(...newCandles);

    // Следующий запрос начинаем с времени последней полученной свечи + 1 интервал
    startTime =
      newCandles[newCandles.length - 1].timestamp + candle_interval * 60 * 1000;

    if (list.length < limit) break;
  }

  return candles.slice(0, totalNeeded);
}
