import { getTradingPairs } from "../modules/get_tradings_pair";
import { loadHistoricalCandles } from "../modules/loadHistoricalCandles";
import { checkSignal, Position } from "../strategies/strategy";

async function run() {
  const pairs  = await getTradingPairs()

  console.log("Loading candles...");
console.log(pairs[0])
  const candles = await loadHistoricalCandles(pairs[0]);

  console.log("Candles:", candles.length);
console.log(candles[0])
  let balance = 10000;

  let position: Position | null = null;

  let trades = 0;

  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i];

    // === если есть позиция — проверяем выход ===

    if (position) {
      // SL
      if (candle.high >= position.stopLoss) {
        const loss = (position.entry - position.stopLoss) * position.qty;

        balance += loss;

        position = null;
        trades++;

        continue;
      }

      // TP
      if (candle.low <= position.takeProfit) {
        const profit = (position.takeProfit - position.entry) * position.qty;

        balance += profit;

        position = null;
        trades++;

        continue;
      }
    }

    // === если нет позиции — ищем вход ===

    if (!position) {
      const signal = checkSignal(candles, i,balance);

      if (signal) {
        position = signal;
      }
    }
  }

  console.log("\nRESULT:");
  console.log("Balance:", balance.toFixed(2));
  console.log("PnL:", (balance - 10000).toFixed(2));
  console.log("Trades:", trades);
}

run();
