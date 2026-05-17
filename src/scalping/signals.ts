import { client } from "./bybit";
import { distancePercent, findAskWall, findBidWall } from "./calc";
import { openPosition } from "./orders";
import { config } from "./scalp_config";
import { resetState, tradingState, wallState } from "./state";
import { Orderbook } from "./types";

export async function processSignal(symbol: string, orderbook: Orderbook) {
  if (
    tradingState.inStartOrder &&
    tradingState.entryOrderId &&
    tradingState.createdAt &&
    Date.now() - tradingState.createdAt > config.order_time_life_second * 1000
  ) {
    console.log("Position open for too long, resetting state");
    await client.cancelOrder({
      category: "linear",
      symbol,
      orderId: tradingState.entryOrderId,
    });
    resetState();
    console.log({ tradingState });
    return;
  }
  const bestBid = orderbook.bids[0][0];
  const bestAsk = orderbook.asks[0][0];
  const mid = (bestBid + bestAsk) / 2;

  const bidWall = findBidWall(orderbook.bids, config.wallMultiplier);

  const askWall = findAskWall(orderbook.asks, config.wallMultiplier);

  const state = wallState.get(symbol) || {};
  // console.log({ symbol, bestBid, bestAsk, bidWall, askWall, state, tradingState });

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
    const isOpenPosition = isStable && price < mid && dist <= config.maxDistancePercent;
    // console.log("BID WALL", { symbol, mid, price, dist, isStable ,isOpenPosition });
    if (isOpenPosition) {
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
    const isOpenPosition = isStable && price > mid && dist <= config.maxDistancePercent;
    // console.log("ASK WALL", { symbol, mid, price, dist, isStable,isOpenPosition });
    if (isOpenPosition) {
      await openPosition(symbol, "Sell", price);
    }
  } else {
    if (state.ask) state.ask = undefined;
  }
}
