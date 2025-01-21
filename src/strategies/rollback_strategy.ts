// import express from "express";

// const app = express();

// // Конфигурация
// const apiKey = process.env.API_KEY; // Замените на ваш API-ключ Bybit
// const apiSecret = process.env.API_SECRET; // Замените на ваш секретный ключ Bybit
// const symbol = "ACEUSDT"; // Торговая пара
// const takeProfitRatio = 0.02; // Тейк-профит: 2%
// const stopLossRatio = 0.01; // Стоп-лосс: 1%
// const pullbackThreshold = 0.005; // Уровень отката: 0.5%
// const positionSize = 0.01; // Размер позиции (например, 0.01 BTC)

// // Инициализация клиента Bybit
// const client = new RestClientV5({
//   key: apiKey,
//   secret: apiSecret,
//   testnet: false, // Используйте true для тестовой сети
// });

// // Логика стратегии
// async function executeShortStrategy() {
//   try {
//     // Получаем рыночные данные
//     const marketData = await client.getTickers({ category: "linear", symbol });
//     const lastPrice = parseFloat(marketData.result.list[0].lastPrice);

//     console.log(`Текущая цена ${symbol}: ${lastPrice}`);

//     // Получаем исторические данные для анализа свечей
//     const candles = await client.getKline({
//       category: "linear",
//       symbol,
//       interval: "1", // Интервал 1 минута
//       limit: 5, // Последние 5 свечей
//     });

//     const prices = candles.result.list.map((candle) =>
//       parseFloat(candle.close),
//     );
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
//       Цена входа: ${lastPrice}
//       Стоп-лосс: ${stopLossPrice}
//       Тейк-профит: ${takeProfitPrice}`);

//     const orderResponse = await client.submitOrder({
//       category: "linear",
//       symbol,
//       side: "Sell",
//       orderType: "Market",
//       qty: positionSize,
//       timeInForce: "GoodTillCancel",
//       stopLoss: stopLossPrice.toFixed(2),
//       takeProfit: takeProfitPrice.toFixed(2),
//     });

//     console.log("Шорт-позиция успешно открыта:", orderResponse);
//   } catch (error) {
//     console.error("Ошибка при выполнении стратегии:", error);
//   }
// }

// // Периодический запуск стратегии
// setInterval(executeShortStrategy, 60000); // Проверка каждые 60 секунд

// // Запуск веб-сервера (для мониторинга)
// app.get("/", (req, res) => {
//   res.send("Торговый бот запущен.");
// });

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
