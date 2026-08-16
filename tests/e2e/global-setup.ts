import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";

/** Адрес базы для E2E. Отдельная от dev.db: браузерные сценарии пишут в неё данные. */
export const E2E_DATABASE_URL = "file:./db/e2e.db";

/** Пароль, который сид ставит для E2E. Совпадает с базовыми фикстурами тест-плана. */
export const E2E_PASSWORD = "correct-horse";

/** Окно блокировки входа для E2E: боевые 15 минут остановили бы весь прогон. */
export const LOGIN_BLOCK_MS = 3000;

/**
 * Пересоздаёт базу для E2E перед прогоном: миграции и сид с известным паролем.
 * Prisma вызывается напрямую через Node — npx.cmd без shell Node не запускает.
 */
export default function globalSetup() {
  mkdirSync("db", { recursive: true });

  for (const suffix of ["", "-journal", "-wal", "-shm"]) {
    rmSync(`db/e2e.db${suffix}`, { force: true });
  }

  // Playwright транспилирует конфиг в CommonJS, где import.meta недоступна,
  // поэтому путь до бинарника собирается от корня проекта.
  const prismaBin = path.join(process.cwd(), "node_modules", "prisma", "build", "index.js");
  const env = {
    ...process.env,
    DATABASE_URL: E2E_DATABASE_URL,
    INITIAL_PASSWORD: E2E_PASSWORD,
  };

  execFileSync(process.execPath, [prismaBin, "migrate", "deploy"], { stdio: "inherit", env });
  // Команду сида Prisma берёт из prisma.config.ts и запускает сама.
  execFileSync(process.execPath, [prismaBin, "db", "seed"], { stdio: "inherit", env });
}
