import { RestClientV5 } from "bybit-api";
import crypto from "crypto";
import dotenv from "dotenv";
import WebSocket from "ws";
dotenv.config();

const API_KEY = process.env.SCALP_API_KEY || "";
const API_SECRET = process.env.SCALP_API_SECRET || "";
const LEVERAGE = 1;
const ORDER_QTY = 0.1;
const DEPTH = 1000;
const WALL_MULTIPLIER = 10;
const WALL_ENTRY_BUFFER = 0.0005;
const MAX_DISTANCE_PERCENT = 0.0015;
const TAKE_PROFIT_PERCENT = 0.002;
const STOP_LOSS_PERCENT = 0.0005;
const symbols = ["TONUSDT", "XRPUSDT"];
const client = new RestClientV5({
  key: API_KEY,
  secret: API_SECRET,
  testnet: false,
});
const ws = new WebSocket("wss://stream.bybit.com/v5/public/linear");
const privateWs = new WebSocket("wss://stream.bybit.com/v5/private");
const expires = Date.now() + 10000;
const signature = crypto.createHmac("sha256", API_SECRET).update(`GET/realtime${expires}`).digest("hex");
privateWs.on("open", () => {
  console.log("PRIVATE WS CONNECTED");

  privateWs.send(JSON.stringify({ op: "auth", args: [API_KEY, expires, signature] }));
  privateWs.send(JSON.stringify({ op: "subscribe", args: ["position", "order"] }));
});
const orderbook = new Map<
  string,
  {
    bids: [number, number][];
    asks: [number, number][];
  }
>();
let inPosition = false;
let isProcessing = false;
let entryOrderId: string | null = null;
let takeProfitOrderId: string | null = null;
let stopLossOrderId: string | null = null;

