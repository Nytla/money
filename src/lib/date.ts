/**
 * Работа с датами операций. Единственная точка разбора и форматирования.
 *
 * Дата операции — календарный день, время всегда 00:00 UTC. Локальное время
 * не хранится: операция, введённая 1 августа в 02:00 по UTC+3, при наивном
 * `new Date()` уехала бы в июль и попала в отчёт не того месяца.
 */

const MONTHS_NOMINATIVE = [
  "январь",
  "февраль",
  "март",
  "апрель",
  "май",
  "июнь",
  "июль",
  "август",
  "сентябрь",
  "октябрь",
  "ноябрь",
  "декабрь",
] as const;

/** Календарный день как Date в 00:00 UTC. Месяц — от 1, как у человека. */
export function calendarDay(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Разбирает «дд.мм.гггг» в календарный день. Возвращает null, если строка
 * не дата или дата не существует (31.02.2026, 00.01.2026).
 */
export function parseCalendarDay(input: string): Date | null {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(input.trim());
  if (!match) return null;

  const [, dayText, monthText, yearText] = match;
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);

  const date = calendarDay(year, month, day);

  // Date.UTC сам «исправляет» 31.02 в 03.03 — сверяем, что день не переехал.
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

/** Приводит произвольный Date к календарному дню, отбрасывая время. */
export function toCalendarDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/**
 * Сегодняшний календарный день по локальному календарю пользователя.
 * Компоненты берутся локальные и переносятся в UTC: в 02:00 первого числа
 * пользователь считает, что сегодня первое, а не вчерашнее последнее.
 */
export function todayCalendarDay(now: Date = new Date()): Date {
  return calendarDay(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/** «01.08.2026» — формат столбца «Дата». */
export function formatDate(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${day}.${month}.${date.getUTCFullYear()}`;
}

/** «август 2026» — формат столбца «Месяц, год». */
export function formatMonthYear(date: Date): string {
  return `${MONTHS_NOMINATIVE[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}
