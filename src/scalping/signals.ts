import { client } from "./bybit";
import { distancePercent, findAskWall, findBidWall } from "./calc";
import { openPosition } from "./orders";
import { config } from "./scalp_config";
import { getTradingState, resetState, wallState } from "./state";
import { Orderbook } from "./types";

export async function processSignal(symbol: string, orderbook: Orderbook) {
  const tradingState = getTradingState(symbol);

  if (tradingState.isProcessingPublickWs) return;
  tradingState.isProcessingPublickWs = true;

  try {
    // 1. Проверка таймаута лимитного ордера на вход
    if (
      tradingState.inStartOrder &&
      tradingState.entryOrderId &&
      tradingState.createdAt &&
      Date.now() - tradingState.createdAt > config.order_time_life_second * 1000
    ) {
      console.log(`[TIMEOUT] Position open for too long on ${symbol}, resetting state`);
      try {
        await client.cancelOrder({
          category: "linear",
          symbol,
          orderId: tradingState.entryOrderId,
        });
      } catch (cancelError) {
        console.error(`[TIMEOUT ERROR] Failed to cancel stale order for ${symbol}:`, cancelError);
      }
      resetState(symbol);
      return;
    }

    // Если мы уже в позиции или ждем налития ордера — новые стены не ищем
    if (tradingState.inStartOrder || tradingState.inPosition) {
      return;
    }

    if (orderbook.bids.length === 0 || orderbook.asks.length === 0) return;

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
        state.bid = { price, size, count: 1 };
      } else {
        state.bid.count++;
      }

      const isStable = state.bid.count >= config.minWallStability;
      const dist = distancePercent(mid, price);
      const isOpenPosition = isStable && price < mid && dist <= config.maxDistancePercent;

      if (isOpenPosition) {
        wallState.set(symbol, state);
        await openPosition(symbol, "Buy", price);
        return; // Выходим, чтобы не обрабатывать Ask на этом же тике
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
        state.ask = { price, size, count: 1 };
      } else {
        state.ask.count++;
      }

      const isStable = state.ask.count >= config.minWallStability;
      const dist = distancePercent(mid, price);
      const isOpenPosition = isStable && price > mid && dist <= config.maxDistancePercent;

      if (isOpenPosition) {
        wallState.set(symbol, state);
        await openPosition(symbol, "Sell", price);
        return;
      }
    } else {
      if (state.ask) state.ask = undefined;
    }

    // Очистка памяти: если стен больше нет, удаляем символ из Map полностью
    if (!state.bid && !state.ask) {
      wallState.delete(symbol);
    } else {
      wallState.set(symbol, state);
    }
  } catch (error) {
    console.error(`[SIGNAL ERROR] process signal error for ${symbol}:`, error);
  } finally {
    tradingState.isProcessingPublickWs = false;
  }
}
