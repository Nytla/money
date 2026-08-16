"use server";

import { revalidatePath } from "next/cache";
import type { EntryKind } from "@/generated/prisma/enums";
import { requireUser } from "@/lib/auth";
import { parseCalendarDay } from "@/lib/date";
import { parseAmount } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { emptyTransactionForm, type TransactionFormState } from "./transaction-form-state";

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function addTransaction(
  _prevState: TransactionFormState,
  formData: FormData,
): Promise<TransactionFormState> {
  await requireUser();

  const kind = text(formData, "kind") as EntryKind;
  const values = {
    amount: text(formData, "amount"),
    date: text(formData, "date"),
    categoryId: text(formData, "categoryId"),
    note: text(formData, "note"),
  };

  const fieldErrors: TransactionFormState["fieldErrors"] = {};

  const amountMinor = parseAmount(values.amount);
  if (amountMinor === null) {
    fieldErrors.amount = "Введите сумму больше нуля, например 1 234,56";
  }

  const date = parseCalendarDay(values.date);
  if (date === null) {
    fieldErrors.date = "Введите дату в формате дд.мм.гггг";
  }

  const category = values.categoryId
    ? await prisma.category.findUnique({ where: { id: values.categoryId } })
    : null;

  if (!category) {
    fieldErrors.categoryId = "Выберите категорию";
  } else if (category.kind !== kind) {
    // Тип категории не совпал с типом операции: расходную категорию нельзя
    // прицепить к доходу, иначе итоги разъедутся.
    fieldErrors.categoryId = "Категория не подходит для этой операции";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors, formError: null, values, ok: false };
  }

  try {
    await prisma.transaction.create({
      data: {
        kind,
        amountMinor: amountMinor!,
        date: date!,
        categoryId: values.categoryId,
        note: values.note.trim() || null,
      },
    });
  } catch {
    return {
      fieldErrors: {},
      formError: "Не удалось сохранить операцию. Попробуйте ещё раз.",
      values,
      ok: false,
    };
  }

  revalidatePath("/");

  return { ...emptyTransactionForm, ok: true };
}
