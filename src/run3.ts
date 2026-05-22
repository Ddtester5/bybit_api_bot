import { createClient } from "./api/bybit_api_client_v5";
import { config_strategy3 } from "./config/config_strategy3";
import { runStart } from "./run";

(async () => {
  const client = createClient(config_strategy3.apiKey, config_strategy3.apiSecret);
  await runStart({ client, config: config_strategy3 });
})();
