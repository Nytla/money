import { SignJWT, jwtVerify } from "jose";

/**
 * Сессионный токен. Чистый модуль: секрет передаётся аргументом, работы
 * с cookie и с окружением здесь нет — это делает вызывающий серверный код.
 */

export const SESSION_COOKIE = "money_session";

/** Срок жизни сессии. Больше — удобнее, меньше — безопаснее; неделя как компромисс. */
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export type SessionPayload = {
  /** Идентификатор пользователя. */
  uid: string;
  /** Версия сессии; при смене пароля увеличивается и обесценивает выданные токены. */
  v: number;
};

export function encodeSecret(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(
  payload: SessionPayload,
  secret: Uint8Array,
  ttlSeconds: number = SESSION_TTL_SECONDS,
): Promise<string> {
  return new SignJWT({ uid: payload.uid, v: payload.v })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(secret);
}

/**
 * Проверяет подпись и срок. Любая проблема — подделка, просрочка, мусор вместо
 * токена — возвращает null: для вызывающего кода это неотличимо от отсутствия
 * сессии, и обрабатывается одинаково.
 */
export async function verifySessionToken(
  token: string | undefined,
  secret: Uint8Array,
): Promise<SessionPayload | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });

    if (typeof payload.uid !== "string" || typeof payload.v !== "number") return null;

    return { uid: payload.uid, v: payload.v };
  } catch {
    return null;
  }
}
