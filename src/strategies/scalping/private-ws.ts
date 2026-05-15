import crypto from "crypto";
import { client } from "./bybit";
import { config } from "./scalp_config";
import { resetState, tradingState } from "./state";
import { placeTpSl } from "./tp-sl";
import { privateWs } from "./ws";

const expires = Date.now() + 10000;
const signature = crypto.createHmac("sha256", config.apiSecret).update(`GET/realtime${expires}`).digest("hex");
export function setupPrivateWs() {
  privateWs.on("open", () => {
    privateWs.send(
      JSON.stringify({
        op: "auth",

        args: [config.apiKey, expires, signature],
      }),
    );

    privateWs.send(
      JSON.stringify({
        op: "subscribe",

        args: ["position", "order"],
      }),
    );
  });

  privateWs.on("message", async (raw) => {
    const msg = JSON.parse(raw.toString());

    if (msg.topic !== "order" && msg.topic !== "execution") {
      return;
    }

    for (const order of msg.data) {
      const orderId = order.orderId;

      const isFilled = order.orderStatus === "Filled" || order.execType === "Trade";
      const entryPrice = Number(order.avgPrice || order.price);
      if (tradingState.entryOrderId && orderId === tradingState.entryOrderId && isFilled) {
        tradingState.entryOrderId = null;

        await placeTpSl(order.symbol, order.side, entryPrice);
      }

      if (tradingState.takeProfitOrderId && orderId === tradingState.takeProfitOrderId && isFilled) {
        if (tradingState.stopLossOrderId) {
          await client.cancelOrder({
            category: "linear",

            symbol: order.symbol,

            orderId: tradingState.stopLossOrderId,
          });
        }

        resetState();
      }

      if (tradingState.stopLossOrderId && orderId === tradingState.stopLossOrderId && isFilled) {
        if (tradingState.takeProfitOrderId) {
          await client.cancelOrder({
            category: "linear",

            symbol: order.symbol,

            orderId: tradingState.takeProfitOrderId,
          });
        }

        resetState();
      }
    }
  });
}
