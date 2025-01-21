// import express from "express";
// import { getLastMarketPrice } from "./modules/get_last_market_price";
// import {
//   port,
//   positionSize,
//   pullbackThreshold,
//   stopLossRatio,
//   takeProfitRatio,
//   tradingPair,
// } from "./config";
// import { getHistoryData } from "./modules/get_history_data";
// import { client } from "./api/bybit_api_client_v5";
// import { getBacktesData } from "./modules/get_backtest_data";

// const app = express();

// const main = async () => {
//   try {
//     const historicalData = await getBacktesData(tradingPair);
//     let totalProfit = 0;
//     let totalTrades = 0;

//     const lastPrice = parseFloat(await getLastMarketPrice(tradingPair));
//     console.log(`Текущая цена пары ${tradingPair}`, "=", lastPrice);

//     const historyData = await getHistoryData(tradingPair, 5, "1");

//     const prices = historyData.map((candle) => parseFloat(candle[4]));
//     const isDowntrend = prices[0] > prices[1] && prices[1] > prices[2];

//     if (!isDowntrend) {
//       console.log("Рынок не в нисходящем тренде, стратегия не выполняется.");
//       return;
//     }

//     // Проверяем откат
//     const maxPrice = Math.max(...prices);
//     if ((maxPrice - lastPrice) / maxPrice < pullbackThreshold) {
//       console.log("Откат не достиг порогового значения.");
//       return;
//     }

//     // Открываем шорт-позицию
//     const stopLossPrice = lastPrice * (1 + stopLossRatio);
//     const takeProfitPrice = lastPrice * (1 - takeProfitRatio);

//     console.log(`Открытие шорт-позиции:
//      Цена входа: ${lastPrice}
//      Стоп-лосс: ${stopLossPrice}
//      Тейк-профит: ${takeProfitPrice}`);

//     const orderResponse = await client.submitOrder({
//       category: "linear",
//       symbol: tradingPair,
//       side: "Sell",
//       orderType: "Market",
//       qty: positionSize,
//       timeInForce: "GTC",
//       stopLoss: stopLossPrice.toFixed(2),
//       takeProfit: takeProfitPrice.toFixed(2),
//     });

//     console.log("Шорт-позиция успешно открыта:", orderResponse);
//   } catch (error) {
//     console.error("Ошибка при выполнении стратегии:", error);
//   }
// };
// setInterval(main, 10 * 1000);
// const PORT = port || 3000;
// app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
