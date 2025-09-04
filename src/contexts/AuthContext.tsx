import { createContext, useContext, useEffect, useState } from "react";
import type { User, AuthError, Session } from "@supabase/supabase-js";
import { supabase, type UserProfile } from "../lib/supabase";
import {
  getUserOrganizationId,
  debugProfilesTable,
} from "../lib/organizationUtils";
import {
  getOrganizationData,
  type OrganizationData,
} from "../api/entities/Organization";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  organizationId: string | null;
  organizationData: OrganizationData | null; // Add organization data
  organizationLoading: boolean; // Add loading state for organization data
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

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  organizationId: null,
  organizationData: null, // Add organization data default
  organizationLoading: false, // Add organization loading default
  signIn: async () => ({ data: null, error: null }),
  signUp: async () => ({ data: null, error: null }),
  signOut: async () => ({ error: null }),
  resetPassword: async () => ({ data: null, error: null }),
  userProfile: null,
  loadingProfile: true,
});

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
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Add organization data state
  const [organizationData, setOrganizationData] =
    useState<OrganizationData | null>(null);
  const [organizationLoading, setOrganizationLoading] = useState(false);

  // Function to load organization data
  const loadOrganizationData = async () => {
    if (!organizationId) {
      console.log(
        "📋 No organization ID available, skipping organization data load"
      );
      return;
    }

    try {
      setOrganizationLoading(true);
      console.log("📋 Loading organization data...");

      // Load organization data for current week by default
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - startDate.getDay()); // Start of week
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + (6 - endDate.getDay())); // End of week

      const data = await getOrganizationData({
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
        limit: 100, // Load more appointments for better coverage
      });
      console.log(data);

      setOrganizationData(data);
      console.log("✅ Organization data loaded successfully:", {
        organization: data.organization.name,
        clinics: data.clinics.length,
        units: data.units.length,
        doctors: data.doctors.length,
        appointments: data.appointments ? data.appointments.length : 0,
      });
    } catch (error) {
      console.error("❌ Failed to load organization data:", error);
      setOrganizationData(null);
    } finally {
      setOrganizationLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let initialCheckComplete = false;
    console.log("🚀 Iniciando AuthContext...");

    // Get initial session immediately
    const initializeAuth = async () => {
      try {
        console.log("🔍 Obteniendo sesión inicial...");

        // Small delay to ensure Supabase client is fully initialized
        await new Promise((resolve) => setTimeout(resolve, 200));

        // Give Supabase time to initialize and check localStorage
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        console.log("📊 Resultado getSession:", {
          hasSession: !!session,
          hasUser: !!session?.user,
          userId: session?.user?.id,
          accessToken: session?.access_token ? "presente" : "ausente",
          error: error?.message,
        });

        if (!isMounted) {
          console.log("🚫 Componente desmontado, ignorando resultado");
          return;
        }

        if (error) {
          console.error("❌ Error getting session:", error);
        }

        setSession(session);
        setUser(session?.user ?? null);

        // Extract organization_id using helper function (with fallback to profiles table)
        if (session?.user) {
          // Debug profiles table access on first login
          await debugProfilesTable();

          const orgId = await getUserOrganizationId();
          setOrganizationId(orgId);
          console.log("🏢 Organization ID configurado:", orgId);
        } else {
          setOrganizationId(null);
        }

        initialCheckComplete = true;
        setLoading(false);

        console.log(
          "✅ Sesión inicial configurada",
          session ? "con usuario" : "sin usuario"
        );
      } catch (error) {
        console.error("💥 Error obteniendo sesión inicial:", error);
        if (isMounted) {
          setSession(null);
          setUser(null);
          initialCheckComplete = true;
          setLoading(false);
        }
      }
    };

    // Longer safety timeout to account for slow networks/devices
    const safetyTimeout = setTimeout(() => {
      if (isMounted && !initialCheckComplete) {
        console.warn("⏰ Timeout de seguridad activado - finalizando carga");
        setLoading(false);
        initialCheckComplete = true;
      }
    }, 8000); // 8 seconds timeout

    initializeAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 Auth state change:", event, {
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
      });

      if (isMounted) {
        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);

          // Extract organization_id using helper function (with fallback to profiles table)
          if (session?.user) {
            const orgId = await getUserOrganizationId();
            setOrganizationId(orgId);
            console.log(
              "🏢 Organization ID configurado en auth change:",
              orgId
            );
          } else {
            setOrganizationId(null);
          }

          // Only set loading to false if we haven't completed initial check
          if (!initialCheckComplete) {
            setLoading(false);
            initialCheckComplete = true;
          }

          clearTimeout(safetyTimeout);
        }
      }
    });

    return () => {
      console.log("🧹 Limpiando AuthContext...");
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []);

  // Load organization data when organizationId changes
  useEffect(() => {
    if (organizationId && !loading) {
      console.log("🔄 Organization ID changed, loading organization data...");
      loadOrganizationData();
    } else if (!organizationId) {
      // Clear organization data when no organization ID
      setOrganizationData(null);
      setOrganizationLoading(false);
    }
  }, [organizationId, loading]);

  const signIn = async (
    email: string,
    password: string,
    rememberMe: boolean = false
  ) => {
    console.log("🔐 Ejecutando signIn en AuthContext...");

    const result = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log("📊 Resultado de Supabase signIn:", {
      hasData: !!result.data,
      hasSession: !!result.data?.session,
      hasUser: !!result.data?.user,
      error: result.error,
    });

    // Set session persistence if rememberMe is true
    if (result.data.session && rememberMe) {
      // The session will be persisted by default, we can manage this on the client side
      localStorage.setItem("rememberMe", "true");
      console.log("💾 Guardando rememberMe en localStorage");
    } else {
      localStorage.removeItem("rememberMe");
      console.log("🗑️ Eliminando rememberMe de localStorage");
    }

    return result;
  };

  const signUp = async (
    email: string,
    password: string,
    fullName?: string,
    organizationId?: string
  ) => {
    const result = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          organization_id: organizationId, // Add organization_id to user metadata
        },
      },
    });

    // If signup is successful, create a profile
    if (result.data.user && !result.error) {
      try {
        const { error: profileError } = await supabase.from("profiles").insert({
          id: result.data.user.id,
          email: result.data.user.email!,
          full_name: fullName || null,
          org_id: organizationId || null, // Store in profiles table too for queries
          roles: ["receptionist"], // Default role as array
        });

        if (profileError) {
          if (profileError.code === "PGRST205") {
            console.warn(
              "Profiles table not found. Please run the auth_setup.sql script in your Supabase dashboard."
            );
          } else {
            console.error("Error creating profile:", profileError);
          }
        }
      } catch (error) {
        console.error("Error creating profile:", error);
      }
    }

    return result;
  };

  const signOut = async () => {
    setUserProfile(null);
    setOrganizationId(null); // Clear organization_id on logout
    setOrganizationData(null); // Clear organization data on logout
    setOrganizationLoading(false); // Reset loading state
    return await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    organizationId,
    organizationData, // Add organization data to context value
    organizationLoading, // Add organization loading to context value
    signIn,
    signUp,
    signOut,
    resetPassword,
    userProfile,
    loadingProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
