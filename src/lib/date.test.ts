import { describe, expect, it } from "vitest";
import {
  calendarDay,
  formatDate,
  formatMonthYear,
  parseCalendarDay,
  toCalendarDay,
  todayCalendarDay,
} from "./date";

describe("calendarDay", () => {
  it("создаёт полночь UTC", () => {
    const date = calendarDay(2026, 8, 1);
    expect(date.toISOString()).toBe("2026-08-01T00:00:00.000Z");
  });
});

describe("parseCalendarDay", () => {
  it("разбирает дд.мм.гггг", () => {
    // ТК-002
    expect(parseCalendarDay("01.08.2026")?.getTime()).toBe(Date.UTC(2026, 7, 1));
  });

  it("отклоняет несуществующие даты", () => {
    expect(parseCalendarDay("31.02.2026")).toBeNull();
    expect(parseCalendarDay("00.01.2026")).toBeNull();
    expect(parseCalendarDay("01.13.2026")).toBeNull();
  });

  it("отклоняет мусор и неполный формат", () => {
    expect(parseCalendarDay("")).toBeNull();
    expect(parseCalendarDay("1.8.2026")).toBeNull();
    expect(parseCalendarDay("2026-08-01")).toBeNull();
    expect(parseCalendarDay("abc")).toBeNull();
  });

  it("принимает високосное 29 февраля и отвергает его в невисокосный год", () => {
    expect(parseCalendarDay("29.02.2028")).not.toBeNull();
    expect(parseCalendarDay("29.02.2026")).toBeNull();
  });
});

describe("todayCalendarDay", () => {
  it("берёт локальный календарный день, а не UTC-день", () => {
    // ТК-015: пользователь вводит операцию в 02:00 первого августа. При положительном
    // смещении часового пояса этот момент в UTC ещё 31 июля, но день операции — первое.
    const localEarlyMorning = new Date(2026, 7, 1, 2, 0, 0);

    expect(todayCalendarDay(localEarlyMorning).getTime()).toBe(Date.UTC(2026, 7, 1));
  });

  it("не съезжает в предыдущий день поздним вечером", () => {
    const localLateEvening = new Date(2026, 7, 1, 23, 30, 0);

    expect(todayCalendarDay(localLateEvening).getTime()).toBe(Date.UTC(2026, 7, 1));
  });
});

describe("toCalendarDay", () => {
  it("отбрасывает время", () => {
    expect(toCalendarDay(new Date("2026-08-05T17:42:11.123Z")).toISOString()).toBe(
      "2026-08-05T00:00:00.000Z",
    );
  });
});

describe("formatDate", () => {
  it("выводит дд.мм.гггг с ведущими нулями", () => {
    // ТК-012
    expect(formatDate(calendarDay(2026, 8, 1))).toBe("01.08.2026");
    expect(formatDate(calendarDay(2026, 12, 31))).toBe("31.12.2026");
  });
});

describe("formatMonthYear", () => {
  it("выводит месяц в именительном падеже и год", () => {
    expect(formatMonthYear(calendarDay(2026, 8, 1))).toBe("август 2026");
    expect(formatMonthYear(calendarDay(2026, 1, 15))).toBe("январь 2026");
  });
});
