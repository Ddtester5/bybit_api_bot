import { client } from "../api/bybit_api_client_v5";

export async function getPriceChange(tradingPair: string, time: number) {
  try {
    const candleStart = await client.getKline({
      category: "linear",
      symbol: tradingPair,
      interval: `1`,
      start: time,
      limit: 1,
    });
    const candleNow = await client.getKline({
      category: "linear",
      symbol: tradingPair,
      interval: `1`,
      limit: 1,
    });

    if (!candleStart.result?.list?.length || !candleNow.result?.list?.length) {
      console.log("Нет данных для расчета изменения цены");
      return null;
    }

    const priceAtStart = parseFloat(candleStart.result.list[0][4]);
    const priceNow = parseFloat(candleNow.result.list[0][4]);

    const priceChangePercent = ((priceNow - priceAtStart) / priceAtStart) * 100;

    return priceChangePercent;
  } catch (error) {
    console.error("Ошибка при расчете изменения цены:", error);
    return null;
  }
}
