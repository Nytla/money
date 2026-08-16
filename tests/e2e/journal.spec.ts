import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { E2E_PASSWORD } from "./global-setup";

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Пароль").fill(E2E_PASSWORD);
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page.getByRole("heading", { name: /Журнал за/ })).toBeVisible();
}

/** Сегодняшний день в формате поля даты — журнал открыт на текущем месяце. */
function today(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}.${now.getFullYear()}`;
}

test.describe("журнал", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("ТК-014: столбцы идут в порядке из ТЗ", async ({ page }) => {
    const headers = await page.getByRole("columnheader").allInnerTexts();

    expect(headers.map((header) => header.split(",")[0].trim())).toEqual([
      "Месяц",
      "Дата",
      "Доход",
      "Категория",
      "Расход",
      "Остаток",
    ]);
  });

  test("пустой месяц объясняет, что делать", async ({ page }) => {
    await expect(page.getByText(/операций пока нет/)).toBeVisible();
  });

  test("ТК-017: добавленный доход появляется в журнале и меняет итоги", async ({ page }) => {
    await page.getByRole("button", { name: "Добавить доход" }).click();

    await page.getByLabel("Сумма").fill("90 000,00");
    await page.getByLabel("Дата").fill(today());
    await page.getByLabel("Категория").selectOption({ label: "Зарплата" });
    await page.getByRole("button", { name: "Сохранить" }).click();

    const row = page.getByRole("row").filter({ hasText: "Зарплата" });
    await expect(row).toBeVisible();
    await expect(row).toContainText("90 000,00");

    const totals = page.getByRole("row").filter({ hasText: "Итого" });
    await expect(totals).toContainText("90 000,00");
  });

  test("ТК-016: форма дохода не предлагает расходные категории", async ({ page }) => {
    await page.getByRole("button", { name: "Добавить доход" }).click();

    const options = await page.getByLabel("Категория").locator("option").allInnerTexts();

    expect(options).toContain("Зарплата");
    expect(options).not.toContain("Комуналка");
    expect(options).not.toContain("Покупки");
  });

  test("журнал без нарушений доступности", async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
