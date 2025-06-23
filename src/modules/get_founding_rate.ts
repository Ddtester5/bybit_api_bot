import { client } from "../api/bybit_api_client_v5";

export async function getFoundingRate(symbol: string) {
  try {
    const founding_rate = await client.getFundingRateHistory({
      category: "linear",
      symbol: symbol,
      limit: 1,
    });
    const foundig_rate = founding_rate.result.list[0].fundingRate;
    return foundig_rate;
  } catch (error) {
    console.log("Не удалось получить ставку финансирования", error);
  }
}
