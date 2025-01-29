import moment from "moment";
import { client } from "../api/bybit_api_client_v5";

export async function get24hPriceChange(tradingPair: string, time?: number) {
  try {
    const now = time ? time : moment().unix() * 1000; // Текущая временная метка
    const oneDayAgo = now - 24 * 60 * 60 * 1000; // Метка времени 24 часа назад

    // Получаем свечи для анализа
    const candleAgo = await client.getKline({
      category: "linear",
      symbol: tradingPair,
      interval: `1`, // Интервал свечей 5 минут
      start: oneDayAgo, // Начало периода
      limit: 1,
    });
    const candleNow = await client.getKline({
      category: "linear",
      symbol: tradingPair,
      interval: `1`, // Интервал свечей 5 минут

      limit: 1,
    });
    if (
      !candleAgo.result ||
      !candleAgo.result.list ||
      candleAgo.result.list.length === 0 ||
      !candleNow.result ||
      !candleNow.result.list ||
      candleNow.result.list.length === 0
    ) {
      console.log("Нет данных для расчета изменения цены за 24 часа.");
      return null;
    }

    // Текущая цена
    const currentPrice = parseFloat(candleNow.result.list[0][4]);
    // Цена 24 часа назад
    const price24hAgo = parseFloat(candleAgo.result.list[0][4]);
    // Рассчитываем изменение в процентах
    const priceChangePercent =
      ((currentPrice - price24hAgo) / price24hAgo) * 100;

    console.log(`Изменение цены за 24 часа: ${priceChangePercent.toFixed(2)}%`);
    return priceChangePercent;
  } catch (error) {
    console.error("Ошибка при расчете изменения цены за 24 часа:", error);
    throw error;
  }
}
