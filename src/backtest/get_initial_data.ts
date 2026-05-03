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
        const candleData = await fs.readFile(path.join(DATA_DIR, `${symbol}.json`), "utf-8");
        candlesBySymbol.set(symbol, JSON.parse(candleData));
      } catch (err) {
        // Если файла нет — просто пропускаем, скачаем ниже
      }
    }
  } catch (e) {
    console.log("Локальный список символов не найден.");
  }

  // --- Логика дозагрузки ---
  
  // Получаем актуальный список пар (если в testMode, ограничиваем количество)
  const pairs = await getTradingPairs();
  const targetSymbols = testMode ? pairs.slice(0, BACKTEST_SYMBOLS_COUNT) : pairs;

  // Обновляем общий список символов в файле
  await fs.writeFile(SYMBOLS_FILE, JSON.stringify(targetSymbols, null, 2));

  for (const symbol of targetSymbols) {
    // ⚡ Ключевая проверка: если данные уже в Map, не идем в API
    if (candlesBySymbol.has(symbol)) {
      continue; 
    }

    const candles = await loadHistoricalCandles(symbol);
    if (candles?.length) {
      candlesBySymbol.set(symbol, candles);
      await fs.writeFile(
        path.join(DATA_DIR, `${symbol}.json`),
        JSON.stringify(candles, null, 2)
      );
      console.log(`Скачан и сохранен: ${symbol}.json`);
    }
  }

  return { 
    symbols: targetSymbols, 
    candlesBySymbol, 
    maxLength: calculateMax(candlesBySymbol) 
  };
}
