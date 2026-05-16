import { updateOrderbookSide } from "./orderbook";
import { config } from "./scalp_config";
import { processSignal } from "./signals";
import { Orderbook } from "./types";
import { publicWs } from "./ws";

const orderbooks = new Map<string, Orderbook>();

export function setupPublicWs() {
  publicWs.on("open", () => {
    publicWs.send(
      JSON.stringify({
        op: "subscribe",

        args: config.symbols.map((symbol) => `orderbook.${config.depth}.${symbol}`),
      }),
    );
  });

  publicWs.on("message", async (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      if (!msg.topic?.includes("orderbook")) {
        return;
      }

      const symbol = msg.topic.split(".")[2];

      if (!orderbooks.has(symbol)) {
        orderbooks.set(symbol, {
          bids: [],
          asks: [],
        });
      }

      const orderbook = orderbooks.get(symbol)!;

      const data = msg.data;

      if (msg.type === "snapshot") {
        orderbook.bids = data.b.map((x: string[]) => [Number(x[0]), Number(x[1])]);

        orderbook.asks = data.a.map((x: string[]) => [Number(x[0]), Number(x[1])]);
      }

      if (msg.type === "delta") {
        orderbook.bids = updateOrderbookSide(orderbook.bids, data.b || [], true);

        orderbook.asks = updateOrderbookSide(orderbook.asks, data.a || [], false);
      }

      await processSignal(symbol, orderbook);
    } catch (e) {
      console.error(e);
    }
  });
}
