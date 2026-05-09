import { RestClientV5 } from "bybit-api";
import {
  ORDER_QTY,
  STOP_LOSS_BUFFER,
  SYMBOL,
  TAKE_PROFIT_PERCENT,
} from "../config";

export async function openLong(
  entry: number,
  wall: number,
  client: RestClientV5,
) {
  try {
    const tp = entry * (1 + TAKE_PROFIT_PERCENT);

    // stop behind wall
    const sl = wall * (1 - STOP_LOSS_BUFFER);

    console.log("OPEN LONG");
    console.log({
      entry,
      tp,
      sl,
      wall,
    });

    const res = await client.submitOrder({
      category: "linear",

      symbol: SYMBOL,

      side: "Buy",
      orderType: "Market",

      qty: ORDER_QTY.toString(),

      takeProfit: tp.toFixed(2),
      stopLoss: sl.toFixed(2),

      timeInForce: "GTC",
    });

    console.log(res);
  } catch (e) {
    console.error(e);
  }
}

export async function openShort(
  entry: number,
  wall: number,
  client: RestClientV5,
) {
  try {
    const tp = entry * (1 - TAKE_PROFIT_PERCENT);

    // stop behind wall
    const sl = wall * (1 + STOP_LOSS_BUFFER);

    console.log("OPEN SHORT");
    console.log({
      entry,
      tp,
      sl,
      wall,
    });

    const res = await client.submitOrder({
      category: "linear",

      symbol: SYMBOL,

      side: "Sell",
      orderType: "Market",

      qty: ORDER_QTY.toString(),

      takeProfit: tp.toFixed(2),
      stopLoss: sl.toFixed(2),

      timeInForce: "GTC",
    });

    console.log(res);
  } catch (e) {
    console.error(e);
  }
}
