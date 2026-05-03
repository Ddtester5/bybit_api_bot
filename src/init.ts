import { getInitialData } from "./backtest/get_initial_data";

(async function () {
  await getInitialData({ testMode: true });
})();
