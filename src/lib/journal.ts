import type { EntryKind } from "@/generated/prisma/enums";

/**
 * Построение таблицы журнала: сортировка, нарастающий остаток, итоги.
 * Чистая функция без БД — считается и проверяется отдельно от способа получения данных.
 */

export type JournalEntry = {
  id: string;
  date: Date;
  kind: EntryKind;
  amountMinor: number;
  categoryName: string;
  createdAt: Date;
};

export type JournalRow = JournalEntry & {
  /** Остаток нарастающим итогом от начала периода, включая эту строку. */
  balanceMinor: number;
};

export type JournalTotals = {
  incomeMinor: number;
  expenseMinor: number;
  balanceMinor: number;
};

export type Journal = {
  rows: JournalRow[];
  totals: JournalTotals;
};

/**
 * Сортировка по дате, при равной дате — по времени создания: в один день может быть
 * несколько операций, и порядок остатков должен быть предсказуемым.
 */
function byDateThenCreation(a: JournalEntry, b: JournalEntry): number {
  return a.date.getTime() - b.date.getTime() || a.createdAt.getTime() - b.createdAt.getTime();
}

export function buildJournal(entries: JournalEntry[], openingBalanceMinor = 0): Journal {
  const sorted = [...entries].sort(byDateThenCreation);

  let balance = openingBalanceMinor;
  let income = 0;
  let expense = 0;

  const rows = sorted.map((entry) => {
    if (entry.kind === "INCOME") {
      income += entry.amountMinor;
      balance += entry.amountMinor;
    } else {
      expense += entry.amountMinor;
      balance -= entry.amountMinor;
    }

    return { ...entry, balanceMinor: balance };
  });

  return {
    rows,
    totals: { incomeMinor: income, expenseMinor: expense, balanceMinor: balance },
  };
}
