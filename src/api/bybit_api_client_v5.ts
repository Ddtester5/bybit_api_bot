import { RestClientV5 } from "bybit-api";

export function createClient(apiKey: string, apiSecret: string) {
  return new RestClientV5({
    key: apiKey,
    secret: apiSecret,
    testnet: false,
  });
}
