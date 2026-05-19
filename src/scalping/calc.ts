import { config } from "./scalp_config";
import { Orderbook, OrderbookLevel } from "./types";

export function distancePercent(a: number, b: number) {
  return Math.abs(a - b) / a;
}
export function average(levels: [number, number][]) {
  return levels.reduce((s, [, v]) => s + v, 0) / levels.length;
}

export function findBidWall(bids: OrderbookLevel[], multiplier: number): [number, number] | null {
  if (bids.length < 50) return null;

  // 1. Берем объемы первых 50 уровней стакана
  const volumes = bids.slice(0, 50).map((b) => b[1]);

  // 2. Считаем медианный объем на один уровень
  volumes.sort((a, b) => a - b);
  const medianVolume = volumes[Math.floor(volumes.length / 2)];

  // 3. Ищем реальную аномалию (стену)
  for (let i = 0; i < bids.length; i++) {
    const [price, size] = bids[i];
    // Профессиональное правило: стена должна быть больше МЕДИАНЫ в X раз
    if (size >= medianVolume * multiplier) {
      return [price, size];
    }
  }
  return null;
}

export function findAskWall(asks: OrderbookLevel[], multiplier: number): [number, number] | null {
  // Если стакан слишком пустой, прерываем поиск ради безопасности
  if (asks.length < 50) return null;

  // 1. Копируем объемы первых 50 лимитных уровней для анализа средней ликвидности
  const volumes: number[] = [];
  for (let i = 0; i < 50; i++) {
    volumes.push(asks[i][1]); // Сбор объемов (size)
  }

  // 2. Считаем медиану (сортируем по возрастанию объема и берем средний элемент)
  volumes.sort((a, b) => a - b);
  const medianVolume = volumes[Math.floor(volumes.length / 2)];

  // 3. Сканируем стакан сверху вниз в поисках реальной институциональной стены
  for (let i = 0; i < asks.length; i++) {
    const [price, size] = asks[i];

    // Плотность считается валидной стеной, если её объем превышает медиану в X раз
    if (size >= medianVolume * multiplier) {
      return [price, size];
    }
  }

  return null;
}

export function trackWalls(symbol: string, orderbook: Orderbook) {
  const bidWall = findBidWall(orderbook.bids, config.wallMultiplier);

  const askWall = findAskWall(orderbook.asks, config.wallMultiplier);

  return { bidWall, askWall };
}
