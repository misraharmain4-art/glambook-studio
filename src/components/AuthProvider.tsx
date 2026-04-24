import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "artist" | "customer";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  role: AppRole | null;
  roles: AppRole[];
  loading: boolean;
  roleLoading: boolean;
  signOut: () => Promise<void>;
  refreshRoles: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  role: null,
  roles: [],
  loading: true,
  roleLoading: true,
  signOut: async () => {},
  refreshRoles: async () => {},
});

const ROLE_PRIORITY: AppRole[] = ["admin", "artist", "customer"];

function pickPrimary(roles: AppRole[]): AppRole | null {
  for (const r of ROLE_PRIORITY) if (roles.includes(r)) return r;
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [roleLoading, setRoleLoading] = useState(true);

  const fetchRoles = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setRoles([]);
      setRoleLoading(false);
      return;
    }
    setRoleLoading(true);
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (!error && data) {
      setRoles(data.map((r) => r.role as AppRole));
    } else {
      setRoles([]);
    }
    setRoleLoading(false);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoading(false);
      // Defer DB call to avoid deadlocks inside auth callback
      setTimeout(() => fetchRoles(newSession?.user?.id), 0);
    });

    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      setSession(existing);
      setLoading(false);
      fetchRoles(existing?.user?.id);
    });

    return () => subscription.unsubscribe();
  }, [fetchRoles]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setRoles([]);
  };

  const refreshRoles = useCallback(async () => {
    await fetchRoles(session?.user?.id);
  }, [fetchRoles, session?.user?.id]);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        role: pickPrimary(roles),
        roles,
        loading,
        roleLoading,
        signOut,
        refreshRoles,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function dashboardPathForRole(role: AppRole | null): string {
  if (role === "admin") return "/dashboard/admin";
  if (role === "artist") return "/dashboard/artist";
  return "/dashboard/customer";
}
