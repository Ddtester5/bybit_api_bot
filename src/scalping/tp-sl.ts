import { client } from "./bybit";
import { config } from "./scalp_config";
import { tradingState } from "./state";
import { Side } from "./types";

export async function placeTpSl(symbol: string, side: Side, entryPrice: number) {
  try {
    console.log(`Placing TP/SL for ${symbol} at entry price ${entryPrice}`);
    const isLong = side === "Buy";

    const closeSide = isLong ? "Sell" : "Buy";

    const tpPrice = isLong ? entryPrice * (1 + config.takeProfitPercent) : entryPrice * (1 - config.takeProfitPercent);

    const slPrice = isLong ? entryPrice * (1 - config.stopLossPercent) : entryPrice * (1 + config.stopLossPercent);
    console.log(`Placing TP at ${tpPrice.toFixed(4)} and SL at ${slPrice.toFixed(4)}`);
    const tp = await client.submitOrder({
      category: "linear",
      symbol,
      side: closeSide,
      orderType: "Limit",
      qty: config.orderQty.toString(),
      price: tpPrice.toFixed(4),
      reduceOnly: true,
      timeInForce: "GTC",
    });

    tradingState.takeProfitOrderId = tp.result.orderId;

    const sl = await client.submitOrder({
      category: "linear",
      symbol,
      side: closeSide,
      orderType: "Market",
      triggerPrice: slPrice.toFixed(4),
      triggerDirection: isLong ? 2 : 1,
      triggerBy: "LastPrice",
      qty: config.orderQty.toString(),
      reduceOnly: true,
    });
    console.log("TP RESULT", tp);
    console.log("SL RESULT", sl);
    tradingState.stopLossOrderId = sl.result.orderId;
    console.log("position sucsessfully created with tp and sl");
  } catch (error) {
    console.error("Error placing TP/SL:", error);
  }
}
