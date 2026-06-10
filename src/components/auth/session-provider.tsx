"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useUser } from "@/hooks/useUser";

interface SessionContextValue {
  /** True once an anonymous session has been established (or there's nothing to do). */
  ready: boolean;
  /** The ULID this browser owns (from localStorage), once known. */
  userId?: string;
}

// Default `ready: true` so any consumer rendered outside the provider never deadlocks.
const SessionContext = createContext<SessionContextValue>({ ready: true });

export function useSession() {
  return useContext(SessionContext);
}

/**
 * Establishes the HttpOnly anonymous-session cookie for this browser's ULID
 * before any guarded data fetch runs. Idempotent and cheap; runs once per full
 * page load (the cookie persists for 30 days).
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const { id, loading } = useUser();
  const [ready, setReady] = useState(false);
  const requested = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (!id) {
      // No identity yet (e.g. SSR/edge cases) — nothing to bind.
      setReady(true);
      return;
    }
    if (requested.current) return;
    requested.current = true;

    fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: id }),
    })
      .catch(() => {
        /* network hiccup — guarded routes will surface their own 401s */
      })
      .finally(() => setReady(true));
  }, [id, loading]);

  return (
    <SessionContext.Provider value={{ ready, userId: id }}>
      {children}
    </SessionContext.Provider>
  );
}
