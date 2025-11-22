import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "../lib/supabase";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  organizationId: string | null;
  readyForFetches: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (
    email: string,
    password: string,
    fullName?: string
  ) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [readyForFetches, setReadyForFetches] = useState(false);
  const navigate = useNavigate();

  // Extract organizationId from user metadata
  const organizationId = user?.user_metadata?.organization_id || null;

  useEffect(() => {
    let readyTimer: ReturnType<typeof setTimeout> | null = null;

    const armReadyTimer = (
      newSession: Session | null,
      { immediate }: { immediate: boolean }
    ) => {
      if (readyTimer) {
        clearTimeout(readyTimer);
        readyTimer = null;
      }

      if (!newSession?.access_token) {
        setReadyForFetches(false);
        return;
      }

      if (immediate) {
        setReadyForFetches(true);
        return;
      }

      setReadyForFetches(false);
      readyTimer = setTimeout(() => {
        setReadyForFetches(true);
      }, 5000);
    };

    supabase.auth.getSession().then(({ data }) => {
      const currentSession = data.session ?? null;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
      armReadyTimer(currentSession, { immediate: true });
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        const shouldDelay =
          event === "SIGNED_IN" || event === "TOKEN_REFRESHED";
        armReadyTimer(newSession, { immediate: !shouldDelay });
      }
    );

    return () => {
      listener.subscription.unsubscribe();
      if (readyTimer) {
        clearTimeout(readyTimer);
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error?.message === "Email not confirmed") {
      // Translate Supabase unconfirmed email error to Spanish for better UX
      return {
        error: {
          ...error,
          message:
            "Correo electrónico no confirmado. Revisa tu bandeja de entrada para activarlo.",
        },
      };
    }
    return { error };
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setReadyForFetches(false);
    navigate("/login");
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        organizationId,
        readyForFetches,
        signIn,
        signUp,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
