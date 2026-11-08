import { authNavigate } from "./authNavigation";

export const IDLE_TIMEOUT_MS = 5 * 60 * 1000;

type SessionHandler = () => Promise<void>;

let unauthorizedHandler: SessionHandler | null = null;
let idleHandler: SessionHandler | null = null;
let redirectLock = false;

export function registerSessionHandlers(handlers: { onUnauthorized: SessionHandler; onIdle: SessionHandler }): void {
  unauthorizedHandler = handlers.onUnauthorized;
  idleHandler = handlers.onIdle;
}

function releaseLockSoon(): void {
  window.setTimeout(() => {
    redirectLock = false;
  }, 1500);
}

export async function triggerUnauthorized(): Promise<void> {
  if (redirectLock || window.location.pathname === "/login-required") return;
  redirectLock = true;
  try {
    await unauthorizedHandler?.();
    authNavigate("/login-required");
  } finally {
    releaseLockSoon();
  }
}

export function triggerForbidden(): void {
  if (window.location.pathname === "/shared/forbidden") return;
  authNavigate("/shared/forbidden");
}

export async function triggerIdleTimeout(): Promise<void> {
  if (redirectLock || window.location.pathname === "/session-expired") return;
  redirectLock = true;
  try {
    await idleHandler?.();
    authNavigate("/session-expired");
  } finally {
    releaseLockSoon();
  }
}
