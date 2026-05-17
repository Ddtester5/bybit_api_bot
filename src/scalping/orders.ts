import { client } from "./bybit";
import { config } from "./scalp_config";
import { tradingState } from "./state";
import { Side } from "./types";

export async function openPosition(symbol: string, side: Side, price: number) {
  if (tradingState.inStartOrder || tradingState.inPosition || tradingState.isOpeningPosition) {
    return;
  }

  tradingState.inStartOrder = true;
  tradingState.inPosition = true;

  try {
    const openPrice = side === "Buy" ? price * (1 + config.wallEntryBuffer) : price * (1 - config.wallEntryBuffer);
    const response = await client.submitOrder({
      category: "linear",
      symbol,
      side,
      orderType: "Limit",
      price: openPrice.toFixed(4),
      qty: config.orderQty.toString(),
      timeInForce: "GTC",
    });

    tradingState.inPosition = true;

    tradingState.entryOrderId = response.result.orderId;
    tradingState.createdAt = Date.now();

    console.log(response);
  } catch (e) {
    console.error(e);
  } finally {
    tradingState.isOpeningPosition = false;
  }
}
