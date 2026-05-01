import { client } from "./api/bybit_api_client_v5";
import { MAX_POSITIONS, MAX_RISK } from "./backtest/backtest";
import { checkOpenPositions } from "./modules/check_open_position";
import { checkOpenPositionsCount } from "./modules/check_open_positions";
import { getAvalibleBalance } from "./modules/get_balance";
import { getFoundingRate } from "./modules/get_founding_rate";
import { getTradingPairs } from "./modules/get_tradings_pair";
import { loadHistoricalCandles } from "./modules/loadHistoricalCandles";
import { setLeverage } from "./modules/set_leverage";
import { checkSignal } from "./strategies/strategy";

async function run() {
  try {
    const tradingPairs = await getTradingPairs();

    for (const tradingPair of tradingPairs) {
      console.log("\nPAIR:", tradingPair);

      const candles = await loadHistoricalCandles(tradingPair, 500, 60);
      if (!candles.length) {
        console.log(`No candles for ${tradingPair}, skip`);
        continue;
      }
      console.log(candles.length);
      const founding_rate = await getFoundingRate(tradingPair);
      if (Number(founding_rate) > 0.0001) {
        console.log("Ставка финансирования отстой", founding_rate);
        return;
      }
      const positionsCount = await checkOpenPositionsCount();
      if (positionsCount > MAX_POSITIONS) {
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
      const signal = checkSignal(candles, candles.length - 1);
      if (!signal) return;
      await setLeverage(tradingPair, 5);
      const availableBalance = await getAvalibleBalance();
      if (
        !availableBalance ||
        isNaN(availableBalance) ||
        availableBalance <= 0
      ) {
        console.error("Ошибка: баланс недоступен или равен 0.");
        return;
      }

      const stopDistance = Math.abs(signal.entry - signal.stopLoss);
      const qty = (availableBalance * MAX_RISK) / stopDistance;

      const orderResponse = await client.submitOrder({
        category: "linear",
        symbol: tradingPair,
        side: "Buy",
        orderType: "Market",
        qty: qty.toString(),
        timeInForce: "GTC",
        stopLoss: signal.stopLoss.toString(),
        takeProfit: signal.takeProfit.toString(),
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
