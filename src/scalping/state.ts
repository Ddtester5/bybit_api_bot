import { TradingState } from "./types";

export const tradingState: TradingState = {
  inStartOrder: false,
  inPosition: false,
  isOpeningPosition: false,
  entryOrderId: null,
  takeProfitOrderId: null,
  stopLossOrderId: null,
  createdAt: null,
};
export function resetState() {
  tradingState.inStartOrder = false;
  tradingState.inPosition = false;
  tradingState.isOpeningPosition = false;
  tradingState.entryOrderId = null;
  tradingState.takeProfitOrderId = null;
  tradingState.stopLossOrderId = null;
}
type WallState = {
  price: number;
  size: number;
  count: number;
};

export const wallState = new Map<
  string,
  {
    bid?: WallState;
    ask?: WallState;
  }
>();
