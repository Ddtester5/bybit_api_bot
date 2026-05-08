import { RestClientV5 } from "bybit-api";

export const getLastMarketPrice = async ({
  tradingPair,
  client,
}: {
  tradingPair: string;
  client: RestClientV5;
}) => {
  const marketData = await client.getTickers({
    category: "linear",
    symbol: tradingPair,
  });
  const lastPrice = marketData.result.list[0].lastPrice;
  return parseFloat(lastPrice);
};
