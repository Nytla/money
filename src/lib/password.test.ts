import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

// Стоимость занижена: при боевой каждая проверка занимала бы сотни миллисекунд.
const COST = 4;

describe("verifyPassword", () => {
  it("ТК-004: принимает верный пароль и отвергает неверный", async () => {
    const hash = await hashPassword("correct-horse", COST);

    expect(await verifyPassword("correct-horse", hash)).toBe(true);
    expect(await verifyPassword("wrong-horse", hash)).toBe(false);
  });

  it("различает регистр и пробелы", async () => {
    const hash = await hashPassword("correct-horse", COST);

    expect(await verifyPassword("Correct-Horse", hash)).toBe(false);
    expect(await verifyPassword(" correct-horse", hash)).toBe(false);
  });

  it("выдаёт разные хеши для одного пароля", async () => {
    const first = await hashPassword("correct-horse", COST);
    const second = await hashPassword("correct-horse", COST);

    expect(first).not.toBe(second);
    expect(await verifyPassword("correct-horse", second)).toBe(true);
  });
});
