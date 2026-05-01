// Получаем доступные средства (баланс)

import { client } from "../api/bybit_api_client_v5";

export const getAvalibleBalance = async () => {
  const accountInfo = await client.getWalletBalance({
    accountType: "UNIFIED",
  });
  const availableBalance = parseFloat(
    accountInfo.result.list[0].totalWalletBalance,
  );
  console.log(`Доступные средства: ${availableBalance}`);
  return availableBalance;
};
