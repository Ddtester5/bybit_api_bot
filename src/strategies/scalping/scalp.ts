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
const TAKE_PROFIT_PERCENT = 0.004;
const STOP_LOSS_PERCENT = 0.0005;
const COOLDOWN_MS = 15000;
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
let inPosition = true;
let lastTradeTime = 0;
let isProcessing = false;

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
async function checkPosition() {
  try {
    const posRes = await client.getPositionInfo({
      category: "linear",
      settleCoin: "USDT",
    });
    const positions = posRes?.result?.list || [];
    const hasPosition = positions.some((p) => Number(p.size) > 0);

    const orderRes = await client.getActiveOrders({
      category: "linear",
      settleCoin: "USDT",
    });
    const orders = orderRes?.result?.list || [];

    const hasOrders = orders.length > 0;

    inPosition = hasPosition || hasOrders;
  } catch (e) {
    console.error("checkPosition error:", e);
    inPosition = false;
  }
}
async function openLong(symbol: string, price: number) {
  if (inPosition) {
    return;
  }
  inPosition = true;
  try {
    const openPrice = price * (1 + WALL_ENTRY_BUFFER);
    const tp = openPrice * (1 + TAKE_PROFIT_PERCENT);
    const sl = openPrice * (1 - STOP_LOSS_PERCENT);
    console.log("OPEN LONG");
    console.log({
      price: openPrice,
      tp,
      sl,
    });

    const res = await client.submitOrder({
      category: "linear",
      symbol: symbol,
      side: "Buy",
      orderType: "Limit",
      isLeverage: LEVERAGE,
      price: openPrice.toFixed(4),
      qty: ORDER_QTY.toString(),
      takeProfit: tp.toFixed(4),
      stopLoss: sl.toFixed(4),
      timeInForce: "GTC",
    });

    console.log(res);
    lastTradeTime = Date.now();
  } catch (e) {
    console.error(e);
  }
}
async function openShort(symbol: string, price: number) {
  if (inPosition) {
    return;
  }
  inPosition = true;
  try {
    const openPrice = price * (1 - WALL_ENTRY_BUFFER);
    const tp = openPrice * (1 - TAKE_PROFIT_PERCENT);
    const sl = openPrice * (1 + STOP_LOSS_PERCENT);
    console.log("OPEN SHORT");
    console.log({
      price: openPrice,
      tp,
      sl,
    });
    const res = await client.submitOrder({
      category: "linear",
      symbol: symbol,
      side: "Sell",
      orderType: "Limit",
      isLeverage: LEVERAGE,
      price: openPrice.toFixed(4),
      qty: ORDER_QTY.toString(),
      takeProfit: tp.toFixed(4),
      stopLoss: sl.toFixed(4),
      timeInForce: "GTC",
    });
    console.log(res);
    lastTradeTime = Date.now();
  } catch (e) {
    console.error(e);
  }
}
async function processSignal(symbol: string, orderbook: { bids: [number, number][]; asks: [number, number][] }) {
  if (inPosition) {
    return;
  }
  if (Date.now() - lastTradeTime < COOLDOWN_MS) {
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
      await openLong(symbol, price);
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
      await openShort(symbol, price);
      return;
    }
  }
}
setInterval(async () => {
  await checkPosition();
}, 5000);
privateWs.on("message", (raw) => {
  const msg = JSON.parse(raw.toString());
  console.log(msg);
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
