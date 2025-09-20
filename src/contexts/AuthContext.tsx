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
import {
  getAppointmentsByDateRange,
  type Appointment,
} from "../api/entities/Appointment";

// Types for appointment caching
export type DateRange = {
  start: Date;
  end: Date;
};

export type AppointmentCache = {
  appointments: Map<string, Appointment>; // ID-based keying for easy updates
  loadedRanges: DateRange[]; // Track which date ranges we've loaded
  lastUpdated: Date; // For cache invalidation
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  organizationId: string | null;
  organizationData: OrganizationData | null; // Add organization data
  organizationLoading: boolean; // Add loading state for organization data
  loadOrganizationData: (
    calendarDate?: Date,
    calendarView?: "day" | "week" | "month"
  ) => Promise<void>; // Updated signature
  // Appointment cache
  appointmentCache: AppointmentCache;
  loadAppointmentsForRange: (startDate: Date, endDate: Date) => Promise<void>;
  getAppointmentsInRange: (startDate: Date, endDate: Date) => Appointment[];
  addAppointmentToCache: (appointment: Appointment) => void;
  removeAppointmentFromCache: (appointmentId: string) => void;
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
  loadOrganizationData: async () => {}, // Add default
  // Appointment cache defaults
  appointmentCache: {
    appointments: new Map(),
    loadedRanges: [],
    lastUpdated: new Date(),
  },
  loadAppointmentsForRange: async () => {},
  getAppointmentsInRange: () => [],
  addAppointmentToCache: () => {},
  removeAppointmentFromCache: () => {},
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
  console.log("🚀 AuthProvider component initialized");

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

  // Add appointment cache state
  const [appointmentCache, setAppointmentCache] = useState<AppointmentCache>({
    appointments: new Map(),
    loadedRanges: [],
    lastUpdated: new Date(),
  });

  // Function to load organization data with calendar view support
  const loadOrganizationData = async (
    calendarDate?: Date,
    calendarView?: "day" | "week" | "month"
  ) => {
    if (!organizationId) {
      console.log(
        "📋 No organization ID available, skipping organization data load"
      );
      return;
    }

    try {
      setOrganizationLoading(true);
      console.log("📋 Loading organization data...");

      // Calculate date range based on calendar view with buffer
      let startDate: Date, endDate: Date;
      const baseDate = calendarDate || new Date();

      if (calendarView === "day") {
        // Day view: load current day + 1 week buffer on each side
        startDate = new Date(baseDate);
        startDate.setDate(startDate.getDate() - 7); // 1 week before
        endDate = new Date(baseDate);
        endDate.setDate(endDate.getDate() + 7); // 1 week after
      } else if (calendarView === "month") {
        // Month view: load current month + 1 week buffer on each side
        startDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
        startDate.setDate(startDate.getDate() - 7); // 1 week before month start
        endDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
        endDate.setDate(endDate.getDate() + 7); // 1 week after month end
      } else {
        // Week view (default): load current week + 1 week buffer on each side
        startDate = new Date(baseDate);
        startDate.setDate(startDate.getDate() - baseDate.getDay() - 7); // Start of week - 1 week
        endDate = new Date(baseDate);
        endDate.setDate(endDate.getDate() + (6 - baseDate.getDay()) + 7); // End of week + 1 week
      }

      console.log(
        `📋 Loading organization data for ${calendarView || "week"} view:`,
        {
          baseDate: baseDate.toISOString().split("T")[0],
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
        }
      );

      const data = await getOrganizationData({
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
        limit: 500, // Increased limit for broader date range
      });

      setOrganizationData(data);

      // Populate appointment cache with organization data
      if (data.appointments && data.appointments.length > 0) {
        const appointments: Appointment[] = data.appointments.map((appt) => ({
          id: appt.id,
          patientId: appt.patient_id,
          doctorId: appt.doctor_id,
          unitId: appt.unit_id,
          start: new Date(appt.start_time),
          end: new Date(appt.end_time),
          treatment: appt.treatment_type,
        }));

        setAppointmentCache((prev) => {
          const newAppointments = new Map(prev.appointments);

          // Add appointments to cache
          appointments.forEach((appointment) => {
            newAppointments.set(appointment.id, appointment);
          });

          return {
            appointments: newAppointments,
            loadedRanges: mergeDateRanges([
              ...prev.loadedRanges,
              { start: startDate, end: endDate },
            ]),
            lastUpdated: new Date(),
          };
        });

        console.log(
          `✅ Added ${appointments.length} appointments to cache from organization data`
        );
      }

      console.log("✅ Organization data loaded successfully:", {
        organization: data.organization.name,
        clinics: data.clinics.length,
        units: data.units.length,
        doctors: data.doctors.length,
        appointments: data.appointments ? data.appointments.length : 0,
        cacheSize: appointmentCache.appointments.size,
      });
    } catch (error) {
      console.error("❌ Failed to load organization data:", error);
      setOrganizationData(null);
    } finally {
      setOrganizationLoading(false);
    }
  };

  // Appointment cache utility functions
  const isRangeLoaded = (startDate: Date, endDate: Date): boolean => {
    return appointmentCache.loadedRanges.some(
      (range) => range.start <= startDate && range.end >= endDate
    );
  };

  const mergeDateRanges = (ranges: DateRange[]): DateRange[] => {
    if (ranges.length <= 1) return ranges;

    const sorted = ranges.sort((a, b) => a.start.getTime() - b.start.getTime());
    const merged: DateRange[] = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i];
      const last = merged[merged.length - 1];

      if (current.start <= last.end) {
        last.end = new Date(
          Math.max(last.end.getTime(), current.end.getTime())
        );
      } else {
        merged.push(current);
      }
    }

    return merged;
  };

  const cleanupOldRanges = () => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    setAppointmentCache((prev) => {
      const newAppointments = new Map(prev.appointments);
      const validRanges: DateRange[] = [];

      // Remove appointments older than 6 months
      for (const [id, appointment] of newAppointments) {
        if (appointment.start < sixMonthsAgo) {
          newAppointments.delete(id);
        }
      }

      // Keep only ranges that are within 6 months
      for (const range of prev.loadedRanges) {
        if (range.end >= sixMonthsAgo) {
          validRanges.push(range);
        }
      }

      return {
        appointments: newAppointments,
        loadedRanges: mergeDateRanges(validRanges),
        lastUpdated: new Date(),
      };
    });
  };

  const loadAppointmentsForRange = async (
    startDate: Date,
    endDate: Date
  ): Promise<void> => {
    // Check if range is already loaded
    if (isRangeLoaded(startDate, endDate)) {
      console.log(
        `📋 Date range ${startDate.toISOString().split("T")[0]} to ${
          endDate.toISOString().split("T")[0]
        } already loaded`
      );
      return;
    }

    try {
      console.log(
        `📋 Loading appointments for range: ${
          startDate.toISOString().split("T")[0]
        } to ${endDate.toISOString().split("T")[0]}`
      );

      const appointments = await getAppointmentsByDateRange(
        startDate.toISOString().split("T")[0],
        endDate.toISOString().split("T")[0]
      );

      setAppointmentCache((prev) => {
        const newAppointments = new Map(prev.appointments);

        // Add new appointments (ID-based, so duplicates are automatically handled)
        appointments.forEach((appointment) => {
          newAppointments.set(appointment.id, appointment);
        });

        return {
          appointments: newAppointments,
          loadedRanges: mergeDateRanges([
            ...prev.loadedRanges,
            { start: startDate, end: endDate },
          ]),
          lastUpdated: new Date(),
        };
      });

      console.log(
        `✅ Loaded ${appointments.length} appointments. Cache now has ${
          appointmentCache.appointments.size + appointments.length
        } total appointments`
      );
    } catch (error) {
      console.error("❌ Failed to load appointments for range:", error);
      throw error;
    }
  };

  const getAppointmentsInRange = (
    startDate: Date,
    endDate: Date
  ): Appointment[] => {
    const appointments: Appointment[] = [];

    for (const appointment of appointmentCache.appointments.values()) {
      // Check if appointment overlaps with the requested range
      if (appointment.start < endDate && appointment.end > startDate) {
        appointments.push(appointment);
      }
    }

    return appointments.sort((a, b) => a.start.getTime() - b.start.getTime());
  };

  const addAppointmentToCache = (appointment: Appointment) => {
    setAppointmentCache((prev) => {
      const newAppointments = new Map(prev.appointments);
      newAppointments.set(appointment.id, appointment);

      return {
        ...prev,
        appointments: newAppointments,
        lastUpdated: new Date(),
      };
    });

    console.log(`✅ Added appointment ${appointment.id} to cache`);
  };

  const removeAppointmentFromCache = (appointmentId: string) => {
    setAppointmentCache((prev) => {
      const newAppointments = new Map(prev.appointments);
      const removed = newAppointments.delete(appointmentId);

      if (removed) {
        console.log(`✅ Removed appointment ${appointmentId} from cache`);
      } else {
        console.warn(`⚠️ Appointment ${appointmentId} not found in cache`);
      }

      return {
        ...prev,
        appointments: newAppointments,
        lastUpdated: new Date(),
      };
    });
  };

  // Cleanup old cache data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      cleanupOldRanges();
    }, 10 * 60 * 1000); // Every 10 minutes

    return () => clearInterval(interval);
  }, []);

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
            console.log(
              "🔄 Setting loading to false after auth state change (initial check)"
            );
            setLoading(false);
            initialCheckComplete = true;
          } else {
            console.log(
              "🔄 Auth state changed but initial check already complete, loading state:",
              loading
            );
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
      userId: result.data?.user?.id,
      userEmail: result.data?.user?.email,
      error: result.error?.message,
    });

    console.log("📊 Current AuthContext state after signIn:", {
      currentUser: user?.id,
      currentSession: !!session,
      currentLoading: loading,
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
    loadOrganizationData, // Add loadOrganizationData function
    // Appointment cache
    appointmentCache,
    loadAppointmentsForRange,
    getAppointmentsInRange,
    addAppointmentToCache,
    removeAppointmentFromCache,
    signIn,
    signUp,
    signOut,
    resetPassword,
    userProfile,
    loadingProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
