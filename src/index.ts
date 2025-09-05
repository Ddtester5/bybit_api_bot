import { orderLimit } from "./config";
import { RollbackShortStrategy } from "./strategies/rollback_strategy";
import { getTradingPairs } from "./modules/get_tradings_pair";
import { checkOpenPositionsCount } from "./modules/check_open_positions_count";

async function runStrategyLoop() {
  try {
    const tradingPairs = await getTradingPairs();
    const positionsCount = await checkOpenPositionsCount();
    if (positionsCount > orderLimit) {
      console.log(`Слишком много позиций`);
    } else {
      for (const tradingPair of tradingPairs) {
        await RollbackShortStrategy(tradingPair);
      }
    }
  } catch (error) {
    console.error("Ошибка в стратегии:", error);
  }
}
(async () => {
  await runStrategyLoop();
})();
