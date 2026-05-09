import { RestClientV5 } from "bybit-api";

export async function getFoundingRate({ symbol, client }: { symbol: string; client: RestClientV5 }) {
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
