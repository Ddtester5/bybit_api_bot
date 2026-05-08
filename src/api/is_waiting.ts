import { RestClientV5 } from "bybit-api";

export async function isWaitPeriodActive({
  candle_interval,
  pause_candle,
  client,
}: {
  candle_interval: number;
  pause_candle: number;
  client: RestClientV5;
}): Promise<boolean> {
  try {
    // Не указываем symbol, чтобы получить сделки по всему аккаунту (linear)
    const response = await client.getClosedPnL({
      category: "linear",
      limit: 50, // берем с запасом, чтобы точно найти последний закрытый ордер
    });

    const trades = response.result.list;
    if (!trades || trades.length === 0) return false;

    // Ищем самую свежую сделку с отрицательным PnL
    const lastLossTrade = trades.find(
      (trade) => parseFloat(trade.closedPnl) < 0,
    );

    if (lastLossTrade) {
      const closeTime = parseInt(lastLossTrade.updatedTime);
      const currentTime = Date.now();

      const pauseDurationMs = pause_candle * candle_interval * 60 * 1000;
      const timePassedMs = currentTime - closeTime;

      if (timePassedMs < pauseDurationMs) {
        const remainMinutes = Math.ceil(
          (pauseDurationMs - timePassedMs) / 1000 / 60,
        );

        console.log(
          `[Account] Пауза после убытка на ${lastLossTrade.symbol}. Ждать: ${remainMinutes} мин.`,
        );
        return true;
      }
    }

    return false;
  } catch (e) {
    console.error("Ошибка проверки истории сделок по аккаунту:", e);
    return false;
  }
}
