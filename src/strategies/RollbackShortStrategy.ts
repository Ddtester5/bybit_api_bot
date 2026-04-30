import { Candle } from "../types/types";
import { Signal } from "../backtest/Signal";
import {
    leverage,
        riskPercentage,
          stopLossRatio,
            takeProfitRatio,
              week_prise_change,
} from "../config";

export class RollbackShortStrategy {

    private history = new Map<string, Candle[]>();

      private static WEEK_MS =
          7 * 24 * 60 * 60 * 1000;


            onCandle(
                  candle: Candle,
                      symbol: string
            ): Signal | null {

                  // === сохраняем историю ===

                      if (!this.history.has(symbol)) {
                              this.history.set(symbol, []);
                      }

                          const arr =
                                this.history.get(symbol)!;

                                    arr.push(candle);


                                        // === нужно минимум неделя данных ===

                                            const weekAgoTs =
                                                  candle.timestamp -
                                                        RollbackShortStrategy.WEEK_MS;


                                                            const weekCandle =
                                                                  arr.find(
                                                                            c => c.timestamp >= weekAgoTs
                                                                  );

                                                                      if (!weekCandle) return null;


                                                                          // === считаем изменение цены ===

                                                                              const priceChange =
                                                                                    ((candle.close - weekCandle.close)
                                                                                          / weekCandle.close) * 100;


                                                                                              if (priceChange < week_prise_change)
                                                                                                      return null;


                                                                                                  // === считаем позицию ===

                                                                                                      const lastPrice =
                                                                                                            candle.close;


                                                                                                                const positionUsd =
                                                                                                                      10000 * riskPercentage * leverage;


                                                                                                                          const qty =
                                                                                                                                Math.max(
                                                                                                                                          1,
                                                                                                                                                  Math.floor(
                                                                                                                                                              positionUsd /
                                                                                                                                                                        Math.max(lastPrice, 1)
                                                                                                                                                  )
                                                                                                                                                );


                                                                                                                                                    if (!qty || isNaN(qty))
                                                                                                                                                            return null;


                                                                                                                                                        const stopLoss =
                                                                                                                                                              lastPrice *
                                                                                                                                                                    (1 + stopLossRatio);


                                                                                                                                                                        const takeProfit =
                                                                                                                                                                              lastPrice *
                                                                                                                                                                                    (1 - takeProfitRatio);


                                                                                                                                                                                        return {
                                                                                                                                                                                                symbol,
                                                                                                                                                                                                      side: "short",
                                                                                                                                                                                                            entryPrice: lastPrice,
                                                                                                                                                                                                                  stopLoss,
                                                                                                                                                                                                                        takeProfit,
                                                                                                                                                                                                                              qty
                                                                                                                                                                                        };

                                                                                                                                                                                      }

                                                                                                                                                                                    }