function updateOrderbookSide(current: [number, number][], updates: string[][], isBid: boolean) {
  const map = new Map<number, number>();
  for (const [price, size] of current) {
    map.set(price, size);
  }
  for (const [p, s] of updates) {
    const price = Number(p);
    const size = Number(s);
    if (size === 0) {
      map.delete(price);
    } else {
      map.set(price, size);
    }
  }
  const result: [number, number][] = Array.from(map.entries());
  result.sort((a, b) => {
    return isBid ? b[0] - a[0] : a[0] - b[0];
  });

  return result.slice(0, DEPTH);
}
function distancePercent(a: number, b: number) {
  return Math.abs(a - b) / a;
}
function findBidWall(bids: [number, number][]) {
  if (!bids.length) {
    return undefined;
  }
  const avg = bids.reduce((sum, level) => sum + level[1], 0) / bids.length;
  return bids.find((b) => b[1] >= avg * WALL_MULTIPLIER);
}
function findAskWall(asks: [number, number][]) {
  if (!asks.length) {
    return undefined;
  }
  const avg = asks.reduce((sum, level) => sum + level[1], 0) / asks.length;
  return asks.find((a) => a[1] >= avg * WALL_MULTIPLIER);
}
async function openPosition(symbol: string, side: "Buy" | "Sell", price: number) {
  if (inPosition) {
    return;
  }

  inPosition = true;

  try {
    const openPrice = side === "Buy" ? price * (1 + WALL_ENTRY_BUFFER) : price * (1 - WALL_ENTRY_BUFFER);

    console.log(`OPEN ${side === "Buy" ? "LONG" : "SHORT"}`);

    const position = await client.submitOrder({
      category: "linear",
      symbol,
      side,
      orderType: "Limit",
      isLeverage: LEVERAGE,
      price: openPrice.toFixed(4),
      qty: ORDER_QTY.toString(),
      timeInForce: "GTC",
    });

    entryOrderId = position.result.orderId;
    console.log(position);
  } catch (e) {
    inPosition = false;

    console.error("OPEN POSITION ERROR", e);
  }
}
async function placeTpSl(symbol: string, side: "Buy" | "Sell", entryPrice: number) {
  const isLong = side === "Buy";

  const closeSide = isLong ? "Sell" : "Buy";

  const tpPrice = isLong ? entryPrice * (1 + TAKE_PROFIT_PERCENT) : entryPrice * (1 - TAKE_PROFIT_PERCENT);

  const slPrice = isLong ? entryPrice * (1 - STOP_LOSS_PERCENT) : entryPrice * (1 + STOP_LOSS_PERCENT);

  // TAKE PROFIT

  const tp = await client.submitOrder({
    category: "linear",
    symbol,
    side: closeSide,
    orderType: "Limit",
    qty: ORDER_QTY.toString(),
    price: tpPrice.toFixed(4),
    reduceOnly: true,
    timeInForce: "GTC",
  });

  takeProfitOrderId = tp.result.orderId;

  // STOP LOSS

  const sl = await client.submitOrder({
    category: "linear",
    symbol,
    side: closeSide,
    orderType: "Market",
    triggerPrice: slPrice.toFixed(4),
    triggerDirection: isLong ? 2 : 1,
    triggerBy: "LastPrice",
    qty: ORDER_QTY.toString(),
    reduceOnly: true,
  });

  stopLossOrderId = sl.result.orderId;

  console.log({
    tpPrice,
    slPrice,
  });
}
function resetState() {
  inPosition = false;
  entryOrderId = null;
  takeProfitOrderId = null;
  stopLossOrderId = null;
  console.log("STATE RESET");
}
async function processSignal(symbol: string, orderbook: { bids: [number, number][]; asks: [number, number][] }) {
  if (inPosition) {
    return;
  }

  if (!orderbook.bids.length || !orderbook.asks.length) {
    return;
  }
  const bestBid = orderbook.bids[0][0];
  const bestAsk = orderbook.asks[0][0];
  const mid = (bestBid + bestAsk) / 2;
  const bidWall = findBidWall(orderbook.bids);
  const askWall = findAskWall(orderbook.asks);
  // console.log({
  //   symbol: symbol,
  //   bestBid: bestBid,
  //   bestAsk: bestAsk,
  //   mid: mid,
  //   bidWall: bidWall,
  //   askWall: askWall,
  // });
  if (bidWall) {
    const [price, size] = bidWall;
    const dist = distancePercent(mid, price);
    if (price < mid && dist <= MAX_DISTANCE_PERCENT) {
      console.log("LONG SIGNAL");
      console.log({
        wallPrice: price,
        wallSize: size,
        dist,
      });
      await openPosition(symbol, "Buy", price);
      return;
    }
  }
  if (askWall) {
    const [price, size] = askWall;
    const dist = distancePercent(mid, price);
    if (price > mid && dist <= MAX_DISTANCE_PERCENT) {
      console.log("SHORT SIGNAL");
      console.log({
        wallPrice: price,
        wallSize: size,
        dist,
      });
      await openPosition(symbol, "Sell", price);
      return;
    }
  }
}
privateWs.on("message", async (raw) => {
  const msg = JSON.parse(raw.toString());

  console.log(msg);

  // ORDER EVENTS

  if (msg.topic === "order") {
    const orders = msg.data;

    for (const order of orders) {
      const orderId = order.orderId;

      const status = order.orderStatus;

      // ENTRY FILLED

      if (entryOrderId && orderId === entryOrderId && status === "Filled") {
        console.log("ENTRY FILLED");

        entryOrderId = null;

        await placeTpSl(order.symbol, order.side, Number(order.avgPrice));
      }

      // TAKE PROFIT FILLED

      if (takeProfitOrderId && orderId === takeProfitOrderId && status === "Filled") {
        console.log("TAKE PROFIT FILLED");

        // отменяем стоп

        if (stopLossOrderId) {
          try {
            await client.cancelOrder({
              category: "linear",
              symbol: order.symbol,
              orderId: stopLossOrderId,
            });
          } catch (e) {
            console.log(e);
          }
        }

        resetState();
      }

      // STOP LOSS FILLED

      if (stopLossOrderId && orderId === stopLossOrderId && status === "Filled") {
        console.log("STOP LOSS FILLED");

        // отменяем тейк

        if (takeProfitOrderId) {
          try {
            await client.cancelOrder({
              category: "linear",
              symbol: order.symbol,
              orderId: takeProfitOrderId,
            });
          } catch (e) {
            console.log(e);
          }
        }

        resetState();
      }
    }
  }
});
ws.on("open", async () => {
  console.log("WS CONNECTED");

  ws.send(
    JSON.stringify({
      op: "subscribe",
      args: symbols.map((s) => `orderbook.${DEPTH}.${s}`),
    }),
  );
});
ws.on("message", async (raw) => {
  try {
    if (isProcessing) {
      return;
    }
    isProcessing = true;
    const msg = JSON.parse(raw.toString());
    if (!msg.topic?.includes("orderbook")) {
      return;
    }
    const symbol = msg.topic.split(".")[2];
    if (!orderbook.has(symbol)) {
      orderbook.set(symbol, {
        bids: [],
        asks: [],
      });
    }

    const book = orderbook.get(symbol)!;

    const data = msg.data;

    if (msg.type === "snapshot") {
      book.bids = data.b.map((x: string[]): [number, number] => [Number(x[0]), Number(x[1])]);
      book.asks = data.a.map((x: string[]): [number, number] => [Number(x[0]), Number(x[1])]);
    }

    if (msg.type === "delta") {
      book.bids = updateOrderbookSide(book.bids, data.b || [], true);
      book.asks = updateOrderbookSide(book.asks, data.a || [], false);
    }

    processSignal(symbol, book);
  } catch (e) {
    console.error("WS ERROR", e);
  } finally {
    isProcessing = false;
  }
});
ws.on("error", (e) => {
  console.error("WS ERROR", e);
});

ws.on("close", () => {
  console.log("WS CLOSED");
});
