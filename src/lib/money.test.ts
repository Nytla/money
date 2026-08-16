import { describe, expect, it } from "vitest";
import { calculateTithe, formatMoney, parseAmount, toMajor } from "./money";

describe("parseAmount", () => {
  it("разбирает точку и запятую как разделитель", () => {
    expect(parseAmount("1234.56")).toBe(123456);
    expect(parseAmount("1234,56")).toBe(123456);
  });

  it("игнорирует пробелы-разделители разрядов, включая неразрывный", () => {
    expect(parseAmount("1 234,56")).toBe(123456);
    expect(parseAmount("1 234,56")).toBe(123456);
  });

  it("округляет до копеек ровно один раз", () => {
    expect(parseAmount("0.1")).toBe(10);
    expect(parseAmount("90000")).toBe(9000000);
  });

  it("отклоняет нечисловой ввод, отрицательные суммы и лишние знаки", () => {
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("abc")).toBeNull();
    expect(parseAmount("-100")).toBeNull();
    expect(parseAmount("1.234")).toBeNull();
  });
});

describe("сложение сумм в минорных единицах", () => {
  it("не накапливает ошибку округления, в отличие от Float", () => {
    const sum = [10, 20].reduce((a, b) => a + b, 0);
    expect(toMajor(sum)).toBe(0.3);
    // Для сравнения: 0.1 + 0.2 !== 0.3
    expect(0.1 + 0.2).not.toBe(0.3);
  });
});

describe("formatMoney", () => {
  it("форматирует с символом валюты", () => {
    // В ru-RU разделитель разрядов — неразрывный пробел, поэтому сравниваем по подстроке.
    const result = formatMoney(9000000, "RUB");
    expect(result).toContain("90");
    expect(result).toContain("₽");
  });

  it("умеет форматировать без символа — для колонок таблицы", () => {
    expect(formatMoney(450000, "RUB", { withSymbol: false })).not.toContain("₽");
  });
});

describe("calculateTithe", () => {
  it("считает 10% от дохода за период", () => {
    expect(calculateTithe(9000000, 900000, 10)).toEqual({
      dueMinor: 900000,
      paidMinor: 900000,
      percent: 100,
    });
  });

  it("показывает недоплату", () => {
    expect(calculateTithe(9000000, 450000, 10).percent).toBe(50);
  });

  it("при нулевом доходе считает десятину выполненной, а не делит на ноль", () => {
    expect(calculateTithe(0, 0, 10).percent).toBe(100);
  });

  it("учитывает настраиваемый процент", () => {
    expect(calculateTithe(1000000, 0, 15).dueMinor).toBe(150000);
  });
});
