"use server";

import { redirect } from "next/navigation";
import { getAccount, startSession } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";

export type LoginState = { error: string | null };

/**
 * Сообщение об ошибке одно на все случаи: и когда пароль неверен, и когда учётной
 * записи нет вовсе. Разные тексты подсказали бы подбирающему, что именно не сошлось.
 */
const GENERIC_ERROR = "Неверный пароль";

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const password = formData.get("password");

  if (typeof password !== "string" || password === "") {
    return { error: GENERIC_ERROR };
  }

  const account = await getAccount();
  if (!account) return { error: GENERIC_ERROR };

  const matches = await verifyPassword(password, account.passwordHash);
  if (!matches) return { error: GENERIC_ERROR };

  await startSession(account.id, account.sessionVersion);

  redirect("/");
}
