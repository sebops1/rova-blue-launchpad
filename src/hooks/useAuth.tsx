import type { Session, User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";

export type AppRole = "founder_admin" | "operations" | "finance" | "viewer";

type AuthValue = {
  session: Session | null;
  user: User | null;
  role: AppRole | null;
  loading: boolean;
  canEdit: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue>({
  session: null,
  user: null,
  role: null,
  loading: true,
  canEdit: false,
  isAdmin: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const bootstrap = useCallback(async () => {
    const { data, error } = await supabase.rpc("ensure_profile", {});
    if (!error && data) setRole(data as AppRole);
  }, []);

  useEffect(() => {
    let active = true;

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      if (!active) return;
      setSession(next);
      if (event === "SIGNED_OUT") {
        setRole(null);
        queryClient.clear();
        return;
      }
      if (next && (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "USER_UPDATED")) {
        setTimeout(() => {
          void bootstrap();
        }, 0);
      }
    });

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
      if (data.session) void bootstrap();
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [bootstrap, queryClient]);

  const signOut = useCallback(async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  }, [navigate, queryClient]);

  const value = useMemo<AuthValue>(
    () => ({
      session,
      user: session?.user ?? null,
      role,
      loading,
      canEdit: role === "founder_admin" || role === "operations" || role === "finance",
      isAdmin: role === "founder_admin",
      signOut,
    }),
    [session, role, loading, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
