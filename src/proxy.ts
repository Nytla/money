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

  if (session && isLoginRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Без matcher proxy отрабатывал бы и на статике, блокируя загрузку стилей и шрифтов.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
