import { RestClientV5 } from "bybit-api";
import { SYMBOL } from "../config";

export async function checkPosition(client: RestClientV5) {
  try {
    const res = await client.getPositionInfo({
      category: "linear",
      symbol: SYMBOL,
    });

    const positions = res.result.list;

    const active = positions.find((p) => Number(p.size) > 0);

    return !!active;
  } catch (e) {
    console.error(e);
  }
}
