import crypto from "crypto";
import { client } from "./bybit";
import { config } from "./scalp_config";
import { getTradingState, resetState } from "./state";
import { placeTpSl } from "./tp-sl";
import { privateWs } from "./ws";

export function setupPrivateWs() {
  privateWs.on("open", () => {
    const expires = Date.now() + 10000;
    const signature = crypto.createHmac("sha256", config.apiSecret).update(`GET/realtime${expires}`).digest("hex");

    console.log("[PRIVATE WS] Authenticating session...");
    privateWs.send(
      JSON.stringify({
        op: "auth",
        args: [config.apiKey, expires, signature],
      }),
    );

    // Подписываемся на сделки (execution) для входа и на ордера (order) для выхода
    privateWs.send(
      JSON.stringify({
        op: "subscribe",
        args: ["execution", "order"],
      }),
    );
  });

  privateWs.on("message", async (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      if (msg.op || msg.success) return;

      // ========================================================
      // КАНАЛ "EXECUTION" — ТОЧНЫЙ ВХОД В РЫНОК
      // ========================================================
      if (msg.topic === "execution") {
        for (const exec of msg.data) {
          const symbol = exec.symbol;
          const tradingState = getTradingState(symbol);

          // Проверяем, что исполнен именно наш ордер на вход.
          // Защита от Race Condition: если ID еще не записан, сверяем по флагу ожидания начала ордера.
          const isOurEntry = exec.orderId === tradingState.entryOrderId || tradingState.inStartOrder;

          // Нас интересует только открытие новой позиции (Trade), а не закрытие по ТП/СЛ (ReduceOnly)
          if (isOurEntry && exec.execType === "Trade") {
            const realEntryPrice = Number(exec.execPrice); // Настоящая цена исполнения!

            console.log(`[EXECUTION SUCCESS] Position opened on ${symbol} via trade block. Price: ${realEntryPrice}`);

            // Фиксируем железное состояние позиции
            tradingState.entryOrderId = null;
            tradingState.createdAt = null;
            tradingState.inPosition = true;
            tradingState.inStartOrder = false;

            // Выставляем риски на основе фактических данных сделки
            const success = await placeTpSl(symbol, exec.side, realEntryPrice);
            if (!success) {
              console.error(`[RISK FAILURE] Position on ${symbol} is unprotected! TP/SL failed to register.`);
            }
          }
        }
        return;
      }

      // ========================================================
      // КАНАЛ "ORDER" — ВЫХОД ИЗ РЫНКА (Take Profit / Stop Loss)
      // ========================================================
      if (msg.topic === "order") {
        for (const order of msg.data) {
          const orderId = order.orderId;
          const symbol = order.symbol;
          const isFilled = order.orderStatus === "Filled";
          const tradingState = getTradingState(symbol);

          // Исполнен Take Profit -> Удаляем Stop Loss
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

          // Исполнен Stop Loss -> Удаляем Take Profit
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
      }
    } catch (error) {
      console.error("[PRIVATE WS ERROR] Processing exception occurred:", error);
    }
  });
}
