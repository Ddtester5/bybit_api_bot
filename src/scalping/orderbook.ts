import { config } from "./scalp_config";
import { OrderbookLevel } from "./types";

export function updateOrderbookSide(current: OrderbookLevel[], updates: string[][], isBid: boolean): OrderbookLevel[] {
  if (updates.length === 0) {
    return current.length > config.depth ? current.slice(0, config.depth) : current;
  }

  // Быстрый нативный маппинг стакана
  const map = new Map<number, number>(current);

  for (let i = 0; i < updates.length; i++) {
    const price = Number(updates[i][0]);
    const size = Number(updates[i][1]);

    if (size === 0) {
      map.delete(price);
    } else {
      map.set(price, size);
    }
  }

  const updatedArray = Array.from(map.entries());

  if (isBid) {
    updatedArray.sort((a, b) => b[0] - a[0]); // Bids: от большего к меньшему
  } else {
    updatedArray.sort((a, b) => a[0] - b[0]); // Asks: от меньшего к большему
  }

  return updatedArray.length > config.depth ? updatedArray.slice(0, config.depth) : updatedArray;
}
