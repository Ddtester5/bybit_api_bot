import { distancePercent, findAskWall, findBidWall } from "./calc";
import { openPosition } from "./orders";
import { config } from "./scalp_config";
import { tradingState } from "./state";
import { Orderbook } from "./types";

export async function processSignal(symbol: string, orderbook: Orderbook) {
  if (tradingState.inPosition) {
    return;
  }

  const bestBid = orderbook.bids[0][0];
  const bestAsk = orderbook.asks[0][0];

  const mid = (bestBid + bestAsk) / 2;

  const bidWall = findBidWall(orderbook.bids, config.wallMultiplier);

  const askWall = findAskWall(orderbook.asks, config.wallMultiplier);

  if (bidWall) {
    const [price] = bidWall;

    const dist = distancePercent(mid, price);

    if (price < mid && dist <= config.maxDistancePercent) {
      await openPosition(symbol, "Buy", price);

      return;
    }
  }

  if (askWall) {
    const [price] = askWall;

    const dist = distancePercent(mid, price);

    if (price > mid && dist <= config.maxDistancePercent) {
      await openPosition(symbol, "Sell", price);
    }
  }
}
