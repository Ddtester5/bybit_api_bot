import { distancePercent, findAskWall, findBidWall } from "./calc";
import { openPosition } from "./orders";
import { config } from "./scalp_config";
import { tradingState, wallState } from "./state";
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

  const state = wallState.get(symbol) || {};

  // =========================
  // BID WALL (LONG)
  // =========================
  if (bidWall) {
    const [price, size] = bidWall;

    if (!state.bid || state.bid.price !== price) {
      state.bid = {
        price,
        size,
        count: 1,
      };
    } else {
      state.bid.count++;
    }

    wallState.set(symbol, state);

    const isStable = state.bid.count >= config.minWallStability;
    const dist = distancePercent(mid, price);

    if (isStable && price < mid && dist <= config.maxDistancePercent) {
      await openPosition(symbol, "Buy", price);

      return;
    }
  } else {
    if (state.bid) state.bid = undefined;
  }

  // =========================
  // ASK WALL (SHORT)
  // =========================
  if (askWall) {
    const [price, size] = askWall;

    if (!state.ask || state.ask.price !== price) {
      state.ask = {
        price,
        size,
        count: 1,
      };
    } else {
      state.ask.count++;
    }

    wallState.set(symbol, state);

    const isStable = state.ask.count >= config.minWallStability;

    const dist = distancePercent(mid, price);

    if (isStable && price > mid && dist <= config.maxDistancePercent) {
      await openPosition(symbol, "Sell", price);
    }
  } else {
    if (state.ask) state.ask = undefined;
  }
}
