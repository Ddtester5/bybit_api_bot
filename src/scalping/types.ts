export type Side = "Buy" | "Sell";

export interface TradingState {
  isProcessingPublickWs: boolean;
  inStartOrder: boolean;
  inPosition: boolean;
  isOpeningPosition: boolean;
  entryOrderId: string | null;
  takeProfitOrderId: string | null;
  stopLossOrderId: string | null;
  createdAt: number | null;
  currentOrderQty: number | null;
}

export type OrderbookLevel = [number, number]; // [price, size]

export interface Orderbook {
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
}

export interface WallState {
  price: number;
  size: number;
  firstSeenAt: number; // Храним время, когда стену увидели ВПЕРВЫЕ
}
