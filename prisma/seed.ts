import bcrypt from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

process.loadEnvFile?.(".env");

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! }),
});

const INCOME_CATEGORIES = [
  { name: "Зарплата", iconKey: "wallet", color: "#16a34a" },
  { name: "Подработка", iconKey: "briefcase", color: "#0d9488" },
  { name: "Проценты", iconKey: "percent", color: "#0284c7" },
  { name: "Прочий доход", iconKey: "circle-plus", color: "#64748b" },
];

const EXPENSE_CATEGORIES = [
  { name: "Покупки", iconKey: "shopping-cart", color: "#f97316" },
  { name: "Комуналка", iconKey: "house", color: "#6366f1" },
  { name: "Инвестиции", iconKey: "trending-up", color: "#0ea5e9" },
  { name: "Благотворительность", iconKey: "heart-handshake", color: "#ec4899" },
  { name: "Десятина", iconKey: "church", color: "#a855f7", isSystem: true },
  { name: "Транспорт", iconKey: "car", color: "#eab308" },
  { name: "Здоровье", iconKey: "stethoscope", color: "#ef4444" },
  { name: "Прочий расход", iconKey: "circle-minus", color: "#64748b" },
];

async function main() {
  const password = process.env.INITIAL_PASSWORD ?? "changeme";

  const userCount = await prisma.user.count();
  if (userCount === 0) {
    await prisma.user.create({
      data: { passwordHash: await bcrypt.hash(password, 12) },
    });
    console.log(`Создан пользователь. Пароль: ${password} — смените его после первого входа.`);
  }

  const all = [
    ...INCOME_CATEGORIES.map((c, i) => ({ ...c, kind: "INCOME" as const, sortOrder: i })),
    ...EXPENSE_CATEGORIES.map((c, i) => ({ ...c, kind: "EXPENSE" as const, sortOrder: i })),
  ];

  for (const category of all) {
    await prisma.category.upsert({
      where: { name_kind: { name: category.name, kind: category.kind } },
      update: {},
      create: category,
    });
  }
  console.log(`Категорий в справочнике: ${await prisma.category.count()}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
