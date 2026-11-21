"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useCartState } from "@/features/cart/use-cart-state";
import { useSessionState } from "@/features/auth/use-session-state";

type AppStore = Omit<ReturnType<typeof useCartState>, "restoreCart"> &
  Omit<ReturnType<typeof useSessionState>, "restoreSession"> & {
    ready: boolean;
  };

const AppStoreContext = createContext<AppStore | null>(null);

export function AppProviders({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const { restoreCart, ...cart } = useCartState(ready);
  const { restoreSession, ...auth } = useSessionState();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        restoreCart();
        restoreSession();
      } catch (error) {
        console.error("Cannot restore BrewLite data:", error);
      } finally {
        setReady(true);
      }
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [restoreCart, restoreSession]);

  return (
    <AppStoreContext.Provider value={{ ...cart, ...auth, ready }}>
      {children}
    </AppStoreContext.Provider>
  );
}

export function useAppStore() {
  const store = useContext(AppStoreContext);
  if (!store) throw new Error("AppProviders missing");
  return store;
}
