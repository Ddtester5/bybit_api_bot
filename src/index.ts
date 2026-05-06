import { client } from "./api/bybit_api_client_v5";
import { checkOpenPositions } from "./api/check_open_position";
import { checkOpenPositionsCount } from "./api/check_open_positions";
import { getAvalibleBalance } from "./api/get_balance";
import { getLastMarketPrice } from "./api/get_last_price";
import { getTradingPairs } from "./api/get_tradings_pair";
import { isWaitPeriodActive } from "./api/is_waiting";
import { loadHistoricalCandles } from "./api/loadHistoricalCandles";
import { setLeverage } from "./api/set_leverage";
import {
  BACKTEST_CANDLE_INTERVAL,
  LEVERAGE,
  MAX_POSITIONS,
  MAX_RISK,
  STRATEGY_RSI_OVERBOUGHT,
  STRATEGY_SMA_PERIOD_SLOW,
  STRATEGY_STOP_LOSS_DELTA,
  STRATEGY_TAKE_PROFIT_DELTA,
  WIN_SYMBOLS,
} from "./config/main_config";
import { checkSignal } from "./strategies/strategy";

async function run() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const tradingPairs = await getTradingPairs();
    const isWaiting = await isWaitPeriodActive();
    if (isWaiting) return;
    for (const tradingPair of WIN_SYMBOLS) {
      console.log("\nPAIR:", tradingPair);

      const candles = await loadHistoricalCandles(
        tradingPair,
        STRATEGY_SMA_PERIOD_SLOW + 5,
        BACKTEST_CANDLE_INTERVAL,
      );
      console.log(candles[candles.length - 1]);
      if (!candles.length) {
        console.log(`No candles for ${tradingPair}, skip`);
        continue;
      }

      // const founding_rate = await getFoundingRate(tradingPair);
      //   if (Number(founding_rate) > BACKTEST_FUNDING_RATE_ESTIMATE) {
      //  console.log("Ставка финансирования отстой", founding_rate);
      //     continue;
      //   }
      const positionsCount = await checkOpenPositionsCount();
      if (positionsCount > MAX_POSITIONS) {
        continue;
      }
      if (!tradingPair.includes("USDT")) {
        continue;
      }
      const hasOpenPosition = await checkOpenPositions(tradingPair);

      if (hasOpenPosition) {
        console.log(
          `Пропускаем, так как уже есть активная сделка по ${tradingPair}`,
        );
        continue;
      }
      const signal = checkSignal(
        candles,
        candles.length - 1,
        STRATEGY_RSI_OVERBOUGHT,
      );
      if (!signal) continue;
      await setLeverage(tradingPair, LEVERAGE);
      const availableBalance = await getAvalibleBalance();
      if (
        !availableBalance ||
        isNaN(availableBalance) ||
        availableBalance <= 0
      ) {
        console.error("Ошибка: баланс недоступен или равен 0.");
        continue;
      }
      const lastPrice = await getLastMarketPrice(tradingPair);
      const stopLossPrice = lastPrice * (1 + STRATEGY_STOP_LOSS_DELTA);
      const takeProfitPrice = lastPrice * (1 - STRATEGY_TAKE_PROFIT_DELTA);
      const risk = availableBalance * MAX_RISK;

      const stopDistance = Math.abs(lastPrice - stopLossPrice);

      if (stopDistance === 0) continue;

      const qty = Math.floor(risk / stopDistance);
      console.log(qty);
      const orderResponse = await client.submitOrder({
        category: "linear",
        symbol: tradingPair,
        side: "Sell",
        orderType: "Market",
        qty: qty.toString(),
        timeInForce: "GTC",
        stopLoss: stopLossPrice.toString(),
        takeProfit: takeProfitPrice.toString(),
      });

      console.log("позиция успешно открыта:", orderResponse);
    }
  } catch (error) {
    console.error("Ошибка в стратегии:", error);
  }
}
(async () => {
  await run();
})();
