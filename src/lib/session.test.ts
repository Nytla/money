// @vitest-environment node
// jsdom подменяет TextEncoder, и его Uint8Array не проходит проверку instanceof
// внутри jose. Модуль всё равно исполняется на сервере — среда Node тут честнее.
import { describe, expect, it } from "vitest";
import {
  createSessionToken,
  encodeSecret,
  sessionMatchesUser,
  verifySessionToken,
} from "./session";

const secret = encodeSecret("test-secret-at-least-32-bytes-long!!");
const otherSecret = encodeSecret("another-secret-at-least-32-bytes!!!!");

describe("verifySessionToken", () => {
  it("принимает собственный токен", async () => {
    const token = await createSessionToken({ uid: "u1", v: 1 }, secret);

    expect(await verifySessionToken(token, secret)).toEqual({ uid: "u1", v: 1 });
  });

  it("ТК-005: отклоняет токен с подменённой полезной нагрузкой", async () => {
    const token = await createSessionToken({ uid: "u1", v: 1 }, secret);
    const [header, payload, signature] = token.split(".");

    const tampered = Buffer.from(JSON.stringify({ uid: "u2", v: 1 }))
      .toString("base64url")
      .replace(/=+$/, "");

    expect(await verifySessionToken(`${header}.${tampered}.${signature}`, secret)).toBeNull();
    expect(payload).not.toBe(tampered);
  });

  it("ТК-009: отклоняет токен с испорченной подписью", async () => {
    const token = await createSessionToken({ uid: "u1", v: 1 }, secret);
    const broken = token.slice(0, -1) + (token.endsWith("A") ? "B" : "A");

    expect(await verifySessionToken(broken, secret)).toBeNull();
  });

  it("отклоняет токен, подписанный чужим секретом", async () => {
    const token = await createSessionToken({ uid: "u1", v: 1 }, otherSecret);

    expect(await verifySessionToken(token, secret)).toBeNull();
  });

  it("отклоняет просроченный токен", async () => {
    const token = await createSessionToken({ uid: "u1", v: 1 }, secret, -1);

    expect(await verifySessionToken(token, secret)).toBeNull();
  });

  it("отсутствие токена и мусор обрабатываются как отсутствие сессии", async () => {
    expect(await verifySessionToken(undefined, secret)).toBeNull();
    expect(await verifySessionToken("", secret)).toBeNull();
    expect(await verifySessionToken("не.токен.вовсе", secret)).toBeNull();
  });
});

describe("sessionMatchesUser", () => {
  const user = { id: "u1", sessionVersion: 2 };

  it("принимает токен текущей версии", () => {
    expect(sessionMatchesUser({ uid: "u1", v: 2 }, user)).toBe(true);
  });

  it("ТК-023: отклоняет токен с устаревшей версией сессии", () => {
    expect(sessionMatchesUser({ uid: "u1", v: 1 }, user)).toBe(false);
  });

  it("отклоняет токен от другого пользователя", () => {
    expect(sessionMatchesUser({ uid: "u2", v: 2 }, user)).toBe(false);
  });

  it("отсутствие токена или пользователя — не сессия", () => {
    expect(sessionMatchesUser(null, user)).toBe(false);
    expect(sessionMatchesUser({ uid: "u1", v: 2 }, null)).toBe(false);
  });
});
