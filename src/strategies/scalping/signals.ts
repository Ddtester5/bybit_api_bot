import { average, distancePercent } from "./calc";
import { openPosition } from "./orders";
import { config } from "./scalp_config";
import { tradingState } from "./state";
import { Orderbook, wallState } from "./types";

export async function processSignal(symbol: string, orderbook: Orderbook) {
  if (tradingState.inPosition) {
    return;
  }

  const bestBid = orderbook.bids[0][0];
  const bestAsk = orderbook.asks[0][0];
  const mid = (bestBid + bestAsk) / 2;

  const bidWallRaw = orderbook.bids.find((b) => b[1] >= average(orderbook.bids) * config.wallMultiplier);

  const askWallRaw = orderbook.asks.find((a) => a[1] >= average(orderbook.asks) * config.wallMultiplier);

  const state = wallState.get(symbol) || {};

  // =========================
  // BID WALL TRACKING
  // =========================
  if (bidWallRaw) {
    const [price, size] = bidWallRaw;

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

    const dist = distancePercent(mid, price);

    const isStable = state.bid.count >= config.minWallStability;

    const broke = bestBid < price;

    if (isStable && price < mid && dist <= config.maxDistancePercent && broke) {
      await openPosition(symbol, "Buy", price);
      return;
    }
  } else {
    if (state.bid) state.bid = undefined;
  }

  // =========================
  // ASK WALL TRACKING
  // =========================
  if (askWallRaw) {
    const [price, size] = askWallRaw;

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

    const dist = distancePercent(mid, price);

    const isStable = state.ask.count >= config.minWallStability;

    const broke = bestAsk > price;

    if (isStable && price > mid && dist <= config.maxDistancePercent && broke) {
      await openPosition(symbol, "Sell", price);
    }
  } else {
    if (state.ask) state.ask = undefined;
  }
}
