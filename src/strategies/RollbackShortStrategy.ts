import {
  leverage,
  orderLimit,
  riskPercentage,
  stopLossRatio,
  takeProfitRatio,
  week_prise_change,
} from "../config";

import { Broker, Candle, MarketDataProvider } from "../types/types";

export class RollbackShortStrategy {
  private static readonly WEEK_MS = 7 * 24 * 60 * 60 * 1000;

  constructor(
    private broker: Broker,
    private market: MarketDataProvider,
  ) {}

  async execute(candle: Candle, tradingPair: string) {
    const lastPrice = candle.high;
    const weekAgo = candle.timestamp - RollbackShortStrategy.WEEK_MS;
    const priceChange = await this.market.getPriceChange(
      tradingPair,
      candle.timestamp,
      weekAgo,
    );
    if ((await this.broker.openPositionsCount()) >= orderLimit) return;
    if (await this.broker.hasOpenPosition(tradingPair)) return;

    const weekChange = priceChange ?? 0;
    console.log(
      `Price change for ${tradingPair} over the last week: ${weekChange}%`,
    );
    if (weekChange < week_prise_change) return;

    const balance = await this.broker.getAvailableBalance();
    const positionUsd = balance * riskPercentage * leverage;
    const qty = Math.max(1, Math.floor(positionUsd / Math.max(lastPrice, 1)));

    if (isNaN(qty) || qty <= 0) return;

    const stopLoss = lastPrice * (1 + stopLossRatio);
    const takeProfit = lastPrice * (1 - takeProfitRatio);

    await this.broker.setLeverage(tradingPair, leverage);
    const result = await this.broker.submitShortOrder({
      symbol: tradingPair,
      qty,
      stopLoss,
      takeProfit,
    });
    console.log(JSON.stringify(result));
    console.log(
      `Submitted short order for ${tradingPair}: qty=${qty}, entry=${lastPrice}, stopLoss=${stopLoss}, takeProfit=${takeProfit}`,
    );
  }
}
