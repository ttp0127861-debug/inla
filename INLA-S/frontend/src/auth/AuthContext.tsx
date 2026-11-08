import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  cognitoConfirmPassword,
  cognitoSignIn,
  cognitoSignOut,
  currentUser,
  type AuthUser,
} from "./cognito";

type AuthStatus = "loading" | "authenticated" | "anonymous";

type PasswordSignInResult = { step: "done"; groups: string[] } | { step: "new-password" };

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  signInWithPassword: (email: string, password: string) => Promise<PasswordSignInResult>;
  completeNewPassword: (password: string) => Promise<string[]>;
  signOutUser: () => Promise<void>;
  clearSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let active = true;
    currentUser()
      .then((next) => {
        if (!active) return;
        setUser(next);
        setStatus(next ? "authenticated" : "anonymous");
      })
      .catch(() => {
        if (!active) return;
        setUser(null);
        setStatus("anonymous");
      });
    return () => {
      active = false;
    };
  }, []);

  const clearSession = useCallback(async () => {
    setUser(null);
    setStatus("anonymous");
    try {
      await cognitoSignOut();
    } catch {
      /* Cognito session may already be gone */
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      clearSession,
      async signInWithPassword(email, password) {
        const result = await cognitoSignIn(email, password);
        if (result.step === "new-password") return { step: "new-password" };
        setUser(result.user);
        setStatus("authenticated");
        return { step: "done", groups: result.user.groups };
      },
      async completeNewPassword(password) {
        const next = await cognitoConfirmPassword(password);
        setUser(next);
        setStatus("authenticated");
        return next.groups;
      },
      async signOutUser() {
        await clearSession();
      },
    }),
    [clearSession, status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}

export function useSignOutAction(): () => void {
  const { signOutUser } = useAuth();
  const navigate = useNavigate();
  return () => {
    void signOutUser().finally(() => navigate("/", { replace: true }));
  };
}
