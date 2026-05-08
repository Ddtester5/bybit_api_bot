import dotenv from "dotenv";
import WebSocket from "ws";
import { createClient } from "../api/bybit_api_client_v5";

dotenv.config();

// ==============================
// CONFIG
// ==============================

const API_KEY = process.env.SCALP_API_KEY || "";
const API_SECRET = process.env.SCALP_API_SECRET || "";

const SYMBOL = "ETHUSDT";

const LEVERAGE = 10;
const ORDER_QTY = 0.01;

// wall logic
const WALL_THRESHOLD = 5000;
const MAX_DISTANCE_PERCENT = 0.0015;

// TP/SL
const TAKE_PROFIT_PERCENT = 0.002;
const STOP_LOSS_BUFFER = 0.0005;

// risk control
const COOLDOWN_MS = 150000;

// ==============================
// CLIENT
// ==============================

const client = createClient(API_KEY, API_SECRET);

// ==============================
// STATE
// ==============================

const orderbook = {
  bids: [] as [number, number][],
  asks: [] as [number, number][],
};

let inPosition = false;
let lastTradeTime = 0;

// ==============================
// HELPERS
// ==============================

function distancePercent(a: number, b: number) {
  return Math.abs(a - b) / a;
}

function findBidWall() {
  return orderbook.bids.find((b) => b[1] > WALL_THRESHOLD);
}

function findAskWall() {
  return orderbook.asks.find((a) => a[1] > WALL_THRESHOLD);
}

// ==============================
// TRADING
// ==============================

async function openLong(entry: number, wall: number) {
  try {
    inPosition = true;

    const tp = entry * (1 + TAKE_PROFIT_PERCENT);
    const sl = wall * (1 - STOP_LOSS_BUFFER);

    console.log("OPEN LONG (WALL BOUNCE)");

    const res = await client.submitOrder({
      category: "linear",
      symbol: SYMBOL,
      side: "Buy",
      orderType: "Market",
      qty: ORDER_QTY.toString(),
      takeProfit: tp.toFixed(5),
      stopLoss: sl.toFixed(5),
      timeInForce: "GTC",
    });

    console.log(res);
  } catch (e) {
    console.error(e);
  } finally {
    setTimeout(() => {
      inPosition = false;
    }, 30000);
  }
}

async function openShort(entry: number, wall: number) {
  try {
    inPosition = true;

    const tp = entry * (1 - TAKE_PROFIT_PERCENT);
    const sl = wall * (1 + STOP_LOSS_BUFFER);

    console.log("OPEN SHORT (WALL BOUNCE)");

    const res = await client.submitOrder({
      category: "linear",
      symbol: SYMBOL,
      side: "Sell",
      orderType: "Market",
      qty: ORDER_QTY.toString(),
      takeProfit: tp.toFixed(5),
      stopLoss: sl.toFixed(5),
      timeInForce: "GTC",
    });

    console.log(res);
  } catch (e) {
    console.error(e);
  } finally {
    setTimeout(() => {
      inPosition = false;
    }, 30000);
  }
}

// ==============================
// SIGNAL ENGINE
// ==============================

async function processSignal() {
  if (inPosition) return;

  const now = Date.now();
  if (now - lastTradeTime < COOLDOWN_MS) return;

  if (!orderbook.bids.length || !orderbook.asks.length) return;

  const bestBid = orderbook.bids[0][0];
  const bestAsk = orderbook.asks[0][0];
  const mid = (bestBid + bestAsk) / 2;

  const bidWall = findBidWall();
  const askWall = findAskWall();

  // ==========================
  // LONG BOUNCE
  // ==========================
  if (bidWall) {
    const [price, size] = bidWall;

    const dist = distancePercent(mid, price);

    if (price < mid && dist < MAX_DISTANCE_PERCENT) {
      console.log("BID WALL DETECTED", { price, size });

      lastTradeTime = now;
      await openLong(bestAsk, price);
      return;
    }
  }

  // ==========================
  // SHORT BOUNCE
  // ==========================
  if (askWall) {
    const [price, size] = askWall;

    const dist = distancePercent(mid, price);

    if (price > mid && dist < MAX_DISTANCE_PERCENT) {
      console.log("ASK WALL DETECTED", { price, size });

      lastTradeTime = now;
      await openShort(bestBid, price);
      return;
    }
  }
}

// ==============================
// WEBSOCKET
// ==============================

const ws = new WebSocket("wss://stream.bybit.com/v5/public/linear");

ws.on("open", async () => {
  console.log("WS CONNECTED");

  await client.setLeverage({
    category: "linear",
    symbol: SYMBOL,
    buyLeverage: LEVERAGE.toString(),
    sellLeverage: LEVERAGE.toString(),
  });

  ws.send(
    JSON.stringify({
      op: "subscribe",
      args: [`orderbook.50.${SYMBOL}`],
    }),
  );
});

ws.on("message", async (data) => {
  const msg = JSON.parse(data.toString());

  if (!msg.topic?.includes("orderbook")) return;

  const b = msg.data;

  if (!b?.b || !b?.a) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  orderbook.bids = b.b.map((x: any[]) => [Number(x[0]), Number(x[1])]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  orderbook.asks = b.a.map((x: any[]) => [Number(x[0]), Number(x[1])]);

  await processSignal();
});

ws.on("error", console.error);
ws.on("close", () => console.log("WS CLOSED"));
