import express from "express";
import { RestClientV5 } from "bybit-api";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Создаем клиент Bybit
const client = new RestClientV5({
  key: process.env.API_KEY,
  secret: process.env.API_SECRET,
});

// Конфигурация стратегии
const CONFIG = {
  symbol: "ACEUSDT", // Торгуемый инструмент
  leverage: "20", // Плечо
  riskPerTrade: 0.01, // Риск на сделку (1% от депозита)
  stopLossPercent: 0.2, // Стоп-лосс (% от цены входа)
  takeProfitPercent: 0.5, // Тейк-профит (% от цены входа)
};

let isPositionOpen = false; // Флаг открытой позиции

// Установка плеча
async function setLeverage() {
  try {
    await client.setLeverage({
      category: "linear",
      symbol: CONFIG.symbol,
      buyLeverage: CONFIG.leverage,
      sellLeverage: CONFIG.leverage,
    });
    console.log(`Leverage set to ${CONFIG.leverage}x for ${CONFIG.symbol}`);
  } catch (error) {
    console.error("Error setting leverage:", error);
  }
}

// Функция для определения объема позиции
function calculatePositionSize(
  accountBalance: number,
  entryPrice: number,
): number {
  const riskAmount = accountBalance * CONFIG.riskPerTrade; // Риск в $$
  const stopLoss = entryPrice * (CONFIG.stopLossPercent / 100); // Размер стоп-лосса в $
  const positionSize = riskAmount / stopLoss; // Размер позиции
  return parseFloat(positionSize.toFixed(3)); // Округляем до 3 знаков
}

// Получение баланса аккаунта
async function getAccountBalance(): Promise<number> {
  try {
    const response = await client.getWalletBalance({ accountType: "CONTRACT" });
    const balance = parseFloat(response.result.list[0].totalAvailableBalance);
    console.log("Account balance:", balance);
    return balance;
  } catch (error) {
    console.error("Error fetching account balance:", error);
    return 0;
  }
}

// Открытие сделки
async function openShortPosition(entryPrice: number, positionSize: number) {
  try {
    // Вычисляем стоп-лосс и тейк-профит
    const stopLossPrice = entryPrice * (1 + CONFIG.stopLossPercent / 100); // Выше цены входа
    const takeProfitPrice = entryPrice * (1 - CONFIG.takeProfitPercent / 100); // Ниже цены входа

    // Открываем short-сделку
    const response = await client.submitOrder({
      category: "linear",
      symbol: CONFIG.symbol,
      side: "Sell",
      orderType: "Market",
      qty: positionSize.toFixed(3).toString(),
      timeInForce: "GTC",
    });

    console.log("Short position opened:", response);

    // Установка стоп-лосса и тейк-профита
    await client.setTradingStop({
      category: "linear",
      symbol: CONFIG.symbol,
      positionIdx: 2,
      stopLoss: stopLossPrice.toFixed(2),
      takeProfit: takeProfitPrice.toFixed(2),
    });

    console.log(
      `Stop Loss: ${stopLossPrice.toFixed(2)}, Take Profit: ${takeProfitPrice.toFixed(2)}`,
    );

    isPositionOpen = true; // Обновляем статус позиции
  } catch (error) {
    console.error("Error opening short position:", error);
  }
}

// Функция для вычисления сжатия цен (треугольник) и пробоя уровня поддержки
async function checkTrianglePattern(): Promise<boolean> {
  try {
    // Получаем последние 50 свечей
    const candles = await client.getKline({
      category: "linear",
      symbol: CONFIG.symbol,
      interval: "1", // 1-часовой таймфрейм
      limit: 30, // Получаем последние 50 свечей
    });

    // Если нет данных, возвращаем false
    if (!candles.result || candles.result.list.length === 0) {
      console.error("No candle data available.");
      return false;
    }

    // Массивы для максимальных и минимальных цен
    const highPrices = candles.result.list.map((candle) =>
      parseFloat(candle[2]),
    );
    const lowPrices = candles.result.list.map((candle) =>
      parseFloat(candle[3]),
    );

    // Находим максимум и минимум из последних 50 свечей
    const highestPrice = Math.max(...highPrices);
    const lowestPrice = Math.min(...lowPrices);

    // Вычисляем диапазон цен
    const priceRange = highestPrice - lowestPrice;

    console.log("Highest Price:", highestPrice);
    console.log("Lowest Price:", lowestPrice);
    console.log("Price Range:", priceRange);

    // Определим сжатие: если диапазон цен становится меньше, чем на предыдущих итерациях
    const isCompression = priceRange < 0.02 * highestPrice; // 2% от максимальной цены

    // Если сжатие существует и цена пробивает уровень поддержки (нижний уровень)
    if (
      isCompression &&
      parseFloat(candles.result.list[candles.result.list.length - 1][3]) <
        lowestPrice
    ) {
      console.log(
        "Price is in compression and has broken support. Signal for short.",
      );
      return true; // Сигнал для входа в шорт
    }

    return false; // Не нашли сигнала для пробоя
  } catch (error) {
    console.error("Error checking triangle pattern:", error);
    return false;
  }
}

// Основная логика стратегии
async function tradingStrategy() {
  try {
    // Получаем текущую цену
    const marketData = await client.getTickers({
      category: "linear",
      symbol: CONFIG.symbol,
    });

    const currentPrice = parseFloat(marketData.result.list[0].lastPrice);
    console.log("Current price:", currentPrice);

    const isTrianglePattern = await checkTrianglePattern();
    if (!isTrianglePattern) {
      console.log("No triangle pattern detected. No trade.");
      return;
    }

    // Проверяем условия входа в сделку
    // Если паттерн сработал, открываем шорт-позицию
    if (!isPositionOpen) {
      console.log("Triangle pattern detected. Opening short position...");

      // Получаем баланс аккаунта
      const accountBalance = await getAccountBalance();

      // Вычисляем размер позиции
      const positionSize = calculatePositionSize(accountBalance, currentPrice);

      // Открываем сделку
      await openShortPosition(currentPrice, positionSize);
    } else {
      console.log("No entry condition met.");
    }
  } catch (error) {
    console.error("Error in trading strategy:", error);
  }
}

// Периодически запускаем стратегию
setLeverage(); // Устанавливаем плечо
setInterval(tradingStrategy, 10000); // Запуск стратегии каждые 10 секунд

// Запуск сервера
app.listen(port, () => {
  console.log(`Trading bot running on http://localhost:${port}`);
});
