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

  try {
    await fs.mkdir(DATA_DIR, { recursive: true });

    // Пытаемся прочитать существующий список символов
    const symbolsRaw = await fs.readFile(SYMBOLS_FILE, "utf-8");
    symbols = JSON.parse(symbolsRaw);

    // Загружаем то, что уже есть на диске
    for (const symbol of symbols) {
      try {
        const candleData = await fs.readFile(
          path.join(DATA_DIR, `${symbol}.json`),
          "utf-8",
        );
        candlesBySymbol.set(symbol, JSON.parse(candleData));
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        // Если файла нет — просто пропускаем, скачаем ниже
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    console.log("Локальный список символов не найден.");
  }

  // --- Логика дозагрузки ---
  console.log(symbols.length);
  console.log(candlesBySymbol.size);
  // Получаем актуальный список пар (если в testMode, ограничиваем количество)
  if (symbols.length === 0) {
    const pairs = await getTradingPairs();
    symbols = testMode ? pairs.slice(0, BACKTEST_SYMBOLS_COUNT) : pairs;

    // Обновляем общий список символов в файле
    await fs.writeFile(SYMBOLS_FILE, JSON.stringify(symbols, null, 2));
  }
  for (const symbol of symbols) {
    // ⚡ Ключевая проверка: если данные уже в Map, не идем в API
    if (candlesBySymbol.has(symbol)) {
      //  console.log(`Данные для ${symbol} уже загружены из файла.`);
      continue;
    }

    const candles = await loadHistoricalCandles(symbol);
    if (candles?.length) {
      candlesBySymbol.set(symbol, candles);
      await fs.writeFile(
        path.join(DATA_DIR, `${symbol}.json`),
        JSON.stringify(candles, null, 2),
      );
      console.log(`Скачан и сохранен: ${symbol}.json`);
    }
  }
  return {
    symbols,
    candlesBySymbol,
    maxLength: calculateMax(candlesBySymbol),
  };
}
function calculateMax(map: Map<string, Candle[]>) {
  let max = 0;
  for (const c of map.values()) if (c.length > max) max = c.length;
  return max;
}
