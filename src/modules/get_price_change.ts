import { client } from "../api/bybit_api_client_v5";

export async function getPriceChange(
  tradingPair: string,
  startTime: number,
  endTime: number,
) {
  try {
    const candleStart = await client.getKline({
      category: "linear",
      symbol: tradingPair,
      interval: `1`,
      start: startTime,
      limit: 1,
    });
    const candleEnd = await client.getKline({
      category: "linear",
      symbol: tradingPair,
      interval: `1`,
      start: endTime,
      limit: 1,
    });

    if (!candleStart.result?.list?.length || !candleEnd.result?.list?.length) {
      console.log("Нет данных для расчета изменения цены");
      return null;
    }

    const priceAtStart = parseFloat(candleStart.result.list[0][4]);
    const priceAtEnd = parseFloat(candleEnd.result.list[0][4]);
    if (
      isNaN(priceAtStart) ||
      isNaN(priceAtEnd) ||
      priceAtStart <= 0 ||
      priceAtEnd <= 0
    )
      return null;
    const priceChangePercent =
      ((priceAtEnd - priceAtStart) / priceAtStart) * 100;

    return priceChangePercent;
  } catch (error) {
    console.error("Ошибка при расчете изменения цены:", error);
    return null;
  }
}
