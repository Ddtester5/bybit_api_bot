import { config } from "./scalp_config";
import { Orderbook, OrderbookLevel } from "./types";

export function distancePercent(a: number, b: number) {
  return Math.abs(a - b) / a;
}
export function average(levels: [number, number][]) {
  return levels.reduce((s, [, v]) => s + v, 0) / levels.length;
}

export function findBidWall(bids: OrderbookLevel[], multiplier: number) {
  if (!bids.length) {
    return undefined;
  }

  const avg = average(bids);

  return bids.find(([, size]) => size >= avg * multiplier);
}

export function findAskWall(asks: OrderbookLevel[], multiplier: number) {
  if (!asks.length) {
    return undefined;
  }

  const avg = average(asks);

  return asks.find(([, size]) => size >= avg * multiplier);
}

export function trackWalls(symbol: string, orderbook: Orderbook) {
  const bidWall = findBidWall(orderbook.bids, config.wallMultiplier);

  const askWall = findAskWall(orderbook.asks, config.wallMultiplier);

  return { bidWall, askWall };
}
