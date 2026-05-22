import { updateOrderbookSide } from "./orderbook";
import { processSignal } from "./signals";
import { getTradingState } from "./state";
import { config } from "./scalp_config"; // Импортируем конфиг для лимита глубины
import { Orderbook } from "./types";

const orderbooks = new Map<string, Orderbook>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function handleOrderbookMessage(msg: any) {
  if (!msg.topic?.includes("orderbook")) return;

  const symbol = msg.topic.split(".")[2]; // Исправлен индекс для топика вида orderbook.50.SUIUSDT

  if (!orderbooks.has(symbol)) {
    orderbooks.set(symbol, { bids: [], asks: [] });
  }

  const orderbook = orderbooks.get(symbol)!;
  const data = msg.data;

  // ========================================================
  // ЭТАП 1: ВСЕГДА ОБНОВЛЯЕМ СТАКАН (Без сортировки, мгновенно)
  // ========================================================
  if (msg.type === "snapshot") {
    orderbook.bids = data.b.map((x: string[]) => [Number(x[0]), Number(x[1])]);
    orderbook.asks = data.a.map((x: string[]) => [Number(x[0]), Number(x[1])]);
  }

  if (msg.type === "delta") {
    orderbook.bids = updateOrderbookSide(orderbook.bids, data.b || []);
    orderbook.asks = updateOrderbookSide(orderbook.asks, data.a || []);
  }

  // ========================================================
  // ЭТАП 2: ФИЛЬТРАЦИЯ И ЭКОНОМИЯ РЕСУРСОВ CPU
  // ========================================================
  const tradingState = getTradingState(symbol);

  // Если мы заняты сделкой — выходим. Стакан ОБНОВЛЕН в памяти, но мы сэкономили тонну ресурсов на сортировке!
  if (tradingState.isProcessingPublickWs || tradingState.isOpeningPosition || tradingState.inPosition) {
    return;
  }

  // ========================================================
  // ЭТАП 3: СОРТИРОВКА СТАКАНА СТРОГО ПЕРЕД ПОИСКОМ СТЕН
  // ========================================================
  // Сортируем и обрезаем стакан до нужной config.depth только для передачи в алгоритм сигналов
  const sortedBids = [...orderbook.bids].sort((a, b) => b[0] - a[0]).slice(0, config.depth);

  const sortedAsks = [...orderbook.asks].sort((a, b) => a[0] - b[0]).slice(0, config.depth);

  const sortedOrderbook: Orderbook = {
    bids: sortedBids,
    asks: sortedAsks,
  };

  // Передаем отсортированный слепок стакана в стратегию
  processSignal(symbol, sortedOrderbook).catch((err) => {
    console.error(`[SIGNAL ERROR] Error processing signal for ${symbol}:`, err);
  });
}
