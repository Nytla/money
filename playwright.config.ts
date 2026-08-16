import { defineConfig, devices } from "@playwright/test";
import { E2E_DATABASE_URL, LOGIN_BLOCK_MS } from "./tests/e2e/global-setup";

const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  // Сценарии пишут в общую базу, поэтому идут последовательно.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  globalSetup: "./tests/e2e/global-setup.ts",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Порт отличается от дев-сервера: E2E не должны цепляться к запущенному вручную
    // серверу, который смотрит в рабочую базу.
    command: `npx next dev --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATABASE_URL: E2E_DATABASE_URL,
      // Иначе сценарий на перебор заблокировал бы вход на 15 минут и уронил
      // все последующие тесты. Длительность окна проверяется модульно.
      LOGIN_BLOCK_MS: String(LOGIN_BLOCK_MS),
    },
    // Обычные логи запросов заглушены, ошибки сервера — видны.
    stdout: "ignore",
    stderr: "pipe",
  },
});
