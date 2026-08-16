/**
 * Тип и начальное состояние формы операции.
 *
 * Живёт отдельно от `actions.ts`: из модуля с директивой `"use server"` можно
 * экспортировать только асинхронные функции, и объект оттуда приезжает на клиент
 * как undefined.
 */

export type TransactionFormState = {
  /** Ошибки по полям; пустой объект — успех. */
  fieldErrors: Partial<Record<"amount" | "date" | "categoryId", string>>;
  /** Общая ошибка сохранения, отличная от ошибок проверки. */
  formError: string | null;
  /** Введённые значения возвращаются обратно, чтобы форма не обнулялась при ошибке. */
  values: { amount: string; date: string; categoryId: string; note: string };
  ok: boolean;
};

export const emptyTransactionForm: TransactionFormState = {
  fieldErrors: {},
  formError: null,
  values: { amount: "", date: "", categoryId: "", note: "" },
  ok: false,
};
