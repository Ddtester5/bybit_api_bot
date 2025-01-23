import moment from "moment";
import { client } from "../api/bybit_api_client_v5";
import { CandleData } from "../types/types";
import { OHLCVKlineV5 } from "bybit-api";
import { timeFrame } from "../config";

// Получаем исторические данные за последний месяц
export const getBacktestData = async (
  tradingPair: string,
): Promise<CandleData[]> => {
  const oneMonthAgo = moment().subtract(1, "month").unix() * 1000; // Метка времени для месяца назад
  const now = moment().unix() * 1000; // Текущая метка времени
  const limit = 200; // Максимальное количество свечей за один запрос
  const intervalMs = timeFrame * 60 * 1000; // Интервал одной свечи (5 минут) в миллисекундах
  const timeRangeMs = limit * intervalMs; // 200 свечей = 200 * 5 минут в миллисекундах
  let startTime = oneMonthAgo; // Начало временного интервала
  let historicalData: CandleData[] = []; // Массив для хранения всех свечей

  try {
    while (startTime < now) {
      // Запрос данных свечей
      const candles = await client.getKline({
        category: "linear",
        symbol: tradingPair,
        interval: `${timeFrame}`,
        start: startTime,
        end: Math.min(startTime + timeRangeMs, now), // Расчет конечного времени для текущего запроса
      });

      if (
        !candles.result ||
        !candles.result.list ||
        candles.result.list.length === 0
      ) {
        console.log("Данные закончились или API вернул пустой результат.");
        break; // Выход из цикла, если данных больше нет
      }

      // Преобразование данных
      const data = candles.result.list.map((candle: OHLCVKlineV5) => ({
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
        timestamp: parseFloat(candle[0]),
      }));

      // Добавление полученных данных в общий массив
      historicalData = historicalData.concat(data);

      // Установка нового времени старта для следующего запроса
      startTime += timeRangeMs; // Смещаем startTime на 1000 минут (200 свечей * 5 минут)

      console.log(
        `Получено ${data.length} свечей. Текущий прогресс: ${new Date(
          startTime,
        ).toISOString()}`,
      );
    }

    console.log(
      `Загружено всего ${historicalData.length} свечей за последний месяц.`,
    );
    return historicalData;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Ошибка при получении исторических данных:", error.message);
    throw error;
  }
};
