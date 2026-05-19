import { TradingState, WallState } from "./types";

export function createDefaultTradingState(): TradingState {
  return {
    isProcessingPublickWs: false,
    inStartOrder: false,
    inPosition: false,
    isOpeningPosition: false,
    entryOrderId: null,
    takeProfitOrderId: null,
    stopLossOrderId: null,
    createdAt: null,
    currentOrderQty: null,
  };
}

// Хранилище состояний для каждой монеты отдельно
const symbolTradingStates = new Map<string, TradingState>();

export function getTradingState(symbol: string): TradingState {
  let state = symbolTradingStates.get(symbol);
  if (!state) {
    state = createDefaultTradingState();
    symbolTradingStates.set(symbol, state);
  }
  return state;
}

export function resetState(symbol: string) {
  const state = symbolTradingStates.get(symbol);
  if (!state) return;

  state.inStartOrder = false;
  state.inPosition = false;
  state.isOpeningPosition = false;
  state.entryOrderId = null;
  state.takeProfitOrderId = null;
  state.stopLossOrderId = null;
  state.createdAt = null;
  state.currentOrderQty = null;
  console.log(`[STATE] tradingState was reset for ${symbol}`, state);
}

export function resetAllStates() {
  symbolTradingStates.clear();
  wallState.clear();
  console.log("[STATE] Emergency flush: All symbol states wiped clean.");
}

export const wallState = new Map<
  string,
  {
    bid?: WallState;
    ask?: WallState;
  }
>();
