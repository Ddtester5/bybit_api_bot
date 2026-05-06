import { checkSignal } from "../strategies/strategy";
import { tryClosePosition, tryOpenPosition } from "./position";

import { EngineInput, EngineResult, Position } from "../types/types";
import { WIN_SYMBOLS } from "../config/main_config";

export function runEngine({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  symbols,
  candlesBySymbol,
  maxLength,
  startBalance,
  maxPositions,
  rsiOverbought,
  stopLossPercent,
  takeProfitPercent,
}: EngineInput): EngineResult {
  let balance = startBalance;

  const positions = new Map<string, Position>();
  const closedTrades = [];
  const equityCurve: number[] = [];

  for (let i = 0; i < maxLength; i++) {
    for (const symbol of WIN_SYMBOLS) {
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
          const newPosition = tryOpenPosition(
            balance,
            candle.close,
            symbol,
            i,
            stopLossPercent,
            takeProfitPercent,
          );

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
