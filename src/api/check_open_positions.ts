import { RestClientV5 } from "bybit-api";

export const checkOpenPositionsCount = async ({
  client,
}: {
  client: RestClientV5;
}) => {
  const positionsCount = await client.getPositionInfo({
    category: "linear",
    settleCoin: "USDT",
    limit: 1000,
  });
  return positionsCount.result.list.length;
};
