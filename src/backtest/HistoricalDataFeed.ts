import { Candle } from "../types/types";

export interface DataFeed {
  getSymbols(): string[];

  getCurrentTimestamp(): number | null;

  next(): number | null;

  getCandle(symbol: string, timestamp: number): Candle | null;

  reset(): void;
}

export class HistoricalDataFeed {
  private data: Map<string, Map<number, Candle>> = new Map();

  private symbols: string[] = [];

  private timeline: number[] = [];

  private currentIndex = 0;

  constructor(historicalData: Map<string, Candle[]>) {
    this.loadData(historicalData);
  }

  private loadData(historicalData: Map<string, Candle[]>) {
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

  getSymbols(): string[] {
    return this.symbols;
  }

  getCurrentTimestamp(): number | null {
    if (this.currentIndex >= this.timeline.length) {
      return null;
    }

    return this.timeline[this.currentIndex];
  }

  next(): number | null {
    this.currentIndex++;

    return this.getCurrentTimestamp();
  }

  getCandle(symbol: string, timestamp: number): Candle | null {
    return this.data.get(symbol)?.get(timestamp) || null;
  }

  reset() {
    this.currentIndex = 0;
  }

  hasNext(): boolean {
    return this.currentIndex < this.timeline.length;
  }
}
