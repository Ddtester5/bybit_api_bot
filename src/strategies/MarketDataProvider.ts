import { getPriceChange } from "../modules/get_price_change";
import { MarketDataProvider } from "../types/types";

export class BybitMarketData implements MarketDataProvider {
  private priceChangeCache = new Map<string, number | null>();

  async getPriceChange(
    symbol: string,
    startTimestamp: number,
    endTimestamp: number,
  ): Promise<number | null> {
    const key = `${symbol}-${startTimestamp}-${endTimestamp}`;
    if (this.priceChangeCache.has(key)) {
      return this.priceChangeCache.get(key)!;
    }
    const result = await getPriceChange(symbol, startTimestamp, endTimestamp);
    this.priceChangeCache.set(key, result);
    return result;
  }
}
