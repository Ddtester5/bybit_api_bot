import { config } from "./scalp_config";
import { OrderbookLevel } from "./types";

export function updateOrderbookSide(current: OrderbookLevel[], updates: string[][], isBid: boolean) {
  const map = new Map<number, number>();

  for (const [price, size] of current) {
    map.set(price, size);
  }

  for (const [p, s] of updates) {
    const price = Number(p);
    const size = Number(s);

    if (size === 0) {
      map.delete(price);
    } else {
      map.set(price, size);
    }
  }

  return Array.from(map.entries())
    .sort((a, b) => {
      return isBid ? b[0] - a[0] : a[0] - b[0];
    })
    .slice(0, config.depth);
}
