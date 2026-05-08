import { RestClientV5 } from "bybit-api";

export const setLeverage = async ({
  client,
  leverage,
  tradingPair,
}: {
  tradingPair: string;
  leverage: number;
  client: RestClientV5;
}) => {
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
