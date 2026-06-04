import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiFetch } from "../api/client";
import type { CurrentMember } from "../types/member";

const SESSION_KEY = "prestamos_session";

interface AuthState {
  readonly member: CurrentMember | null;
  readonly loading: boolean;
  readonly login: (email: string, password: string) => Promise<void>;
  readonly logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { readonly children: ReactNode }) {
  const [member, setMember] = useState<CurrentMember | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem(SESSION_KEY)) {
      setLoading(false);
      return;
    }
    apiFetch<CurrentMember>("/me")
      .then(setMember)
      .catch(() => {
        localStorage.removeItem(SESSION_KEY);
        setMember(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    await apiFetch<{ ok: boolean }>("/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem(SESSION_KEY, "1");
    const me = await apiFetch<CurrentMember>("/me");
    setMember(me);
  };

  const logout = async () => {
    await apiFetch<{ ok: boolean }>("/logout", { method: "POST" });
    localStorage.removeItem(SESSION_KEY);
    setMember(null);
  };

  return (
    <AuthContext.Provider value={{ member, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
