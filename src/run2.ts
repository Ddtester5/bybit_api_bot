import { createClient } from "./api/bybit_api_client_v5";
import { config_strategy2 } from "./config/config_strategy2";
import { runStart } from "./run";

(async () => {
  const client = createClient(config_strategy2.apiKey, config_strategy2.apiSecret);
  await runStart({ client, config: config_strategy2 });
})();
