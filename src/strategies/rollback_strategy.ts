import { checkOpenPositions } from "../modules/check_open_position";
import { getLastMarketPrice } from "../modules/get_last_market_price";
import { client } from "../api/bybit_api_client_v5";
import {
  leverage,
  orderLimit,
  riskPercentage,
  stopLossRatio,
  takeProfitRatio,
} from "../config";
import { getAvalibleBalance } from "../modules/get_avalible_ballance";
import { setLeverage } from "../modules/set_leverage";
import { checkOpenPositionsCount } from "../modules/check_open_positions_count";
import { getPriceChange } from "../modules/get_price_change";
import moment from "moment";
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

    const priceMonthAgo = await getPriceChange(
      tradingPair,
      moment().subtract(1, "month").valueOf(),
    );
    console.log(" month change", priceMonthAgo);
    if (!priceMonthAgo) {
      return;
    }

    const priceDayAgo = await getPriceChange(
      tradingPair,
      moment().subtract(1, "day").valueOf(),
    );
    console.log("1 day change", priceDayAgo);
    // const price3dayAgo = await getPriceChange(
    //   tradingPair,
    //   moment().subtract(3, "days").valueOf(),
    // );
    const price7dayAgo = await getPriceChange(
      tradingPair,
      moment().subtract(7, "days").valueOf(),
    );
    console.log("7 day change", price7dayAgo);
    // console.log("3 day change", price3dayAgo);
    if (!priceDayAgo || !price7dayAgo || price7dayAgo < 100) {
      return;
    }

    const availableBalance = await getAvalibleBalance();
    if (!availableBalance || isNaN(availableBalance) || availableBalance <= 0) {
      console.error("Ошибка: баланс недоступен или равен 0.");
      return;
    }
    const rounded_balance = Math.floor(availableBalance).toString();
    let balance = "";
    for (let i = 0; i < rounded_balance.length; i++) {
      if (i === 0) {
        balance = balance + rounded_balance[i];
      }
      if (i !== 0) {
        balance = balance + "0";
      }
    }
    const positionSizeInUSD = +balance * riskPercentage * leverage;
    const positionSize = Math.floor(positionSizeInUSD / lastPrice);

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
