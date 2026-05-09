import { WALL_THRESHOLD } from "../config";
import { orderbookType } from "../types";

export function findBidWall(orderbook: orderbookType) {
  return orderbook.bids.find((b) => b[1] >= WALL_THRESHOLD);
}
export function findAskWall(orderbook: orderbookType) {
  return orderbook.asks.find((a) => a[1] >= WALL_THRESHOLD);
}
