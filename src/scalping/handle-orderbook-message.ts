import { updateOrderbookSide } from "./orderbook";
import { processSignal } from "./signals";
import { getTradingState } from "./state";
import { Orderbook } from "./types";

const orderbooks = new Map<string, Orderbook>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function handleOrderbookMessage(msg: any) {
  if (!msg.topic?.includes("orderbook")) {
    return;
  }

  const symbol = msg.topic.split(".")[2];

  if (!orderbooks.has(symbol)) {
    orderbooks.set(symbol, {
      bids: [],
      asks: [],
    });
  }

  const orderbook = orderbooks.get(symbol)!;
  const data = msg.data;

  // ==========================================
  // ЭТАП 1: ВСЕГДА ОБНОВЛЯЕМ ОРДЕРБУК
  // ==========================================
  if (msg.type === "snapshot") {
    orderbook.bids = data.b.map((x: string[]) => [Number(x[0]), Number(x[1])]);
    orderbook.asks = data.a.map((x: string[]) => [Number(x[0]), Number(x[1])]);
  }

  if (msg.type === "delta") {
    orderbook.bids = updateOrderbookSide(orderbook.bids, data.b || [], true);
    orderbook.asks = updateOrderbookSide(orderbook.asks, data.a || [], false);
  }

  // ==========================================
  // ЭТАП 2: ПРОВЕРКА СОСТОЯНИЯ И ФИЛЬТРАЦИЯ
  // ==========================================
  const tradingState = getTradingState(symbol);

  if (tradingState.isProcessingPublickWs || tradingState.isOpeningPosition) {
    return; // Стакан обновили, но расчет сигнала пропускаем, так как заняты
  }

  // Запуск расчета сигнала без блокировки потока данных
  processSignal(symbol, orderbook).catch((err) => {
    console.error(`[SIGNAL ERROR] Error processing signal for ${symbol}:`, err);
  });
}
