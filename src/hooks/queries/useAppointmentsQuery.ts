import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addDays } from "date-fns";
import { useMemo } from "react";
import { 
  getAppointmentsByDateRange, 
  createAppointment,
  type Appointment 
} from "../../api/entities/Appointment";
import { useAuth } from "../../contexts/AuthContext";
import { useOrganizationQuery } from "./useOrganizationQuery";

/**
 * TanStack Query hook for appointments within a date range
 * Replaces the custom appointment cache system in AuthContext
 * 
 * Features:
 * - Automatic caching with intelligent cache keys
 * - Background refetch for real-time updates
 * - Optimistic updates for mutations
 * - Automatic cache invalidation
 */
export const useAppointmentsQuery = (startDate: Date, endDate: Date) => {
  const { organizationId } = useAuth();

  // Create stable cache key based on date range and organization
  const cacheKey = [
    "appointments",
    organizationId,
    format(startDate, "yyyy-MM-dd"),
    format(endDate, "yyyy-MM-dd"),
  ];

  return useQuery<Appointment[], Error>({
    queryKey: cacheKey,
    
    queryFn: async (): Promise<Appointment[]> => {
      if (!organizationId) {
        throw new Error("No organization ID available");
      }
      // Convert dates to strings as expected by the API
      const startStr = format(startDate, "yyyy-MM-dd");
      // Add 1 day to endDate to ensure we capture all appointments on the last day
      // Backend interprets "2025-10-05" as midnight start of that day, not end
      const endDatePlusOne = addDays(endDate, 1);
      const endStr = format(endDatePlusOne, "yyyy-MM-dd");
      const appointments = await getAppointmentsByDateRange(startStr, endStr);
      return appointments;
    },
    
    // Only run when we have organizationId and valid dates
    enabled: !!organizationId && startDate <= endDate,
    
    // Appointments change frequently - refresh every 2 minutes
    staleTime: 2 * 60 * 1000,
    
    // Keep cached for 10 minutes after unmount
    gcTime: 10 * 60 * 1000,
    
    // Refetch on focus to ensure fresh data
    refetchOnWindowFocus: true,
    
    // Poll for updates every 2 minutes when tab is visible
    refetchInterval: 2 * 60 * 1000,
    refetchIntervalInBackground: false,
    
    // Retry network errors
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors (client errors)
      if (error.message.includes('4')) return false;
      return failureCount < 3;
    },
    
    meta: {
      errorMessage: "Failed to load appointments",
    },
  });
};

/**
 * Hook for creating new appointments with optimistic updates
 */
export const useCreateAppointment = () => {
  const queryClient = useQueryClient();
  const { organizationId } = useAuth();

  return useMutation({
    mutationFn: (newAppointment: Omit<Appointment, "id">) => createAppointment(newAppointment),
    
    // Optimistic update - immediately add to cache
    onMutate: async (newAppointment) => {
      // Cancel outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({
        queryKey: ["appointments", organizationId],
      });

      // Snapshot previous value for rollback
      const previousAppointments = queryClient.getQueriesData({
        queryKey: ["appointments", organizationId],
      });

      // Optimistically update relevant cache entries
      queryClient.setQueriesData(
        { queryKey: ["appointments", organizationId] },
        (old: Appointment[] | undefined) => {
          if (!old) return [{ ...newAppointment, id: "temp-" + Date.now() }];
          return [...old, { ...newAppointment, id: "temp-" + Date.now() }];
        }
      );

      return { previousAppointments };
    },
    
    // On success, invalidate and refetch
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["appointments", organizationId],
        refetchType: 'all', // Refetch both active and inactive queries
      });
    },
    
    // On error, rollback optimistic update
    onError: (_error, _newAppointment, context) => {
      if (context?.previousAppointments) {
        context.previousAppointments.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
  });
};

/**
 * Hook for cancelling appointments with optimistic updates
 */
