import { DEPTH } from "../config";

export function updateOrderbookSide(
  current: [number, number][],
  updates: string[][],
  isBid: boolean,
) {
  const map = new Map<number, number>();

  // current levels
  for (const [price, size] of current) {
    map.set(price, size);
  }

  // delta updates
  for (const [p, s] of updates) {
    const price = Number(p);
    const size = Number(s);

    // remove level
    if (size === 0) {
      map.delete(price);
    } else {
      map.set(price, size);
    }
  }

  const result: [number, number][] = Array.from(map.entries());

  // sort
  result.sort((a, b) => {
    return isBid ? b[0] - a[0] : a[0] - b[0];
  });

  return result.slice(0, DEPTH);
}
