import { TradingState } from "./types";

export const tradingState: TradingState = {
  inPosition: false,
  isOpeningPosition: false,
  entryOrderId: null,
  takeProfitOrderId: null,
  stopLossOrderId: null,
};
export function resetState() {
  tradingState.inPosition = false;
  tradingState.isOpeningPosition = false;
  tradingState.entryOrderId = null;
  tradingState.takeProfitOrderId = null;
  tradingState.stopLossOrderId = null;
}
