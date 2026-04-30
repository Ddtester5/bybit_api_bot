import { getTradingPairs } from "./modules/get_tradings_pair";
import { loadHistoricalCandles } from "./modules/loadHistoricalCandles";
import { BybitBroker } from "./strategies/Brocker";
import { BybitMarketData } from "./strategies/MarketDataProvider";
import { RollbackShortStrategy } from "./strategies/RollbackShortStrategy";

async function runStrategyLoop() {
  try {
    const tradingPairs = await getTradingPairs();
    const strategy = new RollbackShortStrategy(
      new BybitBroker(),
      new BybitMarketData(),
    );

    for (const tradingPair of tradingPairs) {
      console.log("\nPAIR:", tradingPair);

      const candles = await loadHistoricalCandles(tradingPair, 1, 60);
      if (!candles.length) {
        console.log(`No candles for ${tradingPair}, skip`);
        continue;
      }
      await strategy.execute(candles[candles.length - 1], tradingPair);
    }
  } catch (error) {
    console.error("Ошибка в стратегии:", error);
  }
}

(async () => {
  await runStrategyLoop();
})();
