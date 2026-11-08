import { useEffect } from "react";
import { useAuth } from "./AuthContext";
import { IDLE_TIMEOUT_MS, triggerIdleTimeout } from "./sessionPolicy";

const activityEvents = ["mousedown", "keydown", "scroll", "touchstart", "click"] as const;

export function IdleSessionMonitor() {
  const { status } = useAuth();

  useEffect(() => {
    if (status !== "authenticated") return;

    let timer = window.setTimeout(() => {
      void triggerIdleTimeout();
    }, IDLE_TIMEOUT_MS);

    const bump = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        void triggerIdleTimeout();
      }, IDLE_TIMEOUT_MS);
    };

    for (const event of activityEvents) {
      window.addEventListener(event, bump, { passive: true });
    }

    return () => {
      window.clearTimeout(timer);
      for (const event of activityEvents) {
        window.removeEventListener(event, bump);
      }
    };
  }, [status]);

  return null;
}
