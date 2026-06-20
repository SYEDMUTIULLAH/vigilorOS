import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export type Role = "admin" | "receptionist" | "doctor" | "lab" | "pharmacy" | "finance" | null;

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  role: Role;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const validRoles = ["admin", "receptionist", "doctor", "lab", "pharmacy", "finance"] as const;

const roleAliases: Record<string, Role> = {
  admin: "admin",
  administrator: "admin",
  reception: "receptionist",
  receptionist: "receptionist",
  doctor: "doctor",
  doctors: "doctor",
  lab: "lab",
  laboratory: "lab",
  pharmacy: "pharmacy",
  pharmacist: "pharmacy",
  finance: "finance",
};

const normalizeRole = (rawRole: string | null | undefined): Role => {
  const normalized = rawRole?.trim().toLowerCase();
  if (!normalized) return null;

  if (normalized === "admin") {
    return "admin";
  }

  if (roleAliases[normalized]) {
    return roleAliases[normalized];
  }

  return validRoles.includes(normalized as (typeof validRoles)[number])
    ? (normalized as Role)
    : null;
};

const fetchRoleForUser = async (user: User | null, session: Session | null): Promise<Role> => {
  if (!user) return null;

  console.log("[AuthContext] session user:", session?.user?.id ?? user.id);

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  console.log("[AuthContext] DB row:", data);
  console.log("[AuthContext] role from DB:", data?.role);

  if (error) {
    console.log("[AuthContext] role fetch error:", error);
    return null;
  }

  if (!data) {
    console.log("[AuthContext] role fetch error: no row returned");
    return null;
  }

  let normalizedRole: Role = null;
  if (data.role === "admin" || data.role?.trim().toLowerCase() === "admin") {
    normalizedRole = "admin";
  } else {
    normalizedRole = normalizeRole(data.role);
  }

  console.log("[AuthContext] normalized role:", normalizedRole);

  return normalizedRole;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initializeSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setSessionLoading(false);
    };

    initializeSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setSessionLoading(false);
    });

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    if (!user) {
      setRole(null);
      setRoleLoading(false);
      return;
    }

    setRoleLoading(true);

    fetchRoleForUser(user, session).then((fetchedRole) => {
      if (!mounted) return;
      setRole(fetchedRole);
      setRoleLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setRole(null);
    setRoleLoading(false);
  };

  const loading = sessionLoading || roleLoading;

  const value = useMemo(
    () => ({
      session,
      user,
      role,
      loading,
      signOut,
    }),
    [session, user, role, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
