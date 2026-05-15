import { createClient } from "../../api/bybit_api_client_v5";
import { config } from "./scalp_config";

export const client = createClient(config.apiKey, config.apiSecret);
