import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL не задан — проверьте .env");
}

const createClient = () =>
  new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: databaseUrl }) });

// В dev Next.js перезагружает модули на каждом изменении: без кеша
// на globalThis накапливаются подключения к БД.
const globalForPrisma = globalThis as unknown as { prisma?: ReturnType<typeof createClient> };

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
