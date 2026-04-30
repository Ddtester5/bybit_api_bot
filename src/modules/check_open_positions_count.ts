import { client } from "../api/bybit_api_client_v5";

export const checkOpenPositionsCount = async () => {
  const positionsCount = await client.getPositionInfo({
    category: "linear",
    settleCoin: "USDT",
    limit: 1000,
  });
  console.log(
    "now opened positions count: ",
    positionsCount.result.list.length,
  );
  return positionsCount.result.list.length;
};
