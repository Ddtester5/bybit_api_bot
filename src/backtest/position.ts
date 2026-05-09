import { BACKTEST_COMMISSION_RATE, BACKTEST_FUNDING_RATE_ESTIMATE } from "../config/main_config";

import { Candle, ClosedTrade, Position, StrategyConfig } from "../types/types";

export function tryOpenPosition({
  balance,
  config,
  index,
  price,
  symbol,
}: {
  balance: number;
  price: number;
  symbol: string;
  index: number;
  config: StrategyConfig;
}): Position | null {
  const stopLoss = price * (1 + config.strategyStopLossDelta);
  const takeProfit = price * (1 - config.strategyTakeProfitDelta);

  const risk = balance * config.maxRisk;
  const stopDistance = Math.abs(price - stopLoss);

  if (stopDistance === 0) return null;

  const qty = risk / stopDistance;

  if (!isFinite(qty) || qty <= 0) return null;

  return {
    symbol,
    entry: price,
    stopLoss,
    takeProfit,
    qty,
    openIndex: index,
  };
}

export function tryClosePosition(position: Position, candle: Candle, index: number): ClosedTrade | null {
  if (position.openIndex === index) return null;

  let exitPrice: number | null = null;

  if (candle.high >= position.stopLoss) {
    exitPrice = position.stopLoss;
  } else if (candle.low <= position.takeProfit) {
    exitPrice = position.takeProfit;
  }

  if (exitPrice === null) return null;

  const pnl = (position.entry - exitPrice) * position.qty;

  const fees = (position.entry + exitPrice) * position.qty * BACKTEST_COMMISSION_RATE;

  const barsHeld = index - position.openIndex;

  const funding = (position.entry * position.qty * BACKTEST_FUNDING_RATE_ESTIMATE * barsHeld) / 8;

  const result = pnl - fees - funding;

  if (!isFinite(result)) return null;

  return {
    pnl: result,
    win: result > 0,
    barsHeld,
    symbol: position.symbol,
  };
}
