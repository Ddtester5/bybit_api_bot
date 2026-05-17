import { client } from "./bybit";
import { config } from "./scalp_config";
import { tradingState } from "./state";
import { Side } from "./types";

export async function openPosition(symbol: string, side: Side, price: number) {
  if (tradingState.inStartOrder || tradingState.inPosition || tradingState.isOpeningPosition) {
    return;
  }

  tradingState.isOpeningPosition = true;

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

    tradingState.inStartOrder = true;
    tradingState.entryOrderId = response.result.orderId;
    tradingState.createdAt = Date.now();
    console.log("create limit order ", side);
    console.log(response);
  } catch (e) {
    console.log("create limit order error", side);
    console.error(e);
  } finally {
    tradingState.isOpeningPosition = false;
  }
}
