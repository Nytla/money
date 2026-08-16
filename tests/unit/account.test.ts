import { beforeEach, describe, expect, it } from "vitest";
import { MIN_PASSWORD_LENGTH, changePassword, validateNewPassword } from "@/lib/account";
import { verifyPassword } from "@/lib/password";
import { testPrisma } from "../db/client";
import { DEFAULT_PASSWORD, makeUser } from "../db/fixtures";
import { resetDb } from "../db/reset";

beforeEach(resetDb);

describe("validateNewPassword", () => {
  it("ТК-020: отвергает 7 символов и принимает 8", () => {
    expect(validateNewPassword("1234567")).toContain(String(MIN_PASSWORD_LENGTH));
    expect(validateNewPassword("12345678")).toBeNull();
  });
});

describe("changePassword", () => {
  it("ТК-021: при неверном текущем пароле не меняет хеш", async () => {
    const user = await makeUser();

    const result = await changePassword(testPrisma, user.id, {
      currentPassword: "wrong-horse",
      newPassword: "battery-staple",
    });

    expect(result).toEqual({
      ok: false,
      field: "currentPassword",
      error: "Текущий пароль неверен",
    });

    const stored = await testPrisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(stored.passwordHash).toBe(user.passwordHash);
    expect(stored.sessionVersion).toBe(user.sessionVersion);
  });

  it("меняет пароль и увеличивает версию сессии", async () => {
    const user = await makeUser();

    const result = await changePassword(testPrisma, user.id, {
      currentPassword: DEFAULT_PASSWORD,
      newPassword: "battery-staple",
    });

    expect(result).toEqual({ ok: true, sessionVersion: user.sessionVersion + 1 });

    const stored = await testPrisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(await verifyPassword("battery-staple", stored.passwordHash)).toBe(true);
    expect(await verifyPassword(DEFAULT_PASSWORD, stored.passwordHash)).toBe(false);
  });

  it("ТК-020: короткий новый пароль не проходит и хеш не меняется", async () => {
    const user = await makeUser();

    const result = await changePassword(testPrisma, user.id, {
      currentPassword: DEFAULT_PASSWORD,
      newPassword: "1234567",
    });

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.field).toBe("newPassword");

    const stored = await testPrisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(stored.passwordHash).toBe(user.passwordHash);
  });

  it("отвергает новый пароль, совпадающий с текущим", async () => {
    const user = await makeUser();

    const result = await changePassword(testPrisma, user.id, {
      currentPassword: DEFAULT_PASSWORD,
      newPassword: DEFAULT_PASSWORD,
    });

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.field).toBe("newPassword");
  });
});
