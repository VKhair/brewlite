import { useCallback, useState } from "react";
import type { Session } from "./session.types";

const storageKey = "brewlite-session";

export function useSessionState() {
  const [session, setSession] = useState<Session | null>(null);

  const restoreSession = useCallback(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) setSession(JSON.parse(saved) as Session);
  }, []);

  const signin = useCallback((next: Session) => {
    setSession(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  }, []);

  const signout = useCallback(() => {
    setSession(null);
    localStorage.removeItem(storageKey);
  }, []);

  return { session, restoreSession, signin, signout };
}
