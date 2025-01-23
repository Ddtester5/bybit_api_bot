import express from "express";
import { getLastMarketPrice } from "./modules/get_last_market_price";
import {
  candleCountAnalize,
  port,
  positionSize,
  pullbackThreshold,
  stopLossRatio,
  takeProfitRatio,
  timeFrame,
  tradingPair,
} from "./config";
import { client } from "./api/bybit_api_client_v5";
import { get24hPriceChange } from "./modules/get24hour_price_change";
import { OHLCVKlineV5 } from "bybit-api";

const app = express();

const main = async () => {
  try {
    const lastPrice = await getLastMarketPrice(tradingPair);
    console.log(`Текущая цена пары ${tradingPair}`, "=", lastPrice);
    const price24Change = await get24hPriceChange(tradingPair);
    if (!price24Change || price24Change < 0) {
      return;
    }
    const candles = await client.getKline({
      category: "linear",
      symbol: tradingPair,
      interval: `${timeFrame}`,
      limit: candleCountAnalize,
    });

    const highPrices = candles.result.list.map((candle: OHLCVKlineV5) =>
      parseFloat(candle[2]),
    );
    const lowPrices = candles.result.list.map((candle: OHLCVKlineV5) =>
      parseFloat(candle[3]),
    );
    const closePrices = candles.result.list.map(
      (candle: OHLCVKlineV5) => parseFloat(candle[4]), // Цена закрытия
    );

    // Проверяем рост цены (например, последовательное повышение цен закрытия)
    let isPriceIncreasing = true;
    for (let i = 1; i < closePrices.length; i++) {
      if (closePrices[i] <= closePrices[i - 1]) {
        isPriceIncreasing = false;
        break;
      }
    }

    // Если цена не растет — пропускаем
    if (!isPriceIncreasing) {
      console.log("Отката нет");
      return;
    }

    // Проверяем глубину отката
    const maxPrice = Math.max(...highPrices);
    const minPrice = Math.min(...lowPrices);
    if ((maxPrice - minPrice) / maxPrice < pullbackThreshold) {
      console.log("Откат не достиг порогового значения.");
      return;
    }

    // Открываем шорт-позицию
    const stopLossPrice = lastPrice * (1 + stopLossRatio);
    const takeProfitPrice = lastPrice * (1 - takeProfitRatio);

    console.log(`Открытие шорт-позиции:
     Цена входа: ${lastPrice}
     Стоп-лосс: ${stopLossPrice}
     Тейк-профит: ${takeProfitPrice}`);

    const orderResponse = await client.submitOrder({
      category: "linear",
      symbol: tradingPair,
      side: "Sell",
      orderType: "Market",
      qty: positionSize,
      timeInForce: "GTC",
      stopLoss: stopLossPrice.toFixed(2),
      takeProfit: takeProfitPrice.toFixed(2),
    });

    console.log("Шорт-позиция успешно открыта:", orderResponse);
  } catch (error) {
    console.error("Ошибка при выполнении стратегии:", error);
  }
};
setInterval(main, 10 * 1000);
const PORT = port || 3000;
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
