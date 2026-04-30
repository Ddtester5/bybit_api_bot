import { getTradingPairs } from "../modules/get_tradings_pair";
import { loadHistoricalCandles } from "../modules/loadHistoricalCandles";
import { checkSignal, Position } from "../strategies/strategy";
import { Candle } from "../types/types";

const MAX_POSITIONS = 20;
const MAX_RISK = 0.01;

async function run() {
  const pairs = await getTradingPairs();
  const symbols = pairs.slice(0, 3);
  const candlesBySymbol = new Map<string, Candle[]>();
  for (const symbol of symbols) {
    const candles = await loadHistoricalCandles(symbol);
    if (!candles?.length) {
      console.warn(`${symbol}: empty data`);
      continue;
    }

    candlesBySymbol.set(symbol, candles);
  }

  let balance = 10000;

  const positions = new Map<string, Position>();

  let trades = 0;

  const length = candlesBySymbol.get(symbols[0])?.length;

  for (let i = 0; i < length!; i++) {
    for (const symbol of symbols) {
      const candles = candlesBySymbol.get(symbol)!;
      const candle = candles[i];

      const position = positions.get(symbol);

      // === EXIT ===
      if (position && positions.size < MAX_POSITIONS) {
        if (candle.high >= position.stopLoss) {
          const loss = (position.entry - position.stopLoss) * position.qty!;

          balance += loss;

          positions.delete(symbol);
          trades++;

          continue;
        }

        if (candle.low <= position.takeProfit) {
          const profit = (position.entry - position.takeProfit) * position.qty!;

          balance += profit;

          positions.delete(symbol);
          trades++;

          continue;
        }
      }

      // === ENTRY ===
      if (!position) {
        const signal = checkSignal(candles, i);

        if (signal) {
          const risk = balance * MAX_RISK;

          const stopDistance = Math.abs(signal.entry - signal.stopLoss);

          const qty = risk / stopDistance;
          positions.set(symbol, {
            ...signal,
            qty,
          });
        }
      }
    }
  }

  console.log("\nRESULT:");
  console.log("Balance:", balance.toFixed(2));
  console.log("PnL:", (balance - 10000).toFixed(2));
  console.log("Trades:", trades);
}

run();
