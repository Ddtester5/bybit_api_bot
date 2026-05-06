import { BACKTEST_CANDLE_INTERVAL } from "../config/main_config";
import { client } from "./bybit_api_client_v5";

const PAUSE_CANDLES = 20;

export async function isWaitPeriodActive(symbol: string): Promise<boolean> {
  try {
    const response = await client.getClosedPnL({
      category: "linear",
      symbol: symbol,
      limit: 1, // берем только последнюю сделку
    });

    const lastTrade = response.result.list[0];
    if (!lastTrade) return false;

    // Проверяем, был ли это убыток (стоп-лосс обычно дает отрицательный PNL)
    const isLoss = parseFloat(lastTrade.closedPnl) < 0;

    if (isLoss) {
      const closeTime = parseInt(lastTrade.updatedTime); // Время в мс
      const currentTime = Date.now();
      const diffMinutes = (currentTime - closeTime) / 1000 / 60;

      // Если прошло меньше чем (20 * интервал свечи) минут
      if (diffMinutes < PAUSE_CANDLES * BACKTEST_CANDLE_INTERVAL) {
        const remain = Math.ceil(
          PAUSE_CANDLES * BACKTEST_CANDLE_INTERVAL - diffMinutes,
        );
        console.log(`[${symbol}] Пауза после стопа. Ждать еще ${remain} мин.`);
        return true;
      }
    }
    return false;
  } catch (e) {
    console.error("Ошибка проверки истории сделок:", e);
    return false;
  }
}
