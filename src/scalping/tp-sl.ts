import { client } from "./bybit";
import { config } from "./scalp_config";
import { getTradingState } from "./state";
import { Side } from "./types";

function formatPrice(price: number, symbol: string): string {
  const decimals = symbol.endsWith("USDT") && price < 1 ? 5 : 4;
  return price.toFixed(decimals);
}

export async function placeTpSl(symbol: string, side: Side, entryPrice: number): Promise<boolean> {
  const tradingState = getTradingState(symbol);

  // Извлекаем динамический объем, на который была открыта позиция
  const currentQty = tradingState.currentOrderQty;

  if (!currentQty) {
    console.error(`[RISK CRITICAL] No saved dynamic quantity found for ${symbol} in state container!`);
    return false;
  }

  try {
    console.log(`[RISK] Placing TP/SL bracket for ${symbol} at entry price ${entryPrice} with Qty ${currentQty}`);
    const isLong = side === "Buy";
    const closeSide = isLong ? "Sell" : "Buy";

    const tpPrice = isLong ? entryPrice * (1 + config.takeProfitPercent) : entryPrice * (1 - config.takeProfitPercent);
    const slPrice = isLong ? entryPrice * (1 - config.stopLossPercent) : entryPrice * (1 + config.stopLossPercent);

    // 1. Выставляем Take Profit (Limit) с динамическим объемом
    const tpResponse = await client.submitOrder({
      category: "linear",
      symbol,
      side: closeSide,
      orderType: "Limit",
      qty: currentQty.toString(), // <-- Используем сохраненное количество
      price: formatPrice(tpPrice, symbol),
      reduceOnly: true,
      timeInForce: "GTC",
    });

    if (tpResponse?.retCode !== 0 || !tpResponse?.result?.orderId) {
      throw new Error(`TP Order Rejected: ${tpResponse?.retMsg}`);
    }
    tradingState.takeProfitOrderId = tpResponse.result.orderId;

    // 2. Выставляем Stop Loss (Conditional Market) с динамическим объемом
    const slResponse = await client.submitOrder({
      category: "linear",
      symbol,
      side: closeSide,
      orderType: "Market",
      triggerPrice: formatPrice(slPrice, symbol),
      triggerDirection: isLong ? 2 : 1,
      triggerBy: "LastPrice",
      qty: currentQty.toString(), // <-- Используем сохраненное количество
      reduceOnly: true,
    });

    if (slResponse?.retCode !== 0 || !slResponse?.result?.orderId) {
      throw new Error(`SL Order Rejected: ${slResponse?.retMsg}`);
    }
    tradingState.stopLossOrderId = slResponse.result.orderId;

    console.log(
      `[RISK SUCCESS] Bracket applied for ${symbol}. TP: ${tradingState.takeProfitOrderId}, SL: ${tradingState.stopLossOrderId}`,
    );
    return true;
  } catch (error) {
    console.error(`[RISK CRITICAL ERROR] Failed to place TP/SL bracket for ${symbol}:`, error);
    return false;
  }
}
