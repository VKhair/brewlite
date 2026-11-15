
export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: "CUSTOMER" | "STAFF";
}

export interface AuthSession {
  access_token: string;
  token_type: "Bearer";
  user: AuthUser;
}

const AUTH_STORAGE_KEY = "brewLiteAuth";

export function getSession(): AuthSession | null {
  if (typeof window === "undefined") return null;

  try {
    const data = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!data) return null;

    const session = JSON.parse(data) as AuthSession;

    if (!session.access_token || !session.user?.id) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }

    return session;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function getAccessToken(): string | null {
  return getSession()?.access_token ?? null;
}

export function saveSession(session: AuthSession): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event("brewlite-auth-change"));
}

export function clearSession(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  window.dispatchEvent(new Event("brewlite-auth-change"));
}

export function subscribeAuth(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  window.addEventListener("brewlite-auth-change", callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("brewlite-auth-change", callback);
  };
}
