import { createClient } from "./api/bybit_api_client_v5";
import { getInitialData } from "./backtest/get_initial_data";
import { config_strategy1 } from "./config/config_strategy1";

(async function () {
  const client = createClient(config_strategy1.apiKey, config_strategy1.apiSecret);
  await getInitialData({ testMode: true, client: client });
})();
