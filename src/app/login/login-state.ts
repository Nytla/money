/**
 * Состояние формы входа. Отдельно от `actions.ts`: из модуля с `"use server"`
 * можно экспортировать только асинхронные функции.
 */

export type LoginState = { error: string | null };

export const emptyLoginState: LoginState = { error: null };
