import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { TEST_DATABASE_URL } from "./client";

/**
 * Готовит тестовую базу один раз за прогон: удаляет прошлую и накатывает миграции.
 *
 * Именно миграции, а не синхронизацию схемы: тест должен проверять ту же структуру,
 * которая поедет в прод, включая всё, что миграции делают по дороге.
 */
export default function setup() {
  // better-sqlite3 не создаёт директорию сам — упадёт на отсутствующей db/.
  mkdirSync("db", { recursive: true });

  for (const suffix of ["", "-journal", "-wal", "-shm"]) {
    rmSync(`db/test.db${suffix}`, { force: true });
  }

  // Prisma запускается напрямую через Node, а не через npx: Node отказывается
  // исполнять npx.cmd без shell, а shell с аргументами он же считает небезопасным.
  const prismaBin = createRequire(import.meta.url).resolve("prisma/build/index.js");

  // `migrate deploy` не принимает --url (в отличие от `migrate dev`) и берёт адрес
  // из prisma.config.ts, а тот читает DATABASE_URL. Переменная окружения дочернего
  // процесса имеет приоритет над значением из .env, поэтому подменяем её здесь.
  execFileSync(process.execPath, [prismaBin, "migrate", "deploy"], {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
  });
}
