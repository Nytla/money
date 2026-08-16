import { expect, test } from "@playwright/test";

/** Набор из next.config.ts. Проверяется на каждом маршруте, включая публичный. */
const EXPECTED_HEADERS: Record<string, string> = {
  "x-frame-options": "DENY",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
};

test("ТК-029: заголовки безопасности отдаются на странице входа", async ({ request }) => {
  const response = await request.get("/login");
  const headers = response.headers();

  for (const [name, value] of Object.entries(EXPECTED_HEADERS)) {
    expect(headers[name], `заголовок ${name}`).toBe(value);
  }
});

test("ТК-028: заголовки безопасности отдаются на защищённом маршруте", async ({ request }) => {
  // Без сессии ответ будет перенаправлением — заголовки должны быть и на нём,
  // иначе их не было бы на самом частом ответе неавторизованному посетителю.
  const response = await request.get("/", { maxRedirects: 0 });
  const headers = response.headers();

  for (const [name, value] of Object.entries(EXPECTED_HEADERS)) {
    expect(headers[name], `заголовок ${name}`).toBe(value);
  }
});
