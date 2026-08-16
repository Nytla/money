import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { E2E_PASSWORD } from "./global-setup";

/**
 * Прямой доступ к базе E2E для восстановления состояния между сценариями.
 *
 * Сценарии смены пароля должны возвращать исходный, иначе один упавший тест
 * оставляет базу с чужим паролем и роняет все последующие. Через интерфейс это
 * ненадёжно: упавший тест до восстановления просто не доходит.
 *
 * Используется better-sqlite3, а не Prisma: сгенерированный клиент опирается
 * на import.meta, а Playwright компилирует тесты в CommonJS.
 */
export async function restoreAccountPassword() {
  const db = new Database("db/e2e.db");

  try {
    const hash = await bcrypt.hash(E2E_PASSWORD, 4);
    db.prepare(`UPDATE "User" SET "passwordHash" = ?`).run(hash);
  } finally {
    db.close();
  }
}
