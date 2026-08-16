import { testPrisma } from "./client";

/**
 * Чистит базу перед тестом, а не после: упавший тест до уборки не доходит,
 * и следующий получил бы его мусор.
 *
 * Порядок обязателен — Transaction ссылается на Category через onDelete: Restrict,
 * поэтому справочник удаляется только после операций.
 */
export async function resetDb() {
  await testPrisma.transaction.deleteMany();
  await testPrisma.category.deleteMany();
  await testPrisma.user.deleteMany();
}
