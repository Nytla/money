/**
 * Чтение переменных окружения. Отсутствие обязательной переменной должно падать
 * с внятным сообщением при первом обращении, а не превращаться в `undefined`
 * где-то в середине проверки подписи.
 */

export function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Переменная окружения ${name} не задана. Скопируйте .env.example в .env и заполните её.`,
    );
  }

  return value;
}

export function getSessionSecret(): string {
  return requireEnv("SESSION_SECRET");
}

export const isProduction = process.env.NODE_ENV === "production";
