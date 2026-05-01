import { client } from "../api/bybit_api_client_v5";

// Функция для проверки открытых позиций
export const checkOpenPositions = async (tradingPair: string) => {
  try {
    const positionInfo = await client.getPositionInfo({
      category: "linear",
      symbol: tradingPair,
    });

    if (
      positionInfo?.result?.list &&
      positionInfo.result.list.length > 0 &&
      parseFloat(positionInfo.result.list[0].size) > 0
    ) {
      console.log("Уже есть открытая позиция по", tradingPair);
      return true; // Есть открытая сделка
    }

    return false; // Сделок нет
  } catch (error) {
    console.error("Ошибка при проверке позиций:", error);
    return false;
  }
};
