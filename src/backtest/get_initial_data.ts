import { getTradingPairs } from "../api/get_tradings_pair";
import { loadHistoricalCandles } from "../api/loadHistoricalCandles";
import { BACKTEST_SYMBOLS_COUNT } from "../config/main_config";
import { Candle } from "../types/types";
import fs from "fs/promises";
import path from "path";

const DATA_DIR = "./data";
const SYMBOLS_FILE = path.join(DATA_DIR, "symbols.json");

export async function getInitialData({ testMode }: { testMode: boolean }) {
  const candlesBySymbol = new Map<string, Candle[]>();
  let symbols: string[] = [];
  const new_symbols: string[] = [];
  try {
    // 1. Пытаемся создать папку, если её нет
    await fs.mkdir(DATA_DIR, { recursive: true });

    // 2. Проверяем наличие списка символов
    const symbolsRaw = await fs.readFile(SYMBOLS_FILE, "utf-8");
    symbols = JSON.parse(symbolsRaw);
    console.log(`Загружено ${symbols.length} пар из списка`);

    // 3. Загружаем свечи для каждой пары из отдельных файлов
    for (const symbol of symbols) {
      try {
        const candleData = await fs.readFile(
          path.join(DATA_DIR, `${symbol}.json`),
          "utf-8",
        );
        candlesBySymbol.set(symbol, JSON.parse(candleData));
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        console.warn(`Файл для ${symbol} не найден, будет скачан.`);
        new_symbols.push(symbol);
      }
    }

    if (candlesBySymbol.size === symbols.length) {
      console.log("Все данные успешно загружены из локальных файлов");
      return {
        symbols,
        candlesBySymbol,
        maxLength: calculateMax(candlesBySymbol),
      };
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    console.log("Локальные данные не полные, начинаем загрузку из API...");
  }

  // --- Логика загрузки из API ---
  const pairs = await getTradingPairs();
  symbols = testMode ? pairs.slice(0, BACKTEST_SYMBOLS_COUNT) : pairs;

  // Сохраняем список пар
  await fs.writeFile(SYMBOLS_FILE, JSON.stringify(symbols, null, 2));

  for (const symbol of new_symbols) {
    const candles = await loadHistoricalCandles(symbol);
    if (candles?.length) {
      candlesBySymbol.set(symbol, candles);
      // Сохраняем каждую пару в отдельный файл
      await fs.writeFile(
        path.join(DATA_DIR, `${symbol}.json`),
        JSON.stringify(candles, null, 2),
      );
      console.log(`Сохранен файл: ${symbol}.json`);
    }
  }

  return {
    symbols,
    candlesBySymbol,
    maxLength: calculateMax(candlesBySymbol),
  };
}

// Вспомогательная функция для расчета макс. длины
function calculateMax(map: Map<string, Candle[]>) {
  let max = 0;
  for (const c of map.values()) if (c.length > max) max = c.length;
  return max;
}
