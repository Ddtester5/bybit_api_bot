// import { RestClientV5 } from "bybit-api";

// const client = new RestClientV5({
//   key: CONFIG.apiKey,
//   secret: CONFIG.apiSecret,
// });

// interface Trade {
//   entryPrice: number;
//   exitPrice: number;
//   profit: number;
// }

// async function getHistoricalData(startTime: number, endTime: number) {
//   const klines = await client.getKline({
//     category: "linear",
//     symbol: CONFIG.symbol,
//     interval: "1",
//     start: startTime,
//     end: endTime,
//   });

//   return klines.result.list;
// }

// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// function checkTrianglePattern(candles: any[]): boolean {
//   const highPrices = candles.map((candle) => parseFloat(candle[2]));
//   const lowPrices = candles.map((candle) => parseFloat(candle[3]));

//   const highestPrice = Math.max(...highPrices);
//   const lowestPrice = Math.min(...lowPrices);
//   const priceRange = highestPrice - lowestPrice;

//   const isCompression =
//     priceRange < CONFIG.triangleCompressionThreshold * highestPrice;

//   return (
//     isCompression && parseFloat(candles[candles.length - 1][3]) < lowestPrice
//   );
// }

// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// function simulateTrade(entryPrice: number, candles: any[]): Trade {
//   const stopLossPrice = entryPrice * (1 + CONFIG.stopLossPercent / 100);
//   const takeProfitPrice = entryPrice * (1 - CONFIG.takeProfitPercent / 100);

//   for (const candle of candles) {
//     const highPrice = parseFloat(candle[2]);
//     const lowPrice = parseFloat(candle[3]);

//     if (highPrice >= stopLossPrice) {
//       const profit = ((entryPrice - stopLossPrice) / entryPrice) * 100;
//       return {
//         entryPrice,
//         exitPrice: stopLossPrice,
//         profit: -profit,
//       };
//     }

//     if (lowPrice <= takeProfitPrice) {
//       const profit = ((entryPrice - takeProfitPrice) / entryPrice) * 100;
//       return {
//         entryPrice,
//         exitPrice: takeProfitPrice,
//         profit: profit,
//       };
//     }
//   }

//   const lastPrice = parseFloat(candles[candles.length - 1][4]);
//   const profit = ((entryPrice - lastPrice) / entryPrice) * 100;
//   return { entryPrice, exitPrice: lastPrice, profit };
// }

// export async function runBacktest(): Promise<void> {
//   const endTime = Date.now();
//   const startTime = endTime - CONFIG.backtestDays * 24 * 60 * 60 * 1000;

//   const historicalData = await getHistoricalData(startTime, endTime);

//   let balance = CONFIG.initialBalance;
//   const trades: Trade[] = [];

//   for (let i = 0; i < historicalData.length - CONFIG.candleLimit; i++) {
//     const candles = historicalData.slice(i, i + CONFIG.candleLimit);

//     if (checkTrianglePattern(candles)) {
//       const entryPrice = parseFloat(candles[candles.length - 1][4]);
//       const positionSize =
//         (balance * CONFIG.riskPerTrade) /
//         ((entryPrice * CONFIG.stopLossPercent) / 100);

//       const trade = simulateTrade(
//         entryPrice,
//         historicalData.slice(i + CONFIG.candleLimit),
//       );
//       trades.push(trade);

//       const profitLoss = (positionSize * trade.profit) / 100;
//       balance += profitLoss;
//     }
//   }

//   const totalProfit = balance - CONFIG.initialBalance;
//   const profitableTradesCount = trades.filter(
//     (trade) => trade.profit > 0,
//   ).length;
//   const winRate = (profitableTradesCount / trades.length) * 100;

//   console.log(`Backtest Results:`);
//   console.log(`Initial Balance: $${CONFIG.initialBalance}`);
//   console.log(`Final Balance: $${balance.toFixed(2)}`);
//   console.log(`Total Profit: $${totalProfit.toFixed(2)}`);
//   console.log(`Number of Trades: ${trades.length}`);
//   console.log(`Win Rate: ${winRate.toFixed(2)}%`);
//   console.log(`Profit Factor: ${(balance / CONFIG.initialBalance).toFixed(2)}`);
// }
// runBacktest();
