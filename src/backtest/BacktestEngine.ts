import { HistoricalDataFeed } from "./HistoricalDataFeed";

import { Portfolio } from "./Portfolio";

import { Signal } from "./Signal";

export class BacktestEngine {
  constructor(
    private feed: HistoricalDataFeed,

    private portfolio: Portfolio,

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private strategy: any,
  ) {}

  run() {
    let pendingOrders: Signal[] = [];

    while (this.feed.hasNext()) {
      const ts = this.feed.getCurrentTimestamp();

      // Исполняем сигналы
      for (const order of pendingOrders) {
        this.portfolio.openShort({
          ...order,

          timestamp: ts!,
        });
      }

      pendingOrders = [];

      for (const symbol of this.feed.getSymbols()) {
        const candle = this.feed.getCandle(symbol, ts!);

        if (!candle) continue;

        // Обновить рынок
        this.portfolio.updateMarket(candle);

        // Получить сигнал
        const signal = this.strategy.onCandle(candle, symbol);

        if (signal) {
          pendingOrders.push(signal);
        }
      }

      this.feed.next();
    }
  }
}
