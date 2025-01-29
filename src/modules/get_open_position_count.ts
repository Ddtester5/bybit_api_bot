import { client } from "../api/bybit_api_client_v5";

export async function getOpenPositionsCount() {
  try {
    const response = await client.getPositionInfo({
      category: "linear", // Для USDT-пар, для инверсных — "inverse"
    });

    if (!response.result || !response.result.list) {
      console.log("Нет открытых позиций.");
      return 0;
    }

    const openPositions = response.result.list.filter(
      (position) => parseFloat(position.size) > 0, // Фильтруем только активные позиции
    );

    console.log(`🔹 Количество открытых позиций: ${openPositions.length}`);

    return openPositions.length;
  } catch (error) {
    console.error("❌ Ошибка при получении открытых позиций:", error);
    throw error;
  }
}

// Вызываем функцию
getOpenPositionsCount();
