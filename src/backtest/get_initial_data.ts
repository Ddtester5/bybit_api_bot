import { getTradingPairs } from "../api/get_tradings_pair";
import { loadHistoricalCandles } from "../api/loadHistoricalCandles";
import { BACKTEST_SYMBOLS_COUNT } from "../config/main_config";
import { Candle } from "../types/types";
import fs from "fs/promises";

const CACHE_FILE = "./data_cache.json";

export async function getInitialData({ testMode }: { testMode: boolean }) {
  // 1. Пытаемся прочитать кэш
  try {
    const rawData = await fs.readFile(CACHE_FILE, "utf-8");
    const cache = JSON.parse(rawData);

    // Преобразуем объект обратно в Map (JSON не умеет хранить Map напрямую)
    const candlesBySymbol = new Map<string, Candle[]>(
      Object.entries(cache.candlesBySymbol),
    );

    console.log("Данные загружены из кэша");
    return {
      symbols: cache.symbols,
      candlesBySymbol,
      maxLength: cache.maxLength,
    };
  } catch (e) {
    console.log("Кэш не найден или поврежден, загружаем из API...", e);
  }

  // 2. Логика загрузки из API (ваш старый код)
  const pairs = await getTradingPairs();
  const symbols = testMode ? pairs.slice(0, BACKTEST_SYMBOLS_COUNT) : pairs;
  const candlesBySymbol = new Map<string, Candle[]>();

  for (const symbol of symbols) {
    const candles = await loadHistoricalCandles(symbol);
    if (candles?.length) {
      candlesBySymbol.set(symbol, candles);
    }
  }

  let maxLength = 0;
  for (const candles of candlesBySymbol.values()) {
    if (candles.length > maxLength) maxLength = candles.length;
  }

  const result = { symbols, candlesBySymbol, maxLength };

  // 3. Сохраняем в файл для следующего раза
  const dataToSave = {
    ...result,
    candlesBySymbol: Object.fromEntries(candlesBySymbol), // Map -> Object для JSON
  };

  await fs.writeFile(CACHE_FILE, JSON.stringify(dataToSave, null, 2));

  return result;
}
