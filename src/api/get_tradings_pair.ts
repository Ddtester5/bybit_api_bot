import { RestClientV5 } from "bybit-api";

export const getTradingPairs = async ({ client }: { client: RestClientV5 }) => {
  try {
    const response = await client.getInstrumentsInfo({
      category: "linear",
    });

    const tradingPairs = response.result.list.filter((pair) => pair.symbol.includes("USDT")).map((pair) => pair.symbol);
    console.log("starting to check pairs :", tradingPairs.length);
    return tradingPairs;
  } catch (error) {
    console.error("❌ Ошибка при получении списка торговых пар:", error);
    return [];
  }
};
