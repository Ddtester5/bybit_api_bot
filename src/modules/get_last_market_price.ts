import { client } from "../api/bybit_api_client_v5";

export const getLastMarketPrice = async (
  tradingPair: string,
  timestamp?: number,
) => {
  if (timestamp) {
    // Для исторических данных, получить свечу на timestamp
    const candle = await client.getKline({
      category: "linear",
      symbol: tradingPair,
      interval: `1`,
      start: timestamp,
      limit: 1,
    });
    if (candle.result?.list?.length) {
      const lastPrice = candle.result.list[0][4]; // close price
      console.log(
        `historical price to ${tradingPair} at ${timestamp} - ${parseFloat(lastPrice)}`,
      );
      return parseFloat(lastPrice);
    } else {
      console.log("Нет исторических данных для цены");
      return 0;
    }
  } else {
    const marketData = await client.getTickers({
      category: "linear",
      symbol: tradingPair,
    });
    const lastPrice = marketData.result.list[0].lastPrice;
    console.log(`current price to ${tradingPair} - ${parseFloat(lastPrice)}`);
    return parseFloat(lastPrice);
  }
};
