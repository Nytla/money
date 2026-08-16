<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# money.com — сервис учёта доходов и расходов

Требования: `docs/PLAN.md` (уточнённое ТЗ и план), `docs/TZ.txt` (исходник),
`docs/testing-cycle.xlsx` (регламент тестирования из 9 этапов).

## Конвенции, нарушение которых ломает учёт

- **Деньги — только целые минорные единицы** (`amountMinor`, копейки). Никаких `Float`
  для сумм. Разбор пользовательского ввода и форматирование — исключительно через
  `src/lib/money.ts`, там же единственная точка округления.
- **Дата операции — календарный день**, время 00:00 UTC. Не хранить локальное время:
  операция, введённая в 02:00, иначе уедет в предыдущий месяц.
- **Валюта одна на весь учёт**, берётся из `User.currency`. Суммы в БД без привязки к валюте.

## Стек и команды

Next.js 16 App Router + React 19 + TypeScript strict + Tailwind v4.
БД — SQLite через Prisma 7 с драйвер-адаптером (`src/lib/prisma.ts`).
Сгенерированный клиент лежит в `src/generated/prisma` и не коммитится.

| Команда              | Назначение                                                             |
| -------------------- | ---------------------------------------------------------------------- |
| `npm run dev`        | Дев-сервер                                                             |
| `npm run verify`     | Формат + линт + типы + unit-тесты — прогонять перед завершением задачи |
| `npm run test:e2e`   | Playwright (сам поднимет дев-сервер)                                   |
| `npm run db:migrate` | Миграция после правки `prisma/schema.prisma`                           |
| `npm run db:seed`    | Пересоздать базовые категории и пользователя                           |

Prisma 7 не читает `.env` сам — переменные подгружаются в `prisma.config.ts`.
Настройки БД в `prisma.config.ts`, не в `datasource` схемы.

## Тестирование

Unit-тесты лежат рядом с кодом (`src/**/*.test.ts`), E2E — в `tests/e2e/`.
Обязательно покрывать: расчёт остатка и десятины, агрегацию по периоду, форматирование
сумм и дат. Полный регламент и его текущий статус — в разделе 5 `docs/PLAN.md`.
