/**
 * Состояние формы смены пароля. Отдельно от серверных действий: из модуля
 * с `"use server"` можно экспортировать только асинхронные функции.
 */

export type ChangePasswordState = {
  fieldErrors: Partial<Record<"currentPassword" | "newPassword", string>>;
  ok: boolean;
};

export const emptyChangePasswordState: ChangePasswordState = { fieldErrors: {}, ok: false };
