import { KlineIntervalV3, OHLCVKlineV5 } from "bybit-api";
import { client } from "../api/bybit_api_client_v5";

export const getHistoryData = async (
  tradingPair: string,
  candlesCount: number,
  timefreim: KlineIntervalV3,
): Promise<OHLCVKlineV5[]> => {
  const candles = await client.getKline({
    category: "linear",
    symbol: tradingPair,
    interval: timefreim,
    limit: candlesCount,
  });
  const dataLists = candles.result.list;
  return dataLists;
};
