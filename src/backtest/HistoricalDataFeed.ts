import { Candle } from "../types/types";

export class HistoricalDataFeed {
  private data = new Map<string, Map<number, Candle>>();

  private symbols: string[] = [];

  private timeline: number[] = [];

  private currentIndex = 0;

  constructor(historicalData: Map<string, Candle[]>) {
    const allTimestamps = new Set<number>();

    for (const [symbol, candles] of historicalData) {
      this.symbols.push(symbol);

      const symbolMap = new Map<number, Candle>();

      for (const candle of candles) {
        symbolMap.set(candle.timestamp, candle);

        allTimestamps.add(candle.timestamp);
      }

      this.data.set(symbol, symbolMap);
    }

    this.timeline = Array.from(allTimestamps).sort((a, b) => a - b);
  }

  getSymbols() {
    return this.symbols;
  }

  getCurrentTimestamp() {
    return this.timeline[this.currentIndex] || null;
  }

  next() {
    this.currentIndex++;
  }

  hasNext() {
    return this.currentIndex < this.timeline.length;
  }

  getCandle(symbol: string, timestamp: number) {
    return this.data.get(symbol)?.get(timestamp) || null;
  }
}
