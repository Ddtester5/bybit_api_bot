// import {
//   candleCountAnalize,
//   pullbackThreshold,
//   stopLossRatio,
//   takeProfitRatio,
//   tradingPair,
// } from "../config";
// import { get24hPriceChange } from "../modules/get24hour_price_change";
// import { getBacktestData } from "../modules/get_backtest_data";

// // Логика бэктеста
// async function backtestStrategy() {
//   try {
//     const historicalData = await getBacktestData(tradingPair);

//     if (!historicalData || historicalData.length < candleCountAnalize) {
//       console.error("Недостаточно данных для бэктеста.");
//       return;
//     }

//     let totalProfit = 0;
//     let totalTrades = 0;
//     let capital = 100; // Начальный капитал
//     const leverage = 25; // Плечо

//     // Применяем стратегию к историческим данным
//     for (let i = candleCountAnalize - 1; i < historicalData.length; i++) {
//       const prices = historicalData
//         .slice(i - candleCountAnalize + 1, i)
//         .map((c) => c.close);
//       const lastPrice = historicalData[i].close;
//       const price24Change = await get24hPriceChange(
//         tradingPair,
//         historicalData[i].timestamp,
//       );
//       if (!price24Change || price24Change > 0) continue;

//       // Проверяем откат
//       const maxPrice = Math.max(...prices);
//       if ((maxPrice - lastPrice) / maxPrice < pullbackThreshold) continue;

//       // Рассчитываем стоп-лосс и тейк-профит
//       const stopLossPrice = lastPrice * (1 + stopLossRatio);
//       const takeProfitPrice = lastPrice * (1 - takeProfitRatio);

//       // Симуляция результата сделки
//       let profit = 0;
//       let tradeResolved = false;

//       for (let j = i + 1; j < historicalData.length; j++) {
//         const futurePrice = historicalData[j].close;

//         if (futurePrice >= stopLossPrice) {
//           // Цена достигла стоп-лосса
//           profit = -(stopLossRatio * lastPrice * leverage);
//           tradeResolved = true;
//           break;
//         } else if (futurePrice <= takeProfitPrice) {
//           // Цена достигла тейк-профита
//           profit = takeProfitRatio * lastPrice * leverage;
//           tradeResolved = true;
//           break;
//         }
//       }

//       if (tradeResolved) {
//         if (capital + profit < 0) {
//           console.log("Недостаточно капитала для продолжения торговли.");
//           break;
//         }

//         totalProfit += profit;
//         totalTrades++;
//         capital += profit; // Обновляем капитал

//         console.log(
//           `Сделка ${totalTrades}: Прибыль ${profit.toFixed(2)}, Текущий капитал: ${capital.toFixed(2)}`,
//         );
//       }
//     }

//     console.log(`Результаты бэктеста:
//         Количество сделок: ${totalTrades}
//         Общая прибыль/убыток: ${totalProfit.toFixed(2)}
//         Итоговый капитал: ${capital.toFixed(2)}
//       `);
//   } catch (error) {
//     console.error("Ошибка при выполнении бэктеста:", error);
//   }
// }

// backtestStrategy();
