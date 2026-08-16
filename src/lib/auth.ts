import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionSecret, isProduction } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  createSessionToken,
  encodeSecret,
  sessionMatchesUser,
  verifySessionToken,
} from "@/lib/session";

/**
 * Слой доступа к данным сессии. Проверка здесь, рядом с БД, а не только в proxy:
 * proxy видит лишь подпись токена и не знает, не сменился ли с тех пор пароль.
 */

/** Сервис однопользовательский: запись User в базе всегда одна. */
export async function getAccount() {
  return prisma.user.findFirst();
}

/**
 * Возвращает пользователя текущей сессии или null. Токен с устаревшей версией
 * сессии считается недействительным — так смена пароля закрывает старые входы.
 */
export async function getCurrentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const payload = await verifySessionToken(token, encodeSecret(getSessionSecret()));
  if (!payload) return null;

  const user = await prisma.user.findUnique({ where: { id: payload.uid } });
  if (!sessionMatchesUser(payload, user)) return null;

  return user;
}

/** Для страниц, которым пользователь обязателен. Иначе — на форму входа. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return user;
}

export async function startSession(userId: string, sessionVersion: number) {
  const token = await createSessionToken(
    { uid: userId, v: sessionVersion },
    encodeSecret(getSessionSecret()),
  );

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}
