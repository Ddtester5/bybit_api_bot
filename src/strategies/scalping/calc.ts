import { OrderbookLevel } from "./types";

export function distancePercent(a: number, b: number) {
  return Math.abs(a - b) / a;
}

export function findBidWall(bids: OrderbookLevel[], multiplier: number) {
  if (!bids.length) {
    return undefined;
  }

  const avg = bids.reduce((sum, [, size]) => sum + size, 0) / bids.length;

  return bids.find(([, size]) => size >= avg * multiplier);
}

export function findAskWall(asks: OrderbookLevel[], multiplier: number) {
  if (!asks.length) {
    return undefined;
  }

  const avg = asks.reduce((sum, [, size]) => sum + size, 0) / asks.length;

  return asks.find(([, size]) => size >= avg * multiplier);
}
