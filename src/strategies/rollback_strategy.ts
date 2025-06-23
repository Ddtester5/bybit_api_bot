import { checkOpenPositions } from "../modules/check_open_position";
import { getLastMarketPrice } from "../modules/get_last_market_price";
import { client } from "../api/bybit_api_client_v5";
import {
  candleCountAnalize,
  leverage,
  orderLimit,
  pullbackThreshold,
  riskPercentage,
  stopLossRatio,
  takeProfitRatio,
  timeFrame,
} from "../config";
import { OHLCVKlineV5 } from "bybit-api";
import { getAvalibleBalance } from "../modules/get_avalible_ballance";
import { setLeverage } from "../modules/set_leverage";
import { checkOpenPositionsCount } from "../modules/check_open_positions_count";
import { getPriceChange } from "../modules/get_price_change";
import moment from "moment";
import { getRoundedBalance } from "../modules/get_rounded_balance";
import { getFoundingRate } from "../modules/get_founding_rate";

export const RollbackShortStrategy = async (tradingPair: string) => {
  try {
    const founding_rate = await getFoundingRate(tradingPair);
    if (Number(founding_rate) < -0.0001) {
      console.log("Ставка финансирования отстой", founding_rate);
      return;
    }
    const positionsCount = await checkOpenPositionsCount();
    if (positionsCount > orderLimit) {
      return;
    }
    if (!tradingPair.includes("USDT")) {
      return;
    }
    const hasOpenPosition = await checkOpenPositions(tradingPair);

    if (hasOpenPosition) {
      console.log(
        `Пропускаем, так как уже есть активная сделка по ${tradingPair}`,
      );
      return;
    }
    const lastPrice = await getLastMarketPrice(tradingPair);
    console.log(`Текущая цена пары ${tradingPair}`, "=", lastPrice);
    const priceDayAgo = await getPriceChange(
      tradingPair,
      moment().subtract(1, "day").valueOf(),
    );
    console.log("1 day change", priceDayAgo);
    const price3dayAgo = await getPriceChange(
      tradingPair,
      moment().subtract(3, "days").valueOf(),
    );
    console.log("3 day change", price3dayAgo);
    if (
      !priceDayAgo ||
      !price3dayAgo ||
      priceDayAgo > 10 ||
      priceDayAgo < -5 ||
      price3dayAgo > 50
    ) {
      return;
    }
    const priceMonthAgo = await getPriceChange(
      tradingPair,
      moment().subtract(1, "month").valueOf(),
    );
    console.log("1 month change", priceMonthAgo);
    if (!priceMonthAgo || priceMonthAgo > 0) {
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
    const closePrices = candles.result.list
      .map(
        (candle: OHLCVKlineV5) => parseFloat(candle[4]), // Цена закрытия
      )
      .reverse();
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
    // Получаем доступные средства (баланс)

    const availableBalance = await getAvalibleBalance();
    if (!availableBalance || isNaN(availableBalance) || availableBalance <= 0) {
      console.error("Ошибка: баланс недоступен или равен 0.");
      return;
    }
    // Рассчитываем размер позиции (5% от доступных средств)
    const positionSizeInUSD =
      getRoundedBalance(availableBalance) * riskPercentage * leverage;
    const positionSize = Math.floor(positionSizeInUSD / lastPrice);
    // Открываем шорт-позицию
    const stopLossPrice = lastPrice * (1 + stopLossRatio);
    const takeProfitPrice = lastPrice * (1 - takeProfitRatio);
    await setLeverage(tradingPair, leverage);

    console.log(`📊 Данные перед открытием ордера:
      🔹 Доступный баланс: ${availableBalance}
      🔹 Размер позиции (в USD): ${positionSizeInUSD}
      🔹 Размер позиции (контракты): ${positionSize}
      🔹 Текущая цена: ${lastPrice}
      🔹 Стоп-лосс: ${stopLossPrice}
      🔹 Тейк-профит: ${takeProfitPrice}
      🔹 Плече: ${leverage}
      🔹 Откат: ${(maxPrice - minPrice) / maxPrice}
    `);

    const orderResponse = await client.submitOrder({
      category: "linear",
      symbol: tradingPair,
      side: "Sell",
      orderType: "Market",
      qty: `${positionSize}`,
      timeInForce: "GTC",
      stopLoss: stopLossPrice.toFixed(6),
      takeProfit: takeProfitPrice.toFixed(6),
    });

    console.log("Шорт-позиция успешно открыта:", orderResponse);
  } catch (error) {
    console.error("Ошибка при выполнении стратегии:", error);
  }
};
