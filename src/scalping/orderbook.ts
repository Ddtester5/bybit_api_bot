import { OrderbookLevel } from "./types";

export function updateOrderbookSide(current: OrderbookLevel[], updates: string[][]): OrderbookLevel[] {
  if (updates.length === 0) return current;

  // 1. Быстро создаем Map на основе текущего стакана
  const map = new Map<number, number>(current);

  // 2. Просто вносим изменения из дельты без всяких сортировок
  for (let i = 0; i < updates.length; i++) {
    const price = Number(updates[i][0]);
    const size = Number(updates[i][1]);

    if (size === 0) {
      map.delete(price);
    } else {
      map.set(price, size);
    }
  }

  // 3. Возвращаем обычный массив (он пока не отсортирован, и это нормально!)
  return Array.from(map.entries());
}
