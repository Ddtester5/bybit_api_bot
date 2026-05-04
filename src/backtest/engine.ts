import { checkSignal } from "../strategies/strategy";
import { tryClosePosition, tryOpenPosition } from "./position";

import { EngineInput, EngineResult, Position } from "../types/types";

export function runEngine({
  symbols,
  candlesBySymbol,
  maxLength,
  startBalance,
  maxPositions,
  rsiOverbought,
}: EngineInput): EngineResult {
  let balance = startBalance;

  const positions = new Map<string, Position>();
  const closedTrades = [];
  const equityCurve: number[] = [];

  for (let i = 0; i < maxLength; i++) {
    for (const symbol of symbols) {
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
          continue;
        }
      }

      // === ENTRY ===
      if (!positions.has(symbol) && positions.size < maxPositions) {
        if (checkSignal(candles, i, rsiOverbought)) {
          const newPosition = tryOpenPosition(balance, candle.close, symbol, i);

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
