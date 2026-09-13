import type { Session } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import { AppState } from "react-native";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { extractAuthCode, extractSessionTokens } from "./auth-deep-link";
import { supabase } from "./supabase";

interface AuthContextValue {
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function consumeAuthLink(url: string | null): Promise<void> {
  if (!url) return;
  const tokens = extractSessionTokens(url);
  if (tokens) {
    await supabase.auth.setSession({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    });
    return;
  }

  const code = extractAuthCode(url);
  if (code) await supabase.auth.exchangeCodeForSession(code);
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void Linking.getInitialURL().then(consumeAuthLink).finally(() => {
      void supabase.auth.getSession().then(({ data }) => {
        if (active) {
          setSession(data.session);
          setIsLoading(false);
        }
      });
    });

    const authSubscription = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) {
        setSession(nextSession);
        setIsLoading(false);
      }
    });
    const linkSubscription = Linking.addEventListener("url", ({ url }) => {
      void consumeAuthLink(url);
    });
    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    });

    return () => {
      active = false;
      authSubscription.data.subscription.unsubscribe();
      linkSubscription.remove();
      appStateSubscription.remove();
    };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const value = useMemo(() => ({ session, isLoading, signOut }), [session, isLoading, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
