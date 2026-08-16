import { describe, expect, it } from "vitest";
import { calendarDay } from "./date";
import { buildJournal, type JournalEntry } from "./journal";

function entry(overrides: Partial<JournalEntry> & Pick<JournalEntry, "id">): JournalEntry {
  return {
    date: calendarDay(2026, 8, 1),
    kind: "EXPENSE",
    amountMinor: 100_00,
    categoryName: "Покупки",
    createdAt: new Date("2026-08-01T10:00:00.000Z"),
    ...overrides,
  };
}

/** Набор Д1 из тест-плана: доход 90 000 и три расхода. */
const Д1: JournalEntry[] = [
  entry({
    id: "1",
    date: calendarDay(2026, 8, 1),
    kind: "INCOME",
    amountMinor: 90_000_00,
    categoryName: "Зарплата",
  }),
  entry({
    id: "2",
    date: calendarDay(2026, 8, 3),
    amountMinor: 4_500_00,
    categoryName: "Комуналка",
  }),
  entry({ id: "3", date: calendarDay(2026, 8, 5), amountMinor: 12_000_00 }),
  entry({
    id: "4",
    date: calendarDay(2026, 8, 10),
    amountMinor: 9_000_00,
    categoryName: "Десятина",
  }),
];

describe("buildJournal", () => {
  it("ТК-030: считает нарастающий остаток", () => {
    const { rows } = buildJournal(Д1);

    expect(rows.map((row) => row.balanceMinor)).toEqual([
      90_000_00, 85_500_00, 73_500_00, 64_500_00,
    ]);
  });

  it("ТК-033: считает итоги периода", () => {
    expect(buildJournal(Д1).totals).toEqual({
      incomeMinor: 90_000_00,
      expenseMinor: 25_500_00,
      balanceMinor: 64_500_00,
    });
  });

  it("сортирует по дате независимо от порядка на входе", () => {
    const shuffled = [Д1[3], Д1[0], Д1[2], Д1[1]];

    expect(buildJournal(shuffled).rows.map((row) => row.id)).toEqual(["1", "2", "3", "4"]);
  });

  it("ТК-032: при равной дате упорядочивает по времени создания", () => {
    const rows = buildJournal([
      entry({
        id: "поздняя",
        date: calendarDay(2026, 8, 5),
        kind: "INCOME",
        amountMinor: 1_000_00,
        createdAt: new Date("2026-08-05T12:00:00.000Z"),
      }),
      entry({
        id: "ранняя",
        date: calendarDay(2026, 8, 5),
        amountMinor: 12_000_00,
        createdAt: new Date("2026-08-05T09:00:00.000Z"),
      }),
    ]).rows;

    expect(rows.map((row) => row.id)).toEqual(["ранняя", "поздняя"]);
  });

  it("ТК-031: не накапливает ошибку округления на копеечных расходах", () => {
    const income = entry({ id: "доход", kind: "INCOME", amountMinor: 1_00 });
    const kopecks = Array.from({ length: 100 }, (_, index) =>
      entry({
        id: `к${index}`,
        amountMinor: 1,
        createdAt: new Date(Date.UTC(2026, 7, 1, 11, 0, index)),
      }),
    );

    expect(buildJournal([income, ...kopecks]).totals.balanceMinor).toBe(0);
  });

  it("пустой период даёт нулевые итоги, а не отсутствие итогов", () => {
    expect(buildJournal([]).totals).toEqual({
      incomeMinor: 0,
      expenseMinor: 0,
      balanceMinor: 0,
    });
  });

  it("учитывает перенесённый остаток как начальный, не трогая итоги доходов", () => {
    const { rows, totals } = buildJournal(Д1, 12_000_00);

    expect(rows[0].balanceMinor).toBe(102_000_00);
    expect(totals.incomeMinor).toBe(90_000_00);
    expect(totals.balanceMinor).toBe(76_500_00);
  });
});
