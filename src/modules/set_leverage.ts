import { client } from "../api/bybit_api_client_v5";

export const setLeverage = async (tradingPair: string, leverage: number) => {
  try {
    await client.setLeverage({
      category: "linear",
      symbol: tradingPair,
      buyLeverage: `${leverage}`,
      sellLeverage: `${leverage}`,
    });

    console.log("✅ Плечо `${leverage}` установлено.");
  } catch (error) {
    console.error("❌ Ошибка при установке плеча:", error);
  }
};
