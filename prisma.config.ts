import { defineConfig } from "prisma/config";

// Prisma 7 больше не читает .env сам, а CLI запускается вне Next.js.
// Отсутствие .env не должно ронять `prisma generate` на свежем клоне.
try {
  process.loadEnvFile?.(".env");
} catch {
  // .env ещё не создан — команды миграции сообщат об этом сами.
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
});
