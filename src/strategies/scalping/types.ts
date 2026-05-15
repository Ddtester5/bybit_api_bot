export type OrderbookLevel = [number, number];

export interface Orderbook {
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
}
export type Side = "Buy" | "Sell";

export interface TradingState {
  inPosition: boolean;
  isOpeningPosition: boolean;
  entryOrderId: string | null;
  takeProfitOrderId: string | null;
  stopLossOrderId: string | null;
}
