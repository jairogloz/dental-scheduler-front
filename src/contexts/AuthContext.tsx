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
    calendarView?: "day" | "week" | "month",
    forceRefresh?: boolean
  ) => Promise<void>; // Updated signature
  // Appointment cache
  appointmentCache: AppointmentCache;
  loadAppointmentsForRange: (startDate: Date, endDate: Date, forceRefresh?: boolean) => Promise<void>;
  getAppointmentsInRange: (startDate: Date, endDate: Date) => Appointment[];
  addAppointmentToCache: (appointment: Appointment) => void;
  removeAppointmentFromCache: (appointmentId: string) => void;
  cancelAppointmentInCache: (appointment: Appointment) => void;
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
  cancelAppointmentInCache: () => {},
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
  // AuthProvider component initialized

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
    calendarView?: "day" | "week" | "month",
    forceRefresh?: boolean
  ) => {
    if (!organizationId) {
      // No organization ID available, skipping organization data load
      return;
    }

    // Clear all caches if force refresh is requested
    if (forceRefresh) {
      console.log(
        "🧹 Force refresh: clearing all caches before loading fresh data"
      );
      setAppointmentCache({
        appointments: new Map(),
        loadedRanges: [],
        lastUpdated: new Date(),
      });
      setOrganizationData(null);
    }

    try {
      setOrganizationLoading(true);
      // Loading organization data

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

      // Loading organization data for calendar view

      const data = await getOrganizationData({
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
        limit: 500, // Increased limit for broader date range
      });

      setOrganizationData(data);

      // Populate appointment cache with organization data
      if (data.appointments && data.appointments.length > 0) {
        console.log(
          `📅 Loading ${data.appointments.length} appointments from organization data`
        );
        const appointments: Appointment[] = data.appointments.map((appt) => ({
          id: appt.id,
          // Organization API might not have patient_id if patient doesn't exist in database
          patientId: appt.patient_id || "",
          doctorId: appt.doctor_id,
          unitId: appt.unit_id,
          start: new Date(appt.start_time),
          end: new Date(appt.end_time),
          treatment: appt.treatment_type,
          // Preserve additional fields from API response
          patient_name: appt.patient_name,
          doctor_name: appt.doctor_name,
          unit_name: appt.unit_name,
          status: appt.status,
        }));

        setAppointmentCache((prev) => {
          const newAppointments = forceRefresh
            ? new Map()
            : new Map(prev.appointments);

          // Add appointments to cache (replace all if force refresh)
          appointments.forEach((appointment) => {
            newAppointments.set(appointment.id, appointment);
          });

          return {
            appointments: newAppointments,
            loadedRanges: forceRefresh
              ? [{ start: startDate, end: endDate }]
              : mergeDateRanges([
                  ...prev.loadedRanges,
                  { start: startDate, end: endDate },
                ]),
            lastUpdated: new Date(),
          };
        });

        console.log(
          `✅ Added ${appointments.length} appointments to cache from organization data`
        );
      } else {
        console.log("📅 No appointments found in organization data");
        if (forceRefresh) {
          // Ensure cache reflects empty state
          setAppointmentCache({
            appointments: new Map(),
            loadedRanges: [{ start: startDate, end: endDate }],
            lastUpdated: new Date(),
          });
        }
      }

      // Organization data loaded successfully
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
    endDate: Date,
    forceRefresh: boolean = false
  ): Promise<void> => {
    // Check if range is already loaded (skip check if force refresh)
    if (!forceRefresh && isRangeLoaded(startDate, endDate)) {
      // Date range already loaded
      return;
    }

    try {
      console.log('🔄 Loading appointments for range:', {
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        forceRefresh,
        currentCacheSize: appointmentCache.appointments.size
      });

      const appointments = await getAppointmentsByDateRange(
        startDate.toISOString().split("T")[0],
        endDate.toISOString().split("T")[0]
      );

      console.log('📥 Received appointments from API:', {
        count: appointments.length,
        appointmentIds: appointments.map(a => a.id)
      });

      setAppointmentCache((prev) => {
        const newAppointments = new Map(prev.appointments);

        // If force refresh, remove appointments that fall within this date range first
        if (forceRefresh) {
          console.log('🧹 Force refresh: clearing appointments in range before adding new ones');
          for (const [id, appointment] of prev.appointments.entries()) {
            // Remove appointments that overlap with the requested range
            if (appointment.start < endDate && appointment.end > startDate) {
              newAppointments.delete(id);
              console.log(`🗑️ Removed stale appointment ${id} from cache`);
            }
          }
        }

        // Add new appointments (ID-based, so duplicates are automatically handled)
        appointments.forEach((appointment) => {
          newAppointments.set(appointment.id, appointment);
        });

        console.log('💾 Cache updated:', {
          previousSize: prev.appointments.size,
          newSize: newAppointments.size,
          addedCount: appointments.length,
          forceRefresh
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

      // Loaded appointments and updated cache
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

    console.log('🔍 Getting appointments from cache:', {
      requestedRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      totalCachedAppointments: appointmentCache.appointments.size
    });

    for (const appointment of appointmentCache.appointments.values()) {
      // Check if appointment overlaps with the requested range
      if (appointment.start < endDate && appointment.end > startDate) {
        appointments.push(appointment);
      }
    }

    console.log('📋 Filtered appointments for range:', {
      count: appointments.length,
      appointmentIds: appointments.map(a => a.id)
    });

    return appointments.sort((a, b) => a.start.getTime() - b.start.getTime());
  };

  const addAppointmentToCache = (appointment: Appointment) => {
    const dayOfWeek = appointment.start.getDay();
    const isSunday = dayOfWeek === 0;
    
    console.log('📝 Adding appointment to cache:', {
      appointmentId: appointment.id,
      start: appointment.start.toISOString(),
      end: appointment.end.toISOString(),
      patientName: appointment.patient_name,
      dayOfWeek,
      dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek],
      isSunday: isSunday
    });

    setAppointmentCache((prev) => {
      const newAppointments = new Map(prev.appointments);
      newAppointments.set(appointment.id, appointment);

      const newCache = {
        ...prev,
        appointments: newAppointments,
        lastUpdated: new Date(),
      };

      console.log('📊 Cache updated:', {
        totalAppointments: newCache.appointments.size,
        loadedRanges: newCache.loadedRanges.length,
        lastUpdated: newCache.lastUpdated
      });

      return newCache;
    });
  };

  const removeAppointmentFromCache = (appointmentId: string) => {
    setAppointmentCache((prev) => {
      const newAppointments = new Map(prev.appointments);
      const removed = newAppointments.delete(appointmentId);

      if (removed) {
        // Appointment removed from cache
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

  const cancelAppointmentInCache = (appointment: Appointment) => {
    setAppointmentCache((prev) => {
      const newAppointments = new Map(prev.appointments);

      // Update the appointment with cancelled status
      newAppointments.set(appointment.id, appointment);

      console.log(
        `🚫 Appointment ${appointment.id} marked as cancelled in cache`
      );

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
    // Initializing AuthContext

    // Get initial session immediately
    const initializeAuth = async () => {
      try {
        // Getting initial session

        // Small delay to ensure Supabase client is fully initialized
        await new Promise((resolve) => setTimeout(resolve, 200));

        // Give Supabase time to initialize and check localStorage
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        // getSession result processed

        if (!isMounted) {
          // Component unmounted, ignoring result
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
          // Organization ID configured
        } else {
          setOrganizationId(null);
        }

        initialCheckComplete = true;
        setLoading(false);

        // Initial session configured
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
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // Auth state change

      if (isMounted) {
        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);

          // Extract organization_id using helper function (with fallback to profiles table)
          if (session?.user) {
            const orgId = await getUserOrganizationId();
            setOrganizationId(orgId);
            // Organization ID configured in auth change
          } else {
            setOrganizationId(null);
          }

          // Only set loading to false if we haven't completed initial check
          if (!initialCheckComplete) {
            // Setting loading to false after auth state change (initial check)
            setLoading(false);
            initialCheckComplete = true;
          } else {
            // Auth state changed after initial check
          }

          clearTimeout(safetyTimeout);
        }
      }
    });

    return () => {
      // Cleaning up AuthContext
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []);

  // Load organization data when organizationId changes
  useEffect(() => {
    if (organizationId && !loading) {
      // Organization ID changed, loading organization data with force refresh
      console.log(
        "🚀 Initial organization data load - forcing fresh data from backend"
      );
      loadOrganizationData(undefined, undefined, true); // Force refresh on initial load
    } else if (!organizationId) {
      // Clear organization data when no organization ID
      setOrganizationData(null);
      setOrganizationLoading(false);
    }
  }, [organizationId, loading]);

  // Proactive token refresh mechanism with user activity detection
  useEffect(() => {
    if (!session?.access_token) return;

    let refreshTimer: NodeJS.Timeout;
    let lastActivity = Date.now();

    const updateLastActivity = () => {
      lastActivity = Date.now();
    };

    const scheduleTokenRefresh = () => {
      // JWT tokens typically expire in 1 hour (3600 seconds)
      // We'll refresh proactively after 45 minutes (2700 seconds) to prevent expiration
      // But we'll check user activity and refresh more frequently if user is active
      const baseRefreshInterval = 45 * 60 * 1000; // 45 minutes in milliseconds
      const activeUserInterval = 30 * 60 * 1000; // 30 minutes for active users

      // Check if user has been active in the last 10 minutes
      const timeSinceActivity = Date.now() - lastActivity;
      const userIsActive = timeSinceActivity < 10 * 60 * 1000; // 10 minutes

      const refreshInterval = userIsActive
        ? activeUserInterval
        : baseRefreshInterval;

      refreshTimer = setTimeout(async () => {
        try {
          const activityStatus = userIsActive ? "active user" : "inactive user";
          console.log(
            `🔄 Proactively refreshing session token for ${activityStatus}`
          );

          const { data, error } = await supabase.auth.refreshSession();

          if (error) {
            console.error("❌ Proactive token refresh failed:", error.message);
            // Try again with a shorter interval on failure
            setTimeout(scheduleTokenRefresh, 5 * 60 * 1000); // 5 minutes
          } else if (data.session) {
            console.log("✅ Session token refreshed successfully");
            // The onAuthStateChange listener will handle updating the session state
            // Schedule the next refresh
            scheduleTokenRefresh();
          }
        } catch (error) {
          console.error("❌ Error during proactive token refresh:", error);
          // Try again with a shorter interval on error
          setTimeout(scheduleTokenRefresh, 5 * 60 * 1000); // 5 minutes
        }
      }, refreshInterval);
    };

    // Track user activity
    const activityEvents = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];
    activityEvents.forEach((event) => {
      document.addEventListener(event, updateLastActivity, true);
    });

    scheduleTokenRefresh();

    return () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
      // Remove activity listeners
      activityEvents.forEach((event) => {
        document.removeEventListener(event, updateLastActivity, true);
      });
    };
  }, [session?.access_token]);

  const signIn = async (
    email: string,
    password: string,
    rememberMe: boolean = false
  ) => {
    // Executing signIn in AuthContext

    const result = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Supabase signIn result processed

    // Current AuthContext state after signIn processed

    // Set session persistence if rememberMe is true
    if (result.data.session && rememberMe) {
      // The session will be persisted by default, we can manage this on the client side
      localStorage.setItem("rememberMe", "true");
      // rememberMe saved
    } else {
      localStorage.removeItem("rememberMe");
      // rememberMe removed
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

  // Development helper: clear all caches (expose to window for console access)
  const clearAllCaches = () => {
    console.log("🧹 Clearing all appointment caches...");
    setAppointmentCache({
      appointments: new Map(),
      loadedRanges: [],
      lastUpdated: new Date(),
    });
    setOrganizationData(null);
    console.log("✅ All caches cleared");
  };

  // Expose cache clearing function to window for development
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).clearAppointmentCache = clearAllCaches;
    }
  }, []);

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
    cancelAppointmentInCache,
    signIn,
    signUp,
    signOut,
    resetPassword,
    userProfile,
    loadingProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
