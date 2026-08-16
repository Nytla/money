/**
 * Денежная арифметика. Суммы везде — целые минорные единицы (копейки/центы),
 * поэтому сложение и вычитание точные, а округление происходит ровно один раз,
 * при разборе пользовательского ввода.
 */

export type CurrencyCode = "RUB" | "USD" | "EUR" | "UAH" | "KZT" | "GBP";

export const CURRENCIES: { code: CurrencyCode; label: string; symbol: string }[] = [
  { code: "RUB", label: "Российский рубль", symbol: "₽" },
  { code: "USD", label: "Доллар США", symbol: "$" },
  { code: "EUR", label: "Евро", symbol: "€" },
  { code: "UAH", label: "Гривна", symbol: "₴" },
  { code: "KZT", label: "Тенге", symbol: "₸" },
  { code: "GBP", label: "Фунт стерлингов", symbol: "£" },
];

const MINOR_UNITS = 100;

/**
 * Разбирает введённую пользователем сумму в минорные единицы.
 * Принимает «1 234,56», «1234.56», «1 234". Возвращает null, если ввод не сумма.
 */
export function parseAmount(input: string): number | null {
  const normalized = input.replace(/\s| /g, "").replace(",", ".");
  if (normalized === "" || !/^\d+(\.\d{1,2})?$/.test(normalized)) return null;

  const value = Number(normalized);
  if (!Number.isFinite(value)) return null;

  return Math.round(value * MINOR_UNITS);
}

/** Минорные единицы → число для отображения (1234 → 12.34). */
export function toMajor(amountMinor: number): number {
  return amountMinor / MINOR_UNITS;
}

/** Форматирует сумму с символом валюты по локали ru-RU. */
export function formatMoney(
  amountMinor: number,
  currency: CurrencyCode,
  options: { withSymbol?: boolean } = {},
): string {
  const { withSymbol = true } = options;

  return new Intl.NumberFormat("ru-RU", {
    style: withSymbol ? "currency" : "decimal",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toMajor(amountMinor));
}

/** Символ валюты для заголовков колонок таблицы. */
export function currencySymbol(currency: CurrencyCode): string {
  return CURRENCIES.find((c) => c.code === currency)?.symbol ?? currency;
}

/**
 * Десятина за период: сколько причитается с дохода и сколько фактически внесено.
 * Процент выполнения округляется до целого; при нулевом доходе считается выполненной.
 */
export function calculateTithe(
  incomeMinor: number,
  paidMinor: number,
  tithePercent: number,
): { dueMinor: number; paidMinor: number; percent: number } {
  const dueMinor = Math.round((incomeMinor * tithePercent) / 100);
  const percent = dueMinor === 0 ? 100 : Math.round((paidMinor / dueMinor) * 100);

  return { dueMinor, paidMinor, percent };
}
