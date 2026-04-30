import { getTradingPairs } from "../modules/get_tradings_pair";
import { loadHistoricalCandles } from "../modules/loadHistoricalCandles";
import { checkSignal, Position } from "../strategies/strategy";
import { Candle } from "../types/types";

const MAX_POSITIONS = 100;
const MAX_RISK = 0.005;

async function run() {
  const pairs = await getTradingPairs();
  const symbols = pairs
  const candlesBySymbol = new Map<string, Candle[]>();
  for (const symbol of symbols) {
    const candles = await loadHistoricalCandles(symbol);
    if (!candles?.length) {
      console.warn(`${symbol}: empty data`);
      continue;
    }

    candlesBySymbol.set(symbol, candles);
  }
const init = 10
  let balance = init;

  const positions = new Map<string, Position>();

  let trades = 0;

  let maxLength = 0;
  for (const candles of candlesBySymbol.values()) {
    if (candles.length > maxLength) maxLength = candles.length;
    }

  for (let i = 0; i < maxLength; i++) {
    for (const symbol of symbols) {
      const candles = candlesBySymbol.get(symbol)!;
      if(!candles[i]) continue
      const candle = candles[i];

      const position = positions.get(symbol);

      // === EXIT ===
      if (position ) {
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
      if (!position && positions.size < MAX_POSITIONS) {
        const signal = checkSignal(candles, i);

        if (signal) {
          const qty = balance * MAX_RISK / (signal.entry - signal.stopLoss)
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
  console.log("PnL:", (balance - init).toFixed(2));
  console.log("Trades:", trades);
}

run();
