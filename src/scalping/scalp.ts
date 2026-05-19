import { setupLeverage } from "./leverage";
import { setupPrivateWs } from "./private-ws";
import { setupPublicWs } from "./public-ws";
import { config } from "./scalp_config";
import { resetAllStates } from "./state";

async function bootstrap() {
  console.log(`[BOOTSTRAP] Initializing Scalp Bot for ${config.symbols.length} pairs...`);

  // Установка плеча для каждого инструмента
  for (const symbol of config.symbols) {
    try {
      await setupLeverage(symbol, config.leverage);
      console.log(`[BOOTSTRAP] Successfully set leverage to x${config.leverage} for ${symbol}`);
    } catch (leverageError) {
      console.error(`[BOOTSTRAP CRITICAL] Failed to configure leverage for ${symbol}:`, leverageError);
      console.error("[BOOTSTRAP] Halting initialization to protect capital.");
      process.exit(1);
    }
  }

  // Сброс кэша перед стартом
  resetAllStates();

  try {
    setupPublicWs();
    setupPrivateWs();

    console.log("=========================================");
    console.log("🟩 PRODUCTION SCALP ENGINE RUNNING");
    console.log("=========================================");
  } catch (wsSetupError) {
    console.error("[BOOTSTRAP CRITICAL] Failed to spawn network listeners:", wsSetupError);
    process.exit(1);
  }
}

// Глобальные ловушки для защиты процесса от падения
process.on("unhandledRejection", (reason, promise) => {
  console.error("[FATAL PROTECTION] Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("[FATAL PROTECTION] Uncaught Exception thrown:", error);
  process.exit(1);
});

bootstrap().catch((fatalError) => {
  console.error("[FATAL] Main bootstrap flow failed entirely:", fatalError);
  process.exit(1);
});
