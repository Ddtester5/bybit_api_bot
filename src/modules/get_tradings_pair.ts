import { client } from "../api/bybit_api_client_v5";

export const getTradingPairs = async () => {
  try {
    const response = await client.getInstrumentsInfo({
      category: "linear", // USDT контракты (можно поменять на "spot" для спотового рынка)
    });

    const tradingPairs = response.result.list.map((pair) => pair.symbol);
    console.log("📜 Доступные торговые пары:", tradingPairs);
    return tradingPairs;
  } catch (error) {
    console.error("❌ Ошибка при получении списка торговых пар:", error);
    return [];
  }
};
