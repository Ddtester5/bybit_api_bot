// Получаем доступные средства (баланс)

import { RestClientV5 } from "bybit-api";

export const getAvalibleBalance = async ({
  client,
}: {
  client: RestClientV5;
}) => {
  const accountInfo = await client.getWalletBalance({
    accountType: "UNIFIED",
  });
  const availableBalance = parseFloat(
    accountInfo.result.list[0].totalWalletBalance,
  );
  console.log(`Доступные средства: ${availableBalance}`);
  return availableBalance;
};
