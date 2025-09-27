import { createContext, useContext, useEffect, useState, useMemo } from "react";
import type { User, AuthError, Session } from "@supabase/supabase-js";
import { supabase, type UserProfile } from "../lib/supabase";
import { tokenManager } from "../lib/tokenManager";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  organizationId: string | null;
  signIn: (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<{ data: any; error: AuthError | null }>;
  signUp: (
    email: string,
    password: string,
    fullName?: string,
    organizationId?: string
  ) => Promise<{ data: any; error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (
    email: string
  ) => Promise<{ data: any; error: AuthError | null }>;
  userProfile: UserProfile | null;
  loadingProfile: boolean;
}

// Default context value
const defaultContext: AuthContextType = {
  user: null,
  session: null,
  loading: true,
  organizationId: null,
  signIn: async () => ({ data: null, error: null }),
  signUp: async () => ({ data: null, error: null }),
  signOut: async () => ({ error: null }),
  resetPassword: async () => ({ data: null, error: null }),
  userProfile: null,
  loadingProfile: true,
};

const AuthContext = createContext<AuthContextType>(defaultContext);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile] = useState<UserProfile | null>(null);
  const [loadingProfile] = useState(false);

  // Extract organizationId from user metadata (memoized to prevent re-renders)
  const organizationId = useMemo(() => {
    return user?.user_metadata?.organization_id || null;
  }, [user?.user_metadata?.organization_id]);

  // Initialize auth state
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // Small delay to ensure Supabase client is fully initialized
        await new Promise((resolve) => setTimeout(resolve, 200));

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("❌ Error getting initial session:", error);
          return;
        }

        if (isMounted) {
          setSession(session);
          setUser(session?.user || null);
          console.log("✅ Initial auth state loaded:", {
            hasSession: !!session,
            userId: session?.user?.id,
            organizationId: session?.user?.user_metadata?.organization_id,
          });
        }
      } catch (error) {
        console.error("❌ Error initializing auth:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 Auth state change:", { event, hasSession: !!session });

      if (isMounted) {
        setSession(session);
        setUser(session?.user || null);

        // Clear API token cache on sign out
        if (event === "SIGNED_OUT") {
          await tokenManager.signOut();
          console.log("🧹 Cleared token cache on sign out");
        }

        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Auth methods
  const signIn = async (
    email: string,
    password: string,
    _rememberMe = false
  ) => {
    setLoading(true);
    console.log("🔐 Attempting sign in for:", email);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("❌ Sign in error:", error);
        return { data: null, error };
      }

      console.log("✅ Sign in successful");
      return { data, error: null };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName?: string,
    organizationId?: string
  ) => {
    setLoading(true);
    console.log("📝 Attempting sign up for:", email);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            organization_id: organizationId,
          },
        },
      });

      if (error) {
        console.error("❌ Sign up error:", error);
        return { data: null, error };
      }

      console.log("✅ Sign up successful");
      return { data, error: null };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    console.log("🚪 Signing out");
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("❌ Sign out error:", error);
    } else {
      console.log("✅ Sign out successful");
    }

    return { error };
  };

  const resetPassword = async (email: string) => {
    console.log("🔄 Requesting password reset for:", email);

    const { data, error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      console.error("❌ Password reset error:", error);
    } else {
      console.log("✅ Password reset email sent");
    }

    return { data, error };
  };

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(
    (): AuthContextType => ({
      user,
      session,
      loading,
      organizationId,
      signIn,
      signUp,
      signOut,
      resetPassword,
      userProfile,
      loadingProfile,
    }),
    [user, session, loading, organizationId, userProfile, loadingProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
