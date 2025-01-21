import moment from "moment";
import { client } from "../api/bybit_api_client_v5";

// Получаем исторические данные за последний месяц
export const getBacktestData = async (tradingPair: string) => {
  const oneMonthAgo = moment().subtract(1, "month").unix(); // Метка времени для месяца назад
  const now = moment().unix(); // Текущая метка времени

  const candles = await client.getKline({
    category: "linear",
    symbol: tradingPair,
    interval: "5",
    start: oneMonthAgo * 1000, // Начало периода в миллисекундах
    end: now * 1000, // Конец периода в миллисекундах
  });

  const historicalData = candles.result.list.map((candle) => ({
    open: parseFloat(candle[1]),
    high: parseFloat(candle[2]),
    low: parseFloat(candle[3]),
    close: parseFloat(candle[4]),
    timestamp: candle[0],
  }));

  console.log(`Загружено ${historicalData.length} свечей за последний месяц.`);
  return historicalData;
};
