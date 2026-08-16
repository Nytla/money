import { describe, expect, it } from "vitest";
import { DEFAULT_BLOCK_MS as BLOCK_MS, LoginThrottle, formatRetryAfter } from "./rate-limit";

/** Управляемые часы: тест на 15-минутное окно не должен ждать 15 минут. */
function clock(start = 1_000_000) {
  let current = start;
  return {
    now: () => current,
    advance: (ms: number) => {
      current += ms;
    },
  };
}

describe("LoginThrottle", () => {
  it("ТК-025: блокирует шестую попытку после пяти неудач", () => {
    const time = clock();
    const throttle = new LoginThrottle(5, BLOCK_MS, time.now);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect(throttle.check().allowed).toBe(true);
      throttle.recordFailure();
    }

    const decision = throttle.check();
    expect(decision.allowed).toBe(false);
    expect(decision.allowed === false && decision.retryAfterMs).toBe(BLOCK_MS);
  });

  it("ТК-025: разрешает попытку после истечения окна", () => {
    const time = clock();
    const throttle = new LoginThrottle(5, BLOCK_MS, time.now);

    for (let attempt = 0; attempt < 5; attempt += 1) throttle.recordFailure();

    time.advance(BLOCK_MS - 1);
    expect(throttle.check().allowed).toBe(false);

    time.advance(1);
    expect(throttle.check().allowed).toBe(true);
  });

  it("ТК-027: успешный вход обнуляет счётчик", () => {
    const time = clock();
    const throttle = new LoginThrottle(5, BLOCK_MS, time.now);

    for (let attempt = 0; attempt < 4; attempt += 1) throttle.recordFailure();
    throttle.recordSuccess();

    // После сброса снова нужно пять неудач, а не одна.
    for (let attempt = 0; attempt < 4; attempt += 1) {
      throttle.recordFailure();
      expect(throttle.check().allowed).toBe(true);
    }

    throttle.recordFailure();
    expect(throttle.check().allowed).toBe(false);
  });

  it("после истечения окна счётчик начинается заново", () => {
    const time = clock();
    const throttle = new LoginThrottle(5, BLOCK_MS, time.now);

    for (let attempt = 0; attempt < 5; attempt += 1) throttle.recordFailure();
    time.advance(BLOCK_MS);
    expect(throttle.check().allowed).toBe(true);

    throttle.recordFailure();
    expect(throttle.check().allowed).toBe(true);
  });
});

describe("formatRetryAfter", () => {
  it("округляет минуты вверх, чтобы не обещать раннюю разблокировку", () => {
    expect(formatRetryAfter(BLOCK_MS)).toBe("15 мин");
    expect(formatRetryAfter(61_000)).toBe("2 мин");
  });

  it("переходит на секунды в последнюю минуту", () => {
    expect(formatRetryAfter(40_000)).toBe("40 с");
    expect(formatRetryAfter(1)).toBe("1 с");
  });
});
