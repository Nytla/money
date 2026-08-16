import bcrypt from "bcryptjs";
import { parseCalendarDay } from "@/lib/date";
import { parseAmount } from "@/lib/money";
import { testPrisma } from "./client";

/**
 * Фабрики тестовых данных. Каждая возвращает созданную запись, чтобы тест
 * не запрашивал её повторно.
 *
 * Суммы принимаются в человеческом виде («90 000,00») и разбираются тем же кодом,
 * что и пользовательский ввод; даты — как «дд.мм.гггг».
 */

/** Пароль по умолчанию для фикстур. Совпадает с базовыми фикстурами тест-плана. */
export const DEFAULT_PASSWORD = "correct-horse";

function requireAmount(amount: string): number {
  const minor = parseAmount(amount);
  if (minor === null) throw new Error(`Фикстура получила некорректную сумму: ${amount}`);
  return minor;
}

function requireDate(date: string): Date {
  const parsed = parseCalendarDay(date);
  if (parsed === null) throw new Error(`Фикстура получила некорректную дату: ${date}`);
  return parsed;
}

export async function makeUser(
  overrides: {
    password?: string;
    currency?: string;
    tithePercent?: number;
    carryOverBalance?: boolean;
  } = {},
) {
  const { password = DEFAULT_PASSWORD, ...rest } = overrides;

  return testPrisma.user.create({
    data: {
      // Стоимость хеширования снижена: в тестах она даёт секунды на пустом месте.
      passwordHash: await bcrypt.hash(password, 4),
      ...rest,
    },
  });
}

export async function makeCategory(
  overrides: {
    name?: string;
    kind?: "INCOME" | "EXPENSE";
    iconKey?: string | null;
    color?: string;
    isSystem?: boolean;
    sortOrder?: number;
  } = {},
) {
  const { name = "Тестовая категория", kind = "EXPENSE", ...rest } = overrides;

  return testPrisma.category.create({ data: { name, kind, ...rest } });
}

export async function makeTransaction(
  overrides: {
    amount?: string;
    date?: string;
    kind?: "INCOME" | "EXPENSE";
    categoryId?: string;
    note?: string | null;
  } = {},
) {
  const {
    amount = "1 000,00",
    date = "01.08.2026",
    kind = "EXPENSE",
    categoryId,
    note,
  } = overrides;

  const resolvedCategoryId = categoryId ?? (await makeCategory({ kind })).id;

  return testPrisma.transaction.create({
    data: {
      amountMinor: requireAmount(amount),
      date: requireDate(date),
      kind,
      categoryId: resolvedCategoryId,
      note,
    },
  });
}
