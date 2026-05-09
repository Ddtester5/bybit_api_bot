import dotenv from "dotenv";
import WebSocket from "ws";
import { RestClientV5 } from "bybit-api";
dotenv.config();

const API_KEY = process.env.SCALP_API_KEY || "";
const API_SECRET = process.env.SCALP_API_SECRET || "";
const SYMBOL = "ETHUSDT";
const LEVERAGE = 10;
const ORDER_QTY = 0.01;
const DEPTH = 20;
const WALL_THRESHOLD = 1000;
const MAX_DISTANCE_PERCENT = 0.0015;
const TAKE_PROFIT_PERCENT = 0.003;
const STOP_LOSS_PERCENT = 0.0015;
const COOLDOWN_MS = 15000;

const client = new RestClientV5({
  key: API_KEY,
  secret: API_SECRET,
  testnet: false,
});

const orderbook = {
  bids: [] as [number, number][],
  asks: [] as [number, number][],
};
let inPosition = false;
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
function findBidWall() {
  return orderbook.bids.find((b) => b[1] >= WALL_THRESHOLD);
}
function findAskWall() {
  return orderbook.asks.find((a) => a[1] >= WALL_THRESHOLD);
}
async function checkPosition() {
  try {
    const res = await client.getPositionInfo({
      category: "linear",
      symbol: SYMBOL,
    });

    const active = res.result.list.find((p) => Number(p.size) > 0);

    inPosition = !!active;
  } catch (e) {
    console.error(e);
  }
}
async function openLong(entry: number) {
  try {
    const tp = entry * (1 + TAKE_PROFIT_PERCENT);
    const sl = entry * (1 - STOP_LOSS_PERCENT);
    console.log("OPEN LONG");
    console.log({
      entry,
      tp,
      sl,
    });

    const res = await client.submitOrder({
      category: "linear",
      symbol: SYMBOL,
      side: "Buy",
      orderType: "Market",
      qty: ORDER_QTY.toString(),
      takeProfit: tp.toFixed(2),
      stopLoss: sl.toFixed(2),
      timeInForce: "GTC",
    });
    console.log(res);
    lastTradeTime = Date.now();
  } catch (e) {
    console.error(e);
  }
}
async function openShort(entry: number) {
  try {
    const tp = entry * (1 - TAKE_PROFIT_PERCENT);
    const sl = entry * (1 + STOP_LOSS_PERCENT);
    console.log("OPEN SHORT");
    console.log({
      entry,
      tp,
      sl,
    });
    const res = await client.submitOrder({
      category: "linear",
      symbol: SYMBOL,
      side: "Sell",
      orderType: "Market",
      qty: ORDER_QTY.toString(),
      takeProfit: tp.toFixed(2),
      stopLoss: sl.toFixed(2),
      timeInForce: "GTC",
    });
    console.log(res);
    lastTradeTime = Date.now();
  } catch (e) {
    console.error(e);
  }
}
async function processSignal() {
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
  const bidWall = findBidWall();
  const askWall = findAskWall();
  console.log("BID WALL:", bidWall);
  console.log("ASK WALL:", askWall);
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
      await openLong(bestAsk);
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
      await openShort(bestBid);
      return;
    }
  }
}
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
    if (isProcessing) {
      return;
    }
    isProcessing = true;
    const msg = JSON.parse(raw.toString());
    if (!msg.topic?.includes("orderbook")) {
      return;
    }
    const data = msg.data;
    if (!data) {
      return;
    }
    if (msg.type === "snapshot") {
      orderbook.bids = data.b.map((x: string[]): [number, number] => [Number(x[0]), Number(x[1])]);
      orderbook.asks = data.a.map((x: string[]): [number, number] => [Number(x[0]), Number(x[1])]);
      console.log("SNAPSHOT LOADED");
      return;
    }
    if (msg.type === "delta") {
      orderbook.bids = updateOrderbookSide(orderbook.bids, data.b || [], true);
      orderbook.asks = updateOrderbookSide(orderbook.asks, data.a || [], false);
    }
    await checkPosition();
    await processSignal();
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
