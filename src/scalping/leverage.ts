import { client } from "./bybit";

export async function setupLeverage(symbol: string, leverage: number) {
  try {
    await client.setLeverage({
      category: "linear",

      symbol,

      buyLeverage: leverage.toString(),

      sellLeverage: leverage.toString(),
    });

    console.log(`${symbol} leverage set to ${leverage}x`);
  } catch (e) {
    console.error(e);
  }
}
