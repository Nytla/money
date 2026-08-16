"use client";

import { useActionState, useEffect, useRef } from "react";
import type { EntryKind } from "@/generated/prisma/enums";
import { addTransaction } from "./actions";
import { emptyTransactionForm } from "./transaction-form-state";

type Category = { id: string; name: string; kind: EntryKind };

const TITLES: Record<EntryKind, string> = {
  INCOME: "Добавить доход",
  EXPENSE: "Добавить расход",
};

export function TransactionDialog({
  kind,
  categories,
  today,
}: {
  kind: EntryKind;
  categories: Category[];
  today: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction, pending] = useActionState(addTransaction, emptyTransactionForm);

  // Нативный <dialog> сам удерживает фокус и закрывается по Esc — это дешевле
  // и надёжнее, чем воспроизводить ловушку фокуса руками. Открытость держит сам
  // элемент, отдельного состояния нет: иначе пришлось бы синхронизировать два источника.
  useEffect(() => {
    if (state.ok) dialogRef.current?.close();
  }, [state.ok]);

  const available = categories.filter((category) => category.kind === kind);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="rounded-md border border-black/20 px-3 py-2 text-sm font-medium focus-visible:ring-2 focus-visible:ring-current dark:border-white/25"
      >
        {TITLES[kind]}
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={`dialog-title-${kind}`}
        className="m-auto w-full max-w-md rounded-lg bg-background p-6 text-foreground backdrop:bg-black/50"
      >
        <h2 id={`dialog-title-${kind}`} className="mb-4 text-lg font-semibold">
          {TITLES[kind]}
        </h2>

        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="kind" value={kind} />

          <Field id="amount" label="Сумма" error={state.fieldErrors.amount}>
            <input
              id="amount"
              name="amount"
              inputMode="decimal"
              required
              defaultValue={state.values.amount}
              placeholder="1 234,56"
              aria-invalid={state.fieldErrors.amount ? true : undefined}
              aria-describedby={state.fieldErrors.amount ? "amount-error" : undefined}
              className="rounded-md border border-black/20 bg-transparent px-3 py-2 dark:border-white/25"
            />
          </Field>

          <Field id="date" label="Дата" error={state.fieldErrors.date}>
            <input
              id="date"
              name="date"
              required
              defaultValue={state.values.date || today}
              placeholder="дд.мм.гггг"
              aria-invalid={state.fieldErrors.date ? true : undefined}
              aria-describedby={state.fieldErrors.date ? "date-error" : undefined}
              className="rounded-md border border-black/20 bg-transparent px-3 py-2 dark:border-white/25"
            />
          </Field>

          <Field id="categoryId" label="Категория" error={state.fieldErrors.categoryId}>
            <select
              id="categoryId"
              name="categoryId"
              required
              defaultValue={state.values.categoryId}
              aria-invalid={state.fieldErrors.categoryId ? true : undefined}
              aria-describedby={state.fieldErrors.categoryId ? "categoryId-error" : undefined}
              className="rounded-md border border-black/20 bg-transparent px-3 py-2 dark:border-white/25"
            >
              <option value="">Выберите категорию</option>
              {available.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>

          <Field id="note" label="Заметка">
            <input
              id="note"
              name="note"
              defaultValue={state.values.note}
              className="rounded-md border border-black/20 bg-transparent px-3 py-2 dark:border-white/25"
            />
          </Field>

          {state.formError ? (
            <p role="alert" className="text-sm text-red-700 dark:text-red-400">
              {state.formError}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded-md border border-black/20 px-3 py-2 text-sm dark:border-white/25"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background disabled:opacity-60"
            >
              {pending ? "Сохраняем…" : "Сохранить"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
