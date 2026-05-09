import { createClient } from "./api/bybit_api_client_v5";
import { config_strategy1 } from "./config/config_strategy1";
import { runStart } from "./run";

(async () => {
  const client = createClient(config_strategy1.apiKey, config_strategy1.apiSecret);
  await runStart({ client, config: config_strategy1 });
})();
