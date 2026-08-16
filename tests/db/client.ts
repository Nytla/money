import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

/** Путь тестовой базы. Отличается от dev.db намеренно: тесты чистят таблицы. */
export const TEST_DATABASE_URL = "file:./db/test.db";

/**
 * Отдельный от `src/lib/prisma.ts` клиент: тестовый никогда не должен
 * смотреть в рабочую базу, даже если DATABASE_URL окажется задан.
 */
export const testPrisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: TEST_DATABASE_URL }),
});
