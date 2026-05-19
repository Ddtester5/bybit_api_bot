import { client } from "./bybit";

/**
 * Получает доступный баланс (свободную маржу) в USDT на Едином Торговом Аккаунте (UTA).
 */
export async function getAvailableBalanceUsdt(): Promise<number> {
  try {
    const response = await client.getWalletBalance({
      accountType: "UNIFIED",
      coin: "USDT",
    });

    if (response?.retCode === 0 && response.result?.list?.[0]?.coin?.[0]) {
      const coinData = response.result.list[0].coin[0];
      // Используем доступный баланс для маржи (свободные средства)
      return Number(coinData.availableToWithdraw || coinData.walletBalance || 0);
    }
    throw new Error(`Failed to read balance: ${response?.retMsg}`);
  } catch (error) {
    console.error("[BALANCE ERROR] Could not fetch account balance:", error);
    return 0; // Возвращаем 0, чтобы бот не зашел на случайный объем при ошибке сети
  }
}

/**
 * Получает правила монеты (шаг округления количества qty и цены) с биржи Bybit.
 */
export async function getInstrumentQtyDecimals(symbol: string): Promise<number> {
  try {
    const response = await client.getInstrumentsInfo({
      category: "linear",
      symbol: symbol,
    });

    if (response?.retCode === 0 && response.result?.list?.[0]) {
      const info = response.result.list[0];
      const qtyStep = Number(info.lotSizeFilter?.qtyStep || "1");

      // Считаем количество знаков после запятой для объема
      if (qtyStep.toString().includes(".")) {
        return qtyStep.toString().split(".")[1].length;
      }
      return 0;
    }
    return 0; // Дефолтное значение (целые числа), если запрос не удался
  } catch (error) {
    console.error(`[INFO ERROR] Could not fetch dynamic info for ${symbol}:`, error);
    return 0;
  }
}
