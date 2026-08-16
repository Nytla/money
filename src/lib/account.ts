import type { PrismaClient } from "@/generated/prisma/client";
import { hashPassword, verifyPassword } from "@/lib/password";

/**
 * Операции над учётной записью. Клиент БД передаётся аргументом, а не берётся
 * из синглтона: так эти функции проверяются на тестовой базе.
 */

export const MIN_PASSWORD_LENGTH = 8;

export type ChangePasswordField = "currentPassword" | "newPassword";

export type ChangePasswordResult =
  { ok: true; sessionVersion: number } | { ok: false; field: ChangePasswordField; error: string };

/** Возвращает текст ошибки или null, если пароль годится. */
export function validateNewPassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Пароль должен быть не короче ${MIN_PASSWORD_LENGTH} символов`;
  }

  return null;
}

/**
 * Меняет пароль, увеличивая версию сессии: выданные ранее токены становятся
 * недействительными. Проверка старого пароля обязательна — это единственное,
 * что мешает сменить пароль тому, кто добрался до открытой вкладки.
 */
export async function changePassword(
  db: PrismaClient,
  userId: string,
  input: { currentPassword: string; newPassword: string },
): Promise<ChangePasswordResult> {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { ok: false, field: "currentPassword", error: "Учётная запись не найдена" };
  }

  const currentMatches = await verifyPassword(input.currentPassword, user.passwordHash);
  if (!currentMatches) {
    return { ok: false, field: "currentPassword", error: "Текущий пароль неверен" };
  }

  const problem = validateNewPassword(input.newPassword);
  if (problem) {
    return { ok: false, field: "newPassword", error: problem };
  }

  if (await verifyPassword(input.newPassword, user.passwordHash)) {
    return { ok: false, field: "newPassword", error: "Новый пароль совпадает с текущим" };
  }

  const updated = await db.user.update({
    where: { id: userId },
    data: {
      passwordHash: await hashPassword(input.newPassword),
      sessionVersion: { increment: 1 },
    },
  });

  return { ok: true, sessionVersion: updated.sessionVersion };
}
