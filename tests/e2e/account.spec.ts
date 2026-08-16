import { expect, test, type Page } from "@playwright/test";
import { restoreAccountPassword } from "./account-db";
import { E2E_PASSWORD } from "./global-setup";

/**
 * Сценарии этой группы меняют пароль. Восстановление идёт через базу, а не через
 * интерфейс: упавший тест до восстановления через интерфейс просто не дойдёт
 * и оставит базу с чужим паролем.
 */
test.afterEach(restoreAccountPassword);

async function signIn(page: Page, password = E2E_PASSWORD) {
  await page.goto("/login");
  await page.getByLabel("Пароль", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Войти" }).click();
}

async function expectJournal(page: Page) {
  await expect(page.getByRole("heading", { name: /Журнал за/ })).toBeVisible();
}

async function changePassword(page: Page, from: string, to: string) {
  await page.getByRole("button", { name: "Сменить пароль" }).click();
  await page.getByLabel("Текущий пароль").fill(from);
  await page.getByLabel("Новый пароль").fill(to);
  await page.getByRole("button", { name: "Сменить", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
}

test("ТК-019: выход закрывает доступ, возврат назад ведёт на форму входа", async ({ page }) => {
  await signIn(page);
  await expectJournal(page);

  await page.getByRole("button", { name: "Выход" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.goBack();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByLabel("Пароль", { exact: true })).toBeVisible();
});

test("смена пароля требует верный текущий", async ({ page }) => {
  await signIn(page);
  await expectJournal(page);

  await page.getByRole("button", { name: "Сменить пароль" }).click();
  await page.getByLabel("Текущий пароль").fill("wrong-horse");
  await page.getByLabel("Новый пароль").fill("battery-staple");
  await page.getByRole("button", { name: "Сменить", exact: true }).click();

  await expect(page.getByText("Текущий пароль неверен")).toBeVisible();
});

test("короткий новый пароль не принимается", async ({ page }) => {
  await signIn(page);
  await expectJournal(page);

  await page.getByRole("button", { name: "Сменить пароль" }).click();
  await page.getByLabel("Текущий пароль").fill(E2E_PASSWORD);
  await page.getByLabel("Новый пароль").fill("1234567");
  await page.getByRole("button", { name: "Сменить", exact: true }).click();

  await expect(page.getByText(/не короче 8 символов/)).toBeVisible();
});

test("ТК-022: после смены пароля работает новый, старый — нет", async ({ page }) => {
  const nextPassword = "battery-staple";

  await signIn(page);
  await expectJournal(page);
  await changePassword(page, E2E_PASSWORD, nextPassword);

  await page.getByRole("button", { name: "Выход" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await signIn(page, E2E_PASSWORD);
  await expect(page.getByText("Неверный пароль")).toBeVisible();

  await signIn(page, nextPassword);
  await expectJournal(page);

  // Возвращаем исходный пароль, чтобы не сломать соседние сценарии.
  await changePassword(page, nextPassword, E2E_PASSWORD);
});

test("ТК-024: сессия, выданная до смены пароля, перестаёт действовать", async ({
  page,
  context,
}) => {
  const nextPassword = "battery-staple";

  await signIn(page);
  await expectJournal(page);

  const staleCookies = await context.cookies();

  await changePassword(page, E2E_PASSWORD, nextPassword);

  // Возвращаем старую cookie: она подписана верно, но её версия сессии устарела.
  await context.clearCookies();
  await context.addCookies(staleCookies);

  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);

  await signIn(page, nextPassword);
  await expectJournal(page);
  await changePassword(page, nextPassword, E2E_PASSWORD);
});
