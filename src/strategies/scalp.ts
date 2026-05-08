// import WebSocket from "ws";
// import { RestClientV5 } from "bybit-api";

// /*
//   SIMPLE ORDERBOOK SCALPER
//   ------------------------
//   Логика:
//   - слушаем стакан BTCUSDT
//   - считаем imbalance
//   - если bid сильно больше ask -> LONG
//   - если ask сильно больше bid -> SHORT
//   - TP/SL фиксированные
//   - только 1 позиция одновременно

//   ЭТО СТАРТОВЫЙ ШАБЛОН.
//   НЕ production-ready.
// */

// // =======================================
// // CONFIG
// // =======================================

// const API_KEY = "YOUR_API_KEY";
// const API_SECRET = "YOUR_API_SECRET";

// const SYMBOL = "BTCUSDT";

// const LEVERAGE = 10;

// const ORDER_QTY = 0.001;

// const IMBALANCE_LONG = 1.8;
// const IMBALANCE_SHORT = 0.55;

// const TP_PERCENT = 0.0015; // 0.15%
// const SL_PERCENT = 0.001; // 0.10%

// const DEPTH_LEVELS = 20;

// const MIN_SPREAD_PERCENT = 0.0002; // 0.02%

// // =======================================
// // CLIENT
// // =======================================

// const client = new RestClientV5({
//   key: API_KEY,
//   secret: API_SECRET,
//   testnet: false,
// });

// // =======================================
// // STATE
// // =======================================

// let orderbook: {
//   bids: [number, number][];
//   asks: [number, number][];
// } = {
//   bids: [],
//   asks: [],
// };

// let inPosition = false;

// // =======================================
// // HELPERS
// // =======================================

// function sumVolume(levels: [number, number][]) {
//   return levels.reduce((sum, level) => sum + level[1], 0);
// }

// function getSpreadPercent(bestBid: number, bestAsk: number) {
//   return (bestAsk - bestBid) / bestBid;
// }

// function calculateImbalance() {
//   const bidVolume = sumVolume(orderbook.bids);
//   const askVolume = sumVolume(orderbook.asks);

//   if (askVolume === 0) return 1;

//   return bidVolume / askVolume;
// }

// async function setLeverage() {
//   try {
//     await client.setLeverage({
//       category: "linear",
//       symbol: SYMBOL,
//       buyLeverage: LEVERAGE.toString(),
//       sellLeverage: LEVERAGE.toString(),
//     });

//     console.log("Leverage set:", LEVERAGE);
//   } catch (e) {
//     console.log("Leverage already set");
//   }
// }

// async function openLong(price: number) {
//   try {
//     inPosition = true;

//     const takeProfit = price * (1 + TP_PERCENT);
//     const stopLoss = price * (1 - SL_PERCENT);

//     console.log("OPEN LONG");
//     console.log("ENTRY:", price);

//     const response = await client.submitOrder({
//       category: "linear",
//       symbol: SYMBOL,

//       side: "Buy",
//       orderType: "Market",

//       qty: ORDER_QTY.toString(),

//       takeProfit: takeProfit.toFixed(2),
//       stopLoss: stopLoss.toFixed(2),

//       timeInForce: "GTC",
//     });

//     console.log(response);

//     setTimeout(() => {
//       inPosition = false;
//     }, 30000);
//   } catch (error) {
//     inPosition = false;
//     console.error(error);
//   }
// }

// async function openShort(price: number) {
//   try {
//     inPosition = true;

//     const takeProfit = price * (1 - TP_PERCENT);
//     const stopLoss = price * (1 + SL_PERCENT);

//     console.log("OPEN SHORT");
//     console.log("ENTRY:", price);

//     const response = await client.submitOrder({
//       category: "linear",
//       symbol: SYMBOL,

//       side: "Sell",
//       orderType: "Market",

//       qty: ORDER_QTY.toString(),

//       takeProfit: takeProfit.toFixed(2),
//       stopLoss: stopLoss.toFixed(2),

//       timeInForce: "GTC",
//     });

//     console.log(response);

//     setTimeout(() => {
//       inPosition = false;
//     }, 30000);
//   } catch (error) {
//     inPosition = false;
//     console.error(error);
//   }
// }

// // =======================================
// // SIGNAL ENGINE
// // =======================================

// async function processSignal() {
//   if (inPosition) return;

//   if (!orderbook.bids.length || !orderbook.asks.length) return;

//   const bestBid = orderbook.bids[0][0];
//   const bestAsk = orderbook.asks[0][0];

//   const spread = getSpreadPercent(bestBid, bestAsk);

//   if (spread > MIN_SPREAD_PERCENT) {
//     return;
//   }

//   const imbalance = calculateImbalance();

//   console.log({
//     imbalance,
//     spread,
//     bestBid,
//     bestAsk,
//   });

//   // LONG
//   if (imbalance >= IMBALANCE_LONG) {
//     await openLong(bestAsk);
//     return;
//   }

//   // SHORT
//   if (imbalance <= IMBALANCE_SHORT) {
//     await openShort(bestBid);
//     return;
//   }
// }

// // =======================================
// // WEBSOCKET
// // =======================================

// const ws = new WebSocket("wss://stream.bybit.com/v5/public/linear");

// ws.on("open", async () => {
//   console.log("WS CONNECTED");

//   await setLeverage();

//   ws.send(
//     JSON.stringify({
//       op: "subscribe",
//       args: [`orderbook.50.${SYMBOL}`],
//     }),
//   );
// });

// ws.on("message", async (data) => {
//   try {
//     const message = JSON.parse(data.toString());

//     if (!message.topic) return;

//     if (!message.topic.includes("orderbook")) return;

//     const book = message.data;

//     if (!book?.b || !book?.a) return;

//     orderbook.bids = book.b
//       .slice(0, DEPTH_LEVELS)
//       .map((x: string[]) => [Number(x[0]), Number(x[1])]);

//     orderbook.asks = book.a
//       .slice(0, DEPTH_LEVELS)
//       .map((x: string[]) => [Number(x[0]), Number(x[1])]);

//     await processSignal();
//   } catch (error) {
//     console.error(error);
//   }
// });

// ws.on("error", (error) => {
//   console.error("WS ERROR:", error);
// });

// ws.on("close", () => {
//   console.log("WS CLOSED");
// });
