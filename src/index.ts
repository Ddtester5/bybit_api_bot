import express from "express";
import { checkStrategyInterval, port } from "./config";
import { RollbackShortStrategy } from "./strategies/rollback_strategy";
import { getTradingPairs } from "./modules/get_tradings_pair";

const app = express();

async function runStrategyLoop() {
  while (true) {
    try {
      const tradingPairs = await getTradingPairs();
      for (const tradingPair of tradingPairs) {
        await RollbackShortStrategy(tradingPair);
      }
    } catch (error) {
      console.error("Ошибка в стратегии:", error);
    }
    await new Promise((resolve) =>
      setTimeout(resolve, checkStrategyInterval * 60 * 1000),
    );
  }
}

runStrategyLoop();

const PORT = port || 3000;
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
