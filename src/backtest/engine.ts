import { checkSignal } from "../strategies/strategy";
import { tryClosePosition, tryOpenPosition } from "./position";

import { EngineInput, EngineResult, Position } from "../types/types";

export function runEngine({ candlesBySymbol, maxLength, startBalance, config }: EngineInput): EngineResult {
  let balance = startBalance;

  const positions = new Map<string, Position>();
  const closedTrades = [];
  const equityCurve: number[] = [];
  const lastExitIndex = new Map<string, number>();

  for (let i = 0; i < maxLength; i++) {
    for (const symbol of config.symbols) {
      const candles = candlesBySymbol.get(symbol);
      if (!candles || !candles[i]) continue;

      const candle = candles[i];
      const position = positions.get(symbol);

      // === EXIT ===
      if (position) {
        const closed = tryClosePosition(position, candle, i);

        if (closed) {
          balance += closed.pnl;
          closedTrades.push(closed);
          positions.delete(symbol);
          if (!closed.win) {
            lastExitIndex.set("symbol", i);
          }
          continue;
        }
      }

      // === ENTRY ===
      if (!positions.has(symbol) && positions.size < config.maxPositions) {
        const lastExit = lastExitIndex.get("symbol") || -config.pauseCandlesAfterLoss - 1;
        const canTrade = i - lastExit > config.pauseCandlesAfterLoss;
        if (
          canTrade &&
          checkSignal({
            candles,
            index: i,
            rsiOverbought: config.strategyRsiOverbought,
            rsi_period: config.strategyRsiPeriod,
            sma_fast: config.strategySmaPeriodFast,
            sma_slow: config.strategySmaPeriodSlow,
          })
        ) {
          const newPosition = tryOpenPosition({
            balance,
            price: candle.close,
            symbol,
            index: i,
            config,
          });

          if (newPosition) {
            positions.set(symbol, newPosition);
          }
        }
      }
    }

    equityCurve.push(balance);
  }

  return {
    balance,
    closedTrades,
    equityCurve,
  };
}
