import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionSecret } from "@/lib/env";
import { SESSION_COOKIE, encodeSecret, verifySessionToken } from "@/lib/session";

/**
 * Оптимистичная проверка доступа: подпись и срок токена. Обращения к БД здесь нет
 * намеренно — proxy исполняется вне рендера и может уехать на CDN. Полная проверка,
 * включая версию сессии, живёт в `src/lib/auth.ts` рядом с данными.
 *
 * В Next.js 16 конвенция `middleware.ts` переименована в `proxy.ts`.
 */
export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token, encodeSecret(getSessionSecret()));

  const isLoginRoute = request.nextUrl.pathname === "/login";

  if (!session && !isLoginRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Обратного правила «есть подпись — уводим с /login» здесь намеренно нет.
  // Подпись может быть верной у токена с устаревшей версией сессии: тогда proxy
  // пускал бы на «/», страница по данным понимала бы, что сессия мертва, слала бы
  // на «/login», а proxy возвращал бы обратно — бесконечная петля. Решение о том,
  // что пользователь уже вошёл, принимает только страница входа, у которой есть БД.
  return NextResponse.next();
}

export const config = {
  // Без matcher proxy отрабатывал бы и на статике, блокируя загрузку стилей и шрифтов.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
