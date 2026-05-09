export type orderbookType = {
  bids: [number, number][];
  asks: [number, number][];
};
export type WallInfo = {
  price: number;
  size: number;
  firstSeen: number;
  originalSize: number;
};
