import "server-only";

import { LoginThrottle } from "@/lib/rate-limit";

/**
 * Единственный экземпляр ограничителя на процесс. Кешируется на globalThis:
 * в dev Next перезагружает модули на каждую правку, и без кеша счётчик
 * обнулялся бы после любого изменения кода.
 */
const globalForThrottle = globalThis as unknown as { loginThrottle?: LoginThrottle };

export const loginThrottle = (globalForThrottle.loginThrottle ??= new LoginThrottle());
