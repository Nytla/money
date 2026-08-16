import { requireUser } from "@/lib/auth";
import { currentMonthRange, formatDate, formatMonthYear, todayCalendarDay } from "@/lib/date";
import { buildJournal } from "@/lib/journal";
import { formatMoney, type CurrencyCode } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { AccountMenu } from "./account-menu";
import { TransactionDialog } from "./transaction-dialog";

export default async function JournalPage() {
  const user = await requireUser();
  const currency = user.currency as CurrencyCode;
  const { from, toExclusive } = currentMonthRange();

  const [entries, categories] = await Promise.all([
    prisma.transaction.findMany({
      where: { date: { gte: from, lt: toExclusive } },
      include: { category: { select: { name: true } } },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    }),
    prisma.category.findMany({
      orderBy: [{ kind: "asc" }, { sortOrder: "asc" }],
      select: { id: true, name: true, kind: true },
    }),
  ]);

  const { rows, totals } = buildJournal(
    entries.map((entry) => ({
      id: entry.id,
      date: entry.date,
      kind: entry.kind,
      amountMinor: entry.amountMinor,
      categoryName: entry.category.name,
      createdAt: entry.createdAt,
    })),
  );

  const money = (amountMinor: number) => formatMoney(amountMinor, currency, { withSymbol: false });

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Журнал за {formatMonthYear(from)}</h1>

        <div className="flex flex-wrap items-center gap-2">
          <TransactionDialog
            kind="INCOME"
            categories={categories}
            today={formatDate(todayCalendarDay())}
          />
          <TransactionDialog
            kind="EXPENSE"
            categories={categories}
            today={formatDate(todayCalendarDay())}
          />
          <span className="mx-1 hidden h-6 w-px bg-black/15 sm:block dark:bg-white/20" />
          <AccountMenu />
        </div>
      </header>

      {rows.length === 0 ? (
        <p className="opacity-70">
          За этот месяц операций пока нет. Добавьте доход или расход кнопками выше.
        </p>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[46rem] border-collapse text-sm">
          <caption className="sr-only">
            Доходы и расходы за {formatMonthYear(from)} в валюте {currency}
          </caption>
          <thead>
            <tr className="border-b border-black/15 text-left dark:border-white/20">
              <th scope="col" className="py-2 pr-4 font-medium">
                Месяц, год
              </th>
              <th scope="col" className="py-2 pr-4 font-medium">
                Дата
              </th>
              <th scope="col" className="py-2 pr-4 text-right font-medium">
                Доход, {currency}
              </th>
              <th scope="col" className="py-2 pr-4 font-medium">
                Категория
              </th>
              <th scope="col" className="py-2 pr-4 text-right font-medium">
                Расход, {currency}
              </th>
              <th scope="col" className="py-2 text-right font-medium">
                Остаток, {currency}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-black/10 dark:border-white/10">
                <td className="py-2 pr-4">{formatMonthYear(row.date)}</td>
                <td className="py-2 pr-4">{formatDate(row.date)}</td>
                <td className="py-2 pr-4 text-right tabular-nums">
                  {row.kind === "INCOME" ? money(row.amountMinor) : ""}
                </td>
                <td className="py-2 pr-4">{row.categoryName}</td>
                <td className="py-2 pr-4 text-right tabular-nums">
                  {row.kind === "EXPENSE" ? money(row.amountMinor) : ""}
                </td>
                <td className="py-2 text-right tabular-nums">{money(row.balanceMinor)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-black/25 font-medium dark:border-white/30">
              <th scope="row" colSpan={2} className="py-2 pr-4 text-left">
                Итого
              </th>
              <td className="py-2 pr-4 text-right tabular-nums">{money(totals.incomeMinor)}</td>
              <td className="py-2 pr-4" />
              <td className="py-2 pr-4 text-right tabular-nums">{money(totals.expenseMinor)}</td>
              <td className="py-2 text-right tabular-nums">{money(totals.balanceMinor)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </main>
  );
}
