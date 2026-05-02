import { getTradingPairs } from "../api/get_tradings_pair";
import { loadHistoricalCandles } from "../api/loadHistoricalCandles";
import { BACKTEST_SYMBOLS_COUNT } from "../config/main_config";
import { Candle } from "../types/types";

export async function getInitialData({ testMode }: { testMode: boolean }) {
  const pairs = await getTradingPairs();
  let symbols: string[] = [];
  if (testMode) {
    symbols = pairs.slice(0, BACKTEST_SYMBOLS_COUNT);
  } else {
    symbols = pairs;
  }
  const candlesBySymbol = new Map<string, Candle[]>();
  for (const symbol of symbols) {
    const candles = await loadHistoricalCandles(symbol);
    if (!candles?.length) {
      console.warn(`${symbol}: empty data`);
      continue;
    }

    candlesBySymbol.set(symbol, candles);
  }
  let maxLength = 0;
  for (const candles of candlesBySymbol.values()) {
    if (candles.length > maxLength) maxLength = candles.length;
  }
  return { symbols, candlesBySymbol, maxLength };
}
