import { RestClientV5 } from "bybit-api";
import {
  COOLDOWN_MS,
  MAX_DISTANCE_PERCENT,
  MIN_AGGRESSIVE_VOLUME,
  MIN_WALL_REMAIN_PERCENT,
  WALL_MIN_LIFETIME_MS,
} from "../config";
import { orderbookType, WallInfo } from "../types";

let currentBidWall: WallInfo | null = null;
let currentAskWall: WallInfo | null = null;

let aggressiveBuyVolume = 0;
let aggressiveSellVolume = 0;

export async function processSignal(
  inPosition: boolean,
  lastTradeTime: number,
  orderbook: orderbookType,
  client: RestClientV5,
) {
  if (inPosition) return lastTradeTime;
  const now = Date.now();

  // cooldown
  if (now - lastTradeTime < COOLDOWN_MS) {
    return lastTradeTime;
  }

  if (!orderbook.bids.length || !orderbook.asks.length) {
    return lastTradeTime;
  }
  const bestBid = orderbook.bids[0]?.[0];
  const bestAsk = orderbook.asks[0]?.[0];
  if (!bestBid || !bestAsk) return lastTradeTime;
  const mid = (bestBid + bestAsk) / 2;
  // --- обновление стенок ---
  updateBidWall(orderbook);
  updateAskWall(orderbook);

  // --- LONG ---
  if (currentBidWall) {
    const dist = Math.abs(mid - currentBidWall.price) / mid;
    const lifetime = now - currentBidWall.firstSeen;
    const remainPercent = currentBidWall.size / currentBidWall.originalSize;
    const absorption = aggressiveSellVolume >= MIN_AGGRESSIVE_VOLUME;

    if (
      lifetime >= WALL_MIN_LIFETIME_MS &&
      remainPercent >= MIN_WALL_REMAIN_PERCENT &&
      absorption &&
      dist <= MAX_DISTANCE_PERCENT
    ) {
      console.log("LONG SIGNAL");
      lastTradeTime = now;
      aggressiveSellVolume = 0;

      const tp = bestAsk * 1.002;
      const sl = currentBidWall.price * 0.999;

      await client.submitOrder({
        category: "linear",
        symbol: process.env.SYMBOL!,
        side: "Buy",
        orderType: "Market",
        qty: "0.01",
        takeProfit: tp.toFixed(5),
        stopLoss: sl.toFixed(5),
        timeInForce: "GTC",
      });
    }
  }

  // --- SHORT ---
  if (currentAskWall) {
    const dist = Math.abs(mid - currentAskWall.price) / mid;
    const lifetime = now - currentAskWall.firstSeen;
    const remainPercent = currentAskWall.size / currentAskWall.originalSize;
    const absorption = aggressiveBuyVolume >= MIN_AGGRESSIVE_VOLUME;

    if (
      lifetime >= WALL_MIN_LIFETIME_MS &&
      remainPercent >= MIN_WALL_REMAIN_PERCENT &&
      absorption &&
      dist <= MAX_DISTANCE_PERCENT
    ) {
      console.log("SHORT SIGNAL");
      lastTradeTime = now;
      aggressiveBuyVolume = 0;

      const tp = bestBid * 0.998;
      const sl = currentAskWall.price * 1.001;

      await client.submitOrder({
        category: "linear",
        symbol: process.env.SYMBOL!,
        side: "Sell",
        orderType: "Market",
        qty: "0.01",
        takeProfit: tp.toFixed(5),
        stopLoss: sl.toFixed(5),
        timeInForce: "GTC",
      });
    }
  }

  return lastTradeTime;
}
// --- функции обновления стенок ---
function updateBidWall(orderbook: orderbookType) {
  if (!orderbook.bids.length) {
    currentBidWall = null;
    return;
  }

  const avg =
    orderbook.bids.reduce((s, x) => s + x[1], 0) / orderbook.bids.length;
  const wall = orderbook.bids.reduce((max, lvl) =>
    lvl[1] > max[1] ? lvl : max,
  );
  if (!wall || wall[1] < avg * 5) {
    currentBidWall = null;
    return;
  }

  if (!currentBidWall || currentBidWall.price !== wall[0]) {
    currentBidWall = {
      price: wall[0],
      size: wall[1],
      originalSize: wall[1],
      firstSeen: Date.now(),
    };
  } else {
    currentBidWall.size = wall[1];
  }
}

function updateAskWall(orderbook: orderbookType) {
  if (!orderbook.asks.length) {
    currentAskWall = null;
    return;
  }

  const avg =
    orderbook.asks.reduce((s, x) => s + x[1], 0) / orderbook.asks.length;
  const wall = orderbook.asks.reduce((max, lvl) =>
    lvl[1] > max[1] ? lvl : max,
  );
  if (!wall || wall[1] < avg * 5) {
    currentAskWall = null;
    return;
  }

  if (!currentAskWall || currentAskWall.price !== wall[0]) {
    currentAskWall = {
      price: wall[0],
      size: wall[1],
      originalSize: wall[1],
      firstSeen: Date.now(),
    };
  } else {
    currentAskWall.size = wall[1];
  }
}