export const useCancelAppointment = () => {
  const queryClient = useQueryClient();
  const { organizationId } = useAuth();

  return useMutation({
    mutationFn: async (appointment: Appointment) => {
      // This would typically call an API to cancel the appointment
      // For now, we'll just update the status locally
      return { ...appointment, status: "cancelled" as const };
    },
    
    // Optimistic update
    onMutate: async (appointmentToCancel) => {
      await queryClient.cancelQueries({
        queryKey: ["appointments", organizationId],
      });

      const previousAppointments = queryClient.getQueriesData({
        queryKey: ["appointments", organizationId],
      });

      // Update all relevant cache entries
      queryClient.setQueriesData(
        { queryKey: ["appointments", organizationId] },
        (old: Appointment[] | undefined) => {
          if (!old) return [];
          return old.map(apt => 
            apt.id === appointmentToCancel.id 
              ? { ...apt, status: "cancelled" as const }
              : apt
          );
        }
      );

      return { previousAppointments };
    },
    
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["appointments", organizationId],
      });
    },
    
    // On error, rollback optimistic update
    onError: (_error, _appointmentToCancel, context) => {
      if (context?.previousAppointments) {
        context.previousAppointments.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
  });
};

/**
 * Hook for updating appointments with cache invalidation
 */
export const useUpdateAppointment = () => {
  const queryClient = useQueryClient();
  const { organizationId } = useAuth();

  return useMutation({
    mutationFn: (params: { id: string; [key: string]: any }) => 
      import("../../api/entities/Appointment").then(module => 
        module.updateAppointment(params.id, params)
      ),
    
    onSuccess: () => {
      // Invalidate appointments queries to refetch fresh data
      queryClient.invalidateQueries({
        queryKey: ["appointments", organizationId],
        refetchType: 'all', // Refetch both active and inactive queries
      });
    },
  });
};

/**
 * Hook for canceling appointments with cache invalidation  
 */
export const useCancelAppointmentMutation = () => {
  const queryClient = useQueryClient();
  const { organizationId } = useAuth();

  return useMutation({
    mutationFn: (appointmentId: string) => 
      import("../../api/entities/Appointment").then(module => 
        module.cancelAppointment(appointmentId)
      ),
    
    onSuccess: () => {
      // Invalidate appointments queries to refetch fresh data
      queryClient.invalidateQueries({
        queryKey: ["appointments", organizationId],
        refetchType: 'all', // Refetch both active and inactive queries
      });
    },
  });
};

/**
 * Utility hook to get appointments within a date range with filtering
 * Replaces the getAppointmentsInRange function from AuthContext
 */
export const useFilteredAppointments = (
  startDate: Date,
  endDate: Date,
  selectedClinicIds: string[] = [],
  selectedDoctorIds: string[] = [],
  excludeCancelled = true
) => {
  const { data: appointments = [], isLoading, error } = useAppointmentsQuery(startDate, endDate);
  const { data: organizationData } = useOrganizationQuery();

  // Filter and transform appointments
  const filteredAppointments = useMemo(() => {
    if (!appointments || !organizationData) return [];

    const filtered = appointments.filter((appointment) => {
      // Exclude cancelled appointments if requested
      if (excludeCancelled && appointment.status === "cancelled") {
        return false;
      }

      // Filter by selected clinics if specified
      if (selectedClinicIds.length > 0) {
        const unit = organizationData.units.find(u => u.id === appointment.unitId);
        if (!unit || !selectedClinicIds.includes(unit.clinic_id)) {
          return false;
        }
      }

      // Filter by selected doctors if specified
      if (selectedDoctorIds.length > 0) {
        if (!selectedDoctorIds.includes(appointment.doctorId)) {
          return false;
        }
      }

      return true;
    });

    return filtered;
  }, [appointments, organizationData, selectedClinicIds, selectedDoctorIds, excludeCancelled]);

  return {
    appointments: filteredAppointments,
    isLoading,
    error,
  };
};
