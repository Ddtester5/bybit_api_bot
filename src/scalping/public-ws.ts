import { handleOrderbookMessage } from "./handle-orderbook-message";
import { config } from "./scalp_config";
import { publicWs } from "./ws";

export function setupPublicWs() {
  publicWs.on("open", () => {
    if (!config.symbols || config.symbols.length === 0) {
      console.error("[WS WARN] No symbols defined in config.");
      return;
    }

    const args = config.symbols.map((symbol) => `orderbook.${config.depth}.${symbol}`);

    publicWs.send(
      JSON.stringify({
        op: "subscribe",
        args: args,
      }),
    );
    console.log(`[WS] Subscribed to ${config.symbols.length} pairs.`);
  });

  publicWs.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      if (msg.op || msg.success) return;

      handleOrderbookMessage(msg);
    } catch (error) {
      console.error("[WS PARSE ERROR] Error parsing raw public message:", error);
    }
  });
}
