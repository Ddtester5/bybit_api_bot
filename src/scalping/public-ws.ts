import { handleOrderbookMessage } from "./handle-orderbook-message";
import { config } from "./scalp_config";
import { publicWs } from "./ws";

export function setupPublicWs() {
  publicWs.on("open", () => {
    publicWs.send(
      JSON.stringify({
        op: "subscribe",

        args: config.symbols.map((symbol) => `orderbook.${config.depth}.${symbol}`),
      }),
    );
  });

  publicWs.on("message", async (raw) => {
    try {
      const text = raw.toString();
      const msg = JSON.parse(text);
      await handleOrderbookMessage(msg);
    } catch (error) {
      console.error("Error handling public WS message:", error);
    }
  });
}
