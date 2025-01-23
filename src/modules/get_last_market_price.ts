import { client } from "../api/bybit_api_client_v5";

export const getLastMarketPrice = async (tradingPair: string) => {
  const marketData = await client.getTickers({
    category: "linear",
    symbol: tradingPair,
  });
  const lastPrice = marketData.result.list[0].lastPrice;
  return parseFloat(lastPrice);
};
