import { RestClientV5 } from "bybit-api";
import { checkOpenPositions } from "./api/check_open_position";
import { checkOpenPositionsCount } from "./api/check_open_positions";
import { getAvalibleBalance } from "./api/get_balance";
import { getLastMarketPrice } from "./api/get_last_price";
import { getTradingPairs } from "./api/get_tradings_pair";
import { isWaitPeriodActive } from "./api/is_waiting";
import { loadHistoricalCandles } from "./api/loadHistoricalCandles";
import { setLeverage } from "./api/set_leverage";
import { checkSignal } from "./strategies/strategy";
import { StrategyConfig } from "./types/types";

export async function runStart({
  client,
  config,
}: {
  client: RestClientV5;
  config: StrategyConfig;
}) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const tradingPairs = await getTradingPairs({ client });
    const isWaiting = await isWaitPeriodActive({
      candle_interval: config.backtestCandleInterval,
      pause_candle: config.pauseCandlesAfterLoss,
      client,
    });
    if (isWaiting) return;
    for (const tradingPair of config.symbols) {
      console.log("\nPAIR:", tradingPair);

      const candles = await loadHistoricalCandles({
        symbol: tradingPair,
        client,
      });
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
      const positionsCount = await checkOpenPositionsCount({ client });
      if (positionsCount > config.maxPositions) {
        continue;
      }
      if (!tradingPair.includes("USDT")) {
        continue;
      }
      const hasOpenPosition = await checkOpenPositions({ tradingPair, client });

      if (hasOpenPosition) {
        console.log(
          `Пропускаем, так как уже есть активная сделка по ${tradingPair}`,
        );
        continue;
      }
      const signal = checkSignal({
        candles,
        index: candles.length - 1,
        rsiOverbought: config.strategyRsiOverbought,
        rsi_period: config.strategyRsiPeriod,
        sma_fast: config.strategySmaPeriodFast,
        sma_slow: config.strategySmaPeriodSlow,
      });
      if (!signal) continue;
      await setLeverage({
        tradingPair,
        leverage: config.leverage,
        client,
      });
      const availableBalance = await getAvalibleBalance({ client });
      if (
        !availableBalance ||
        isNaN(availableBalance) ||
        availableBalance <= 0
      ) {
        console.error("Ошибка: баланс недоступен или равен 0.");
        continue;
      }
      const lastPrice = await getLastMarketPrice({ tradingPair, client });
      const stopLossPrice = lastPrice * (1 + config.strategyStopLossDelta);
      const takeProfitPrice = lastPrice * (1 - config.strategyTakeProfitDelta);
      const risk = availableBalance * config.maxRisk;

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
