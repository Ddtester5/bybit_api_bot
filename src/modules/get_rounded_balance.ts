export function getRoundedBalance(n: number): number {
  if (n < 0) {
    throw new Error("Function works only for positive numbers");
  }

  // Шаг 1: Округляем дробное число ВВЕРХ до целого
  const integer = Math.ceil(n);

  // Для чисел меньше 10 возвращаем как есть
  if (integer < 10) {
    return integer;
  }

  // Определяем количество цифр
  const digitCount = Math.floor(Math.log10(integer)) + 1;
  // Вычисляем базовый множитель (10 в степени (количество_цифр - 1))
  const base = Math.pow(10, digitCount - 1);
  // Получаем первую цифру
  const firstDigit = Math.floor(integer / base);

  return firstDigit * base;
}
