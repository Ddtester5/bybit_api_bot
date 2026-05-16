import { setupLeverage } from "./leverage";
import { setupPrivateWs } from "./private-ws";
import { setupPublicWs } from "./public-ws";
import { config } from "./scalp_config";

async function bootstrap() {
  for (const symbol of config.symbols) {
    await setupLeverage(symbol, config.leverage);
  }
  setupPublicWs();

  setupPrivateWs();
  console.log("SCALP BOT STARTED");
}

bootstrap();
