import { client } from "./bybit";
import { getAvailableBalanceUsdt, getInstrumentQtyDecimals } from "./helpers";
import { config } from "./scalp_config";
import { getTradingState } from "./state";
import { Side } from "./types";

function formatPrice(price: number, symbol: string): string {
  const decimals = symbol.endsWith("USDT") && price < 1 ? 5 : 4;
  return price.toFixed(decimals);
}

export async function openPosition(symbol: string, side: Side, price: number): Promise<boolean> {
  const tradingState = getTradingState(symbol);

  if (tradingState.inStartOrder || tradingState.inPosition || tradingState.isOpeningPosition) {
    return false;
  }

  tradingState.isOpeningPosition = true;

  try {
    // 1. Динамический расчет объема (Qty) на основе баланса
    const balance = await getAvailableBalanceUsdt();
    if (balance <= 0) {
      throw new Error("Available balance is 0 or less. Cannot trade.");
    }

    const openPrice = side === "Buy" ? price * (1 + config.wallEntryBuffer) : price * (1 - config.wallEntryBuffer);

    // Считаем размер позиции в USDT, который мы хотим открыть (Баланс * Риск * Плечо)
    const positionSizeUsdt = balance * config.riskPercent * config.leverage;

    // Переводим объем из USDT в количество монет (Количество = Объем в USDT / Цена входа)
    const rawQty = positionSizeUsdt / openPrice;

    // Получаем шаг округления количества для этой конкретной монеты с Bybit
    const qtyDecimals = await getInstrumentQtyDecimals(symbol);
    const finalQty = Number(rawQty.toFixed(qtyDecimals));

    if (finalQty <= 0) {
      throw new Error(`Calculated qty (${rawQty}) after rounding (${finalQty}) is too small for this instrument.`);
    }

    console.log(
      `[BALANCE DYNAMIC] Wallet Free Margin: ${balance.toFixed(2)} USDT. Calculated Qty for ${symbol}: ${finalQty} (Using risk: ${config.riskPercent * 100}%, Leverage: x${config.leverage})`,
    );
    console.log(`[ORDER] Submitting ${side} limit order for ${symbol} at ${openPrice}`);

    const response = await client.submitOrder({
      category: "linear",
      symbol,
      side,
      orderType: "Limit",
      price: formatPrice(openPrice, symbol),
      qty: finalQty.toString(), // Отправляем динамически рассчитанный объем
      timeInForce: "GTC",
    });

    if (response?.retCode === 0 && response?.result?.orderId) {
      // Сохраняем объем ордера в состояние, чтобы TP/SL выставились ровно на это же количество монет
      tradingState.currentOrderQty = finalQty;

      tradingState.inStartOrder = true;
      tradingState.entryOrderId = response.result.orderId;
      tradingState.createdAt = Date.now();
      console.log(`[ORDER SUCCESS] Created order ID: ${response.result.orderId} for ${symbol}`);
      return true;
    } else {
      throw new Error(`Bybit rejected order: ${response?.retMsg} (Code: ${response?.retCode})`);
    }
  } catch (e) {
    console.error(`[ORDER ERROR] Failed to open ${side} position on ${symbol}:`, e);
    tradingState.inStartOrder = false;
    tradingState.entryOrderId = null;
    tradingState.createdAt = null;
    tradingState.currentOrderQty = null;
    return false;
  } finally {
    tradingState.isOpeningPosition = false;
  }
}
