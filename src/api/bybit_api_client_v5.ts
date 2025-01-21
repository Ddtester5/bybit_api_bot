import { RestClientV5 } from "bybit-api";
import { apiKey, apiSecret } from "../config/main_config";

// Инициализация клиента Bybit
export const client = new RestClientV5({
  key: apiKey,
  secret: apiSecret,
  testnet: false, // Используйте true для тестовой сети
});
