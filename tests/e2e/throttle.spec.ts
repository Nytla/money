import { expect, test } from "@playwright/test";
import { E2E_PASSWORD, LOGIN_BLOCK_MS } from "./global-setup";

/**
 * Сценарий намеренно блокирует вход, поэтому вынесен в отдельный файл и в конце
 * дожидается снятия блокировки: счётчик живёт в памяти сервера, и дотянуться
 * до него из теста нельзя. Окно блокировки для E2E укорочено до нескольких
 * секунд, боевая длительность проверяется модульно.
 */

async function attempt(page: import("@playwright/test").Page, password: string) {
  await page.goto("/login");
  await page.getByLabel("Пароль", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Войти" }).click();
}

test("ТК-027: перебор блокируется, успешный вход обнуляет счётчик", async ({ page }) => {
  // Четыре неудачи блокировку не включают.
  for (let i = 0; i < 4; i += 1) {
    await attempt(page, "wrong-horse");
    await expect(page.getByText("Неверный пароль")).toBeVisible();
  }

  // Верный пароль на пятой попытке проходит и сбрасывает счётчик.
  await attempt(page, E2E_PASSWORD);
  await expect(page.getByRole("heading", { name: /Журнал за/ })).toBeVisible();

  await page.getByRole("button", { name: "Выход" }).click();
  // Без ожидания следующий переход успевает уйти раньше, чем завершится выход,
  // и страница входа увидит ещё живую сессию.
  await expect(page).toHaveURL(/\/login$/);

  // Счётчик обнулён: снова нужно пять неудач, а не одна.
  for (let i = 0; i < 5; i += 1) {
    await attempt(page, "wrong-horse");
  }

  await attempt(page, E2E_PASSWORD);
  await expect(page.getByText(/Слишком много неудачных попыток/)).toBeVisible();

  // Дожидаемся окончания окна, чтобы не оставить сервер заблокированным.
  await page.waitForTimeout(LOGIN_BLOCK_MS + 500);
  await attempt(page, E2E_PASSWORD);
  await expect(page.getByRole("heading", { name: /Журнал за/ })).toBeVisible();
});
