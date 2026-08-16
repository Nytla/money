import { beforeEach, describe, expect, it } from "vitest";
import { testPrisma } from "../db/client";
import { makeCategory, makeTransaction, makeUser } from "../db/fixtures";
import { resetDb } from "../db/reset";

beforeEach(resetDb);

describe("фабрики фикстур", () => {
  it("ТК-001: сумма хранится целыми минорными единицами", async () => {
    const transaction = await makeTransaction({ amount: "90 000,00" });

    expect(transaction.amountMinor).toBe(9_000_000);
    expect(Number.isInteger(transaction.amountMinor)).toBe(true);
  });

  it("ТК-002: дата хранится календарным днём в UTC", async () => {
    const transaction = await makeTransaction({ date: "01.08.2026" });

    expect(transaction.date.getTime()).toBe(Date.UTC(2026, 7, 1));
    expect(transaction.date.getUTCHours()).toBe(0);
    expect(transaction.date.getUTCMinutes()).toBe(0);
    expect(transaction.date.getUTCSeconds()).toBe(0);
  });

  it("отвергает некорректную сумму вместо тихой записи мусора", async () => {
    await expect(makeTransaction({ amount: "abc" })).rejects.toThrow(/некорректную сумму/);
  });

  it("отвергает некорректную дату", async () => {
    await expect(makeTransaction({ date: "31.02.2026" })).rejects.toThrow(/некорректную дату/);
  });
});

describe("изоляция тестовой базы", () => {
  it("ТК-003 (часть 1): создаёт данные", async () => {
    await makeUser();
    await makeCategory({ name: "Покупки" });
    await makeTransaction({ amount: "4 500,00" });

    expect(await testPrisma.transaction.count()).toBe(1);
  });

  it("ТК-003 (часть 2): следующий тест видит пустую базу", async () => {
    expect(await testPrisma.transaction.count()).toBe(0);
    expect(await testPrisma.category.count()).toBe(0);
    expect(await testPrisma.user.count()).toBe(0);
  });
});

describe("порядок очистки", () => {
  it("удаляет операции раньше категорий, не нарушая внешний ключ", async () => {
    const category = await makeCategory({ name: "Комуналка" });
    await makeTransaction({ categoryId: category.id, amount: "4 500,00" });

    await expect(resetDb()).resolves.not.toThrow();
    expect(await testPrisma.category.count()).toBe(0);
  });
});
