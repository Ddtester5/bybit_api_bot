import WebSocket from "ws";
import { createClient } from "../../api/bybit_api_client_v5";
import { LEVERAGE, SCALP_API_KEY, SCALP_API_SECRET, SYMBOL } from "./config";
import { checkPosition } from "./helpers/checkPosition";
import { processSignal } from "./helpers/signal";
import { updateOrderbookSide } from "./helpers/updateOrders";
import { orderbookType } from "./types";

const client = createClient(SCALP_API_KEY, SCALP_API_SECRET);

const orderbook: orderbookType = {
  bids: [],
  asks: [],
};

let lastTradeTime = 0;

const ws = new WebSocket("wss://stream.bybit.com/v5/public/linear");

ws.on("open", async () => {
  console.log("WS CONNECTED");

  try {
    await client.setLeverage({
      category: "linear",
      symbol: SYMBOL,
      buyLeverage: LEVERAGE.toString(),
      sellLeverage: LEVERAGE.toString(),
    });

    console.log("LEVERAGE SET");
  } catch {
    console.log("LEVERAGE ALREADY SET");
  }

  ws.send(
    JSON.stringify({
      op: "subscribe",
      args: [`orderbook.50.${SYMBOL}`],
    }),
  );
});

ws.on("message", async (raw) => {
  try {
    const msg = JSON.parse(raw.toString());

    if (!msg.topic?.includes("orderbook")) {
      return;
    }

    const data = msg.data;

    if (!data) return;

    if (msg.type === "snapshot") {
      orderbook.bids = data.b.map((x: string[]): [number, number] => [
        Number(x[0]),
        Number(x[1]),
      ]);

      orderbook.asks = data.a.map((x: string[]): [number, number] => [
        Number(x[0]),
        Number(x[1]),
      ]);

      console.log("ORDERBOOK SNAPSHOT LOADED");

      return;
    }

    if (msg.type === "delta") {
      orderbook.bids = updateOrderbookSide(orderbook.bids, data.b || [], true);

      orderbook.asks = updateOrderbookSide(orderbook.asks, data.a || [], false);
    }

    const inPositionCheck = await checkPosition(client);

    const newlastTradeTime = await processSignal(
      !!inPositionCheck,
      lastTradeTime,
      orderbook,
      client,
    );
    lastTradeTime = newlastTradeTime || lastTradeTime;
  } catch (e) {
    console.error("WS MESSAGE ERROR", e);
  }
});
ws.on("error", (e) => {
  console.error("WS ERROR", e);
});

ws.on("close", () => {
  console.log("WS CLOSED");
});
