import { KlineIntervalV3 } from "bybit-api";
import { client } from "../api/bybit_api_client_v5";
import { Candle } from "../types/types";

export async function loadHistoricalCandles(
  symbol: string,
  hours: number = 180 * 24,
  candle_interval: number = 60,
): Promise<Candle[]> {
  const candles: Candle[] = [];
  const limit = 1000;
  let startTime = Date.now() - hours * 60 * 60 * 1000;

  while (candles.length < hours) {
    const response = await client.getKline({
      category: "linear",
      symbol,
      interval: candle_interval.toString() as KlineIntervalV3,
      start: startTime,
      limit,
    });
    if (!response.result?.list?.length) break;
    const newCandles = response.result.list
      .map((c: string[]) => ({
        timestamp: Number(c[0]),
        open: Number(c[1]),
        high: Number(c[2]),
        low: Number(c[3]),
        close: Number(c[4]),
        volume: Number(c[5]),
        turnover: Number(c[6]),
      }))
      .filter(
        (candle) =>
          !isNaN(candle.open) &&
          !isNaN(candle.high) &&
          !isNaN(candle.low) &&
          !isNaN(candle.close) &&
          !isNaN(candle.volume),
      );
    candles.push(...newCandles);
    if (newCandles.length > 0) {
      startTime =
        newCandles[newCandles.length - 1].timestamp +
        candle_interval * 60 * 1000;
    }
    if (newCandles.length < limit) break;
  }
  return candles.slice(0, hours);
}
