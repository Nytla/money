/**
 * Ограничение попыток входа. Сервис однопользовательский, поэтому счётчик один
 * на весь сервис и ключ не нужен.
 *
 * Счётчик живёт в памяти процесса и обнуляется при перезапуске. Для локального
 * личного сервиса этого достаточно: единственный сценарий, от которого защищаемся, —
 * подбор короткого пароля по сети, а он идёт непрерывно.
 */

export const MAX_FAILURES = 5;
export const DEFAULT_BLOCK_MS = 15 * 60 * 1000;

/**
 * Длительность блокировки. Значение по умолчанию — 15 минут; переопределяется
 * только для E2E, где иначе один сценарий на перебор парализовал бы все
 * последующие входы на пятнадцать минут.
 */
export const BLOCK_MS = Number(process.env.LOGIN_BLOCK_MS) || DEFAULT_BLOCK_MS;

export type ThrottleDecision = { allowed: true } | { allowed: false; retryAfterMs: number };

export class LoginThrottle {
  #failures = 0;
  #blockedUntil: number | null = null;

  constructor(
    private readonly maxFailures: number = MAX_FAILURES,
    private readonly blockMs: number = BLOCK_MS,
    private readonly now: () => number = () => Date.now(),
  ) {}

  /** Проверяется до сверки пароля: блокировка сильнее верного пароля. */
  check(): ThrottleDecision {
    if (this.#blockedUntil === null) return { allowed: true };

    const remaining = this.#blockedUntil - this.now();
    if (remaining > 0) return { allowed: false, retryAfterMs: remaining };

    // Окно истекло — начинаем считать заново.
    this.#reset();
    return { allowed: true };
  }

  recordFailure(): void {
    this.#failures += 1;

    if (this.#failures >= this.maxFailures) {
      this.#blockedUntil = this.now() + this.blockMs;
    }
  }

  recordSuccess(): void {
    this.#reset();
  }

  #reset(): void {
    this.#failures = 0;
    this.#blockedUntil = null;
  }
}

/** Человекочитаемый остаток блокировки: «14 минут», «40 секунд». */
export function formatRetryAfter(retryAfterMs: number): string {
  const minutes = Math.ceil(retryAfterMs / 60_000);
  if (minutes > 1) return `${minutes} мин`;

  return `${Math.max(1, Math.ceil(retryAfterMs / 1000))} с`;
}
