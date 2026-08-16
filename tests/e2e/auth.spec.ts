import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { E2E_PASSWORD } from "./global-setup";

test("ТК-010: прямой переход на защищённый маршрут ведёт на форму входа", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByLabel("Пароль")).toBeVisible();
});

test("неверный пароль не пускает и не раскрывает причину", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Пароль").fill("wrong-horse");
  await page.getByRole("button", { name: "Войти" }).click();

  // Next добавляет собственный role="alert" для объявления маршрутов, поэтому
  // проверяем конкретное сообщение, а не роль целиком.
  await expect(page.getByText("Неверный пароль")).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test("ТК-007: вход верным паролем показывает журнал", async ({ page, context }) => {
  await page.goto("/login");
  await page.getByLabel("Пароль").fill(E2E_PASSWORD);
  await page.getByRole("button", { name: "Войти" }).click();

  await expect(page.getByRole("heading", { name: /Журнал за/ })).toBeVisible();

  const session = (await context.cookies()).find((cookie) => cookie.name === "money_session");
  expect(session?.httpOnly).toBe(true);
  expect(session?.sameSite).toBe("Lax");
});

test("страница входа без нарушений доступности", async ({ page }) => {
  await page.goto("/login");

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  expect(results.violations).toEqual([]);
});
