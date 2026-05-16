import { updateOrderbookSide } from "./orderbook";
import { processSignal } from "./signals";
import { Orderbook } from "./types";

const orderbooks = new Map<string, Orderbook>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function handleOrderbookMessage(msg: any) {
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
}
