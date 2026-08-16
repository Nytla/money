import bcrypt from "bcryptjs";

/**
 * Хеширование и проверка пароля. Единственная точка работы с паролем:
 * сам пароль дальше этого модуля не уходит — ни в логи, ни в ответы.
 */

/** Стоимость хеширования. В тестах занижается аргументом, в проде — не трогать. */
export const PASSWORD_COST = 12;

export function hashPassword(password: string, cost: number = PASSWORD_COST): Promise<string> {
  return bcrypt.hash(password, cost);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
