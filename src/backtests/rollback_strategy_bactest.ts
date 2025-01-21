import {
  pullbackThreshold,
  stopLossRatio,
  takeProfitRatio,
  tradingPair,
} from "../config";
import { getBacktestData } from "../modules/get_backtest_data";

// Логика бэктеста
async function backtestStrategy() {
  try {
    const historicalData = await getBacktestData(tradingPair);

    if (!historicalData || historicalData.length < 4) {
      console.error("Недостаточно данных для бэктеста.");
      return;
    }

    let totalProfit = 0;
    let totalTrades = 0;
    let capital = 100; // Начальный капитал
    const leverage = 25; // Плечо

    // Применяем стратегию к историческим данным
    for (let i = 3; i < historicalData.length; i++) {
      const prices = historicalData.slice(i - 3, i).map((c) => c.close);
      const lastPrice = historicalData[i].close;

      // Проверяем нисходящий тренд
      const isDowntrend = prices[0] > prices[1] && prices[1] > prices[2];
      if (!isDowntrend) continue;

      // Проверяем откат
      const maxPrice = Math.max(...prices);
      if ((maxPrice - lastPrice) / maxPrice < pullbackThreshold) continue;

      // Рассчитываем стоп-лосс и тейк-профит
      const stopLossPrice = lastPrice * (1 + stopLossRatio);
      const takeProfitPrice = lastPrice * (1 - takeProfitRatio);

      // Симуляция результата сделки
      let profit = 0;
      let tradeResolved = false;

      for (let j = i + 1; j < historicalData.length; j++) {
        const futurePrice = historicalData[j].close;

        if (futurePrice >= stopLossPrice) {
          // Цена достигла стоп-лосса
          profit = -(stopLossRatio * lastPrice * leverage);
          tradeResolved = true;
          break;
        } else if (futurePrice <= takeProfitPrice) {
          // Цена достигла тейк-профита
          profit = takeProfitRatio * lastPrice * leverage;
          tradeResolved = true;
          break;
        }
      }

      if (tradeResolved) {
        if (capital + profit < 0) {
          console.log("Недостаточно капитала для продолжения торговли.");
          break;
        }

        totalProfit += profit;
        totalTrades++;
        capital += profit; // Обновляем капитал

        console.log(
          `Сделка ${totalTrades}: Прибыль ${profit.toFixed(2)}, Текущий капитал: ${capital.toFixed(2)}`,
        );
      }
    }

    console.log(`Результаты бэктеста:
          Количество сделок: ${totalTrades}
          Общая прибыль/убыток: ${totalProfit.toFixed(2)}
          Итоговый капитал: ${capital.toFixed(2)}
        `);
  } catch (error) {
    console.error("Ошибка при выполнении бэктеста:", error);
  }
}

backtestStrategy();
