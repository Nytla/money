"use server";

import { redirect } from "next/navigation";
import { getAccount, startSession } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { formatRetryAfter } from "@/lib/rate-limit";
import { loginThrottle } from "@/lib/throttle-instance";
import type { LoginState } from "./login-state";

/**
 * Сообщение об ошибке одно на все случаи: и когда пароль неверен, и когда учётной
 * записи нет вовсе. Разные тексты подсказали бы подбирающему, что именно не сошлось.
 */
const GENERIC_ERROR = "Неверный пароль";

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  // Ограничитель проверяется до сверки пароля: блокировка сильнее верного пароля,
  // иначе подбор продолжался бы до первого угадывания.
  const decision = loginThrottle.check();
  if (!decision.allowed) {
    return {
      error: `Слишком много неудачных попыток. Повторите через ${formatRetryAfter(decision.retryAfterMs)}`,
    };
  }

  const password = formData.get("password");
  const account = typeof password === "string" && password !== "" ? await getAccount() : null;

  const matches =
    account && typeof password === "string"
      ? await verifyPassword(password, account.passwordHash)
      : false;

  if (!account || !matches) {
    loginThrottle.recordFailure();
    return { error: GENERIC_ERROR };
  }

  loginThrottle.recordSuccess();
  await startSession(account.id, account.sessionVersion);

  redirect("/");
}
