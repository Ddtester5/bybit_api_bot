import { Signal } from "../backtest/Signal";
import {
  leverage,
  riskPercentage,
  stopLossRatio,
  takeProfitRatio,
  week_prise_change,
} from "../config";
import { Broker, Candle, MarketDataProvider } from "../types/types";

export class RollbackShortStrategy {
  private history = new Map<string, Candle[]>();

  private static WEEK_MS = 7 * 24 * 60 * 60 * 1000;

  // For live trading
  private broker?: Broker;
  private marketDataProvider?: MarketDataProvider;

  constructor(broker?: Broker, marketDataProvider?: MarketDataProvider) {
    this.broker = broker;
    this.marketDataProvider = marketDataProvider;
  }

  onCandle(candle: Candle, symbol: string): Signal | null {
    // === сохраняем историю ===
    if (!this.history.has(symbol)) {
      this.history.set(symbol, []);
    }

    const arr = this.history.get(symbol)!;
    arr.push(candle);

    // === нужно минимум неделя данных ===
    const weekAgoTs = candle.timestamp - RollbackShortStrategy.WEEK_MS;

    const weekCandle = arr.find((c) => c.timestamp >= weekAgoTs);

    if (!weekCandle) return null;

    // === считаем изменение цены ===
    const priceChange =
      ((candle.close - weekCandle.close) / weekCandle.close) * 100;

    if (priceChange < week_prise_change) return null;

    // === считаем позицию ===
    const lastPrice = candle.close;

    const positionUsd = 10000 * riskPercentage * leverage;

    const qty = Math.max(1, Math.floor(positionUsd / Math.max(lastPrice, 1)));

    if (!qty || isNaN(qty)) return null;

    const stopLoss = lastPrice * (1 + stopLossRatio);

    const takeProfit = lastPrice * (1 - takeProfitRatio);

    return {
      symbol,
      side: "short",
      entryPrice: lastPrice,
      stopLoss,
      takeProfit,
      qty,
    };
  }

  async execute(candle: Candle, symbol: string): Promise<void> {
    if (!this.broker) {
      throw new Error("Broker not provided for live trading mode");
    }

    const signal = this.onCandle(candle, symbol);

    if (!signal) {
      return;
    }

    try {
      // Check if we already have a position
      const hasPosition = await this.broker.hasOpenPosition(signal.symbol);

      if (hasPosition) {
        console.log(`Already have position for ${signal.symbol}, skip`);
        return;
      }

      // Set leverage
      await this.broker.setLeverage(signal.symbol, leverage);

      // Submit order
      await this.broker.submitShortOrder({
        symbol: signal.symbol,
        qty: signal.qty,
        stopLoss: signal.stopLoss,
        takeProfit: signal.takeProfit,
      });

      console.log(
        `Order submitted for ${signal.symbol}: qty=${signal.qty}, SL=${signal.stopLoss}, TP=${signal.takeProfit}`,
      );
    } catch (error) {
      console.error(`Error executing order for ${symbol}:`, error);
    }
  }
}
