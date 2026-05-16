import fs from "fs";
import { config } from "../scalp_config";

const stream = fs.createWriteStream("./scalp_data/orderbook.jsonl", {
  flags: "a",
});

fs.mkdirSync("./scalp_data", { recursive: true });
if (config.clearBacktestDataOnStartup) {
  fs.writeFileSync("./scalp_data/orderbook.jsonl", ""); // Clear file on startup
}
export function recordMessage(raw: string) {
  stream.write(
    JSON.stringify({
      ts: Date.now(),
      data: raw,
    }) + "\n",
  );
}
