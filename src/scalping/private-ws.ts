import crypto from "crypto";
import { client } from "./bybit";
import { config } from "./scalp_config";
import { getTradingState, resetState } from "./state";
import { placeTpSl } from "./tp-sl";
import { privateWs } from "./ws";

export function setupPrivateWs() {
  privateWs.on("open", () => {
    // Важно: генерируем штамп времени строго в момент открытия сокета
    const expires = Date.now() + 10000;
    const signature = crypto.createHmac("sha256", config.apiSecret).update(`GET/realtime${expires}`).digest("hex");

    console.log("[PRIVATE WS] Authenticating session...");
    privateWs.send(
      JSON.stringify({
        op: "auth",
        args: [config.apiKey, expires, signature],
      }),
    );

    privateWs.send(
      JSON.stringify({
        op: "subscribe",
        args: ["order"],
      }),
    );
  });

  privateWs.on("message", async (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      if (msg.op || msg.success || msg.topic !== "order") {
        return;
      }

      for (const order of msg.data) {
        const orderId = order.orderId;
        const symbol = order.symbol;
        const isFilled = order.orderStatus === "Filled";
        const entryPrice = Number(order.price);

        const tradingState = getTradingState(symbol);

        // 1. Исполнен ордер на вход
        if (tradingState.entryOrderId && orderId === tradingState.entryOrderId && isFilled) {
          console.log(`[EXECUTION] Limit entry order filled for ${symbol}`);
          tradingState.entryOrderId = null;
          tradingState.createdAt = null;
          tradingState.inPosition = true;
          tradingState.inStartOrder = false;

          await placeTpSl(symbol, order.side, entryPrice);
          continue;
        }

        // 2. Исполнен Take Profit -> Удаляем Stop Loss
        if (tradingState.takeProfitOrderId && orderId === tradingState.takeProfitOrderId && isFilled) {
          console.log(`[EXECUTION] Take Profit struck for ${symbol}. Canceling SL...`);
          if (tradingState.stopLossOrderId) {
            try {
              await client.cancelOrder({
                category: "linear",
                symbol: symbol,
                orderId: tradingState.stopLossOrderId,
              });
            } catch (err) {
              console.error(`[WS ERROR] Failed to cancel SL order for ${symbol}:`, err);
            }
          }
          resetState(symbol);
          continue;
        }

        // 3. Исполнен Stop Loss -> Удаляем Take Profit
        if (tradingState.stopLossOrderId && orderId === tradingState.stopLossOrderId && isFilled) {
          console.log(`[EXECUTION] Stop Loss struck for ${symbol}. Canceling TP...`);
          if (tradingState.takeProfitOrderId) {
            try {
              await client.cancelOrder({
                category: "linear",
                symbol: symbol,
                orderId: tradingState.takeProfitOrderId,
              });
            } catch (err) {
              console.error(`[WS ERROR] Failed to cancel TP order for ${symbol}:`, err);
            }
          }
          resetState(symbol);
          continue;
        }
      }
    } catch (error) {
      console.error("[PRIVATE WS ERROR] Processing exception occurred:", error);
    }
  });
}
