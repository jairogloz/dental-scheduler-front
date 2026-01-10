import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getReschedulingQueue,
  cancelAppointmentFromQueue,
  rescheduleAppointment,
  type ReschedulingQueueParams,
  type ReschedulingQueueResponse,
} from "../../api/entities/Appointment";
import { useAuth } from "../../contexts/AuthContext";

/**
 * TanStack Query hook for rescheduling queue
 * Fetches appointments with 'needs-rescheduling' status
 */
export const useReschedulingQueueQuery = (params: ReschedulingQueueParams = {}) => {
  const { organizationId, readyForFetches } = useAuth();

  // Create stable cache key based on params and organization
  const cacheKey = [
    "rescheduling-queue",
    organizationId,
    params.clinic_id,
    params.doctor_id,
    params.search,
    params.page,
    params.limit,
    params.sort,
  ];

  return useQuery<ReschedulingQueueResponse, Error>({
    queryKey: cacheKey,
    
    queryFn: async (): Promise<ReschedulingQueueResponse> => {
      if (!organizationId) {
        throw new Error("No organization ID available");
      }
      return await getReschedulingQueue(params);
    },
    
    // Only run when we have organizationId
    enabled: readyForFetches && !!organizationId,
    
    // Queue changes less frequently than calendar - refresh every 5 minutes
    staleTime: 5 * 60 * 1000,
    
    // Keep cached for 15 minutes after unmount
    gcTime: 15 * 60 * 1000,
    
    // Refetch on focus to ensure fresh queue data
    refetchOnWindowFocus: true,
    
    // Poll for updates every 5 minutes when tab is visible
    refetchInterval: 5 * 60 * 1000,
    refetchIntervalInBackground: false,
    
    // Retry network errors
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors (client errors)
      if (error.message.includes('4')) return false;
      return failureCount < 3;
    },
    
    meta: {
      errorMessage: "Failed to load rescheduling queue",
    },
  });
};

/**
 * Hook for canceling appointments from the rescheduling queue
 */
export const useCancelFromQueue = () => {
  const queryClient = useQueryClient();
  const { organizationId } = useAuth();

  return useMutation({
    mutationFn: ({ 
      appointmentId, 
      reason
    }: { 
      appointmentId: string; 
      reason: string;
    }) => 
      cancelAppointmentFromQueue(appointmentId, reason),
    
    // Optimistic update - immediately remove from cache
    onMutate: async ({ appointmentId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["rescheduling-queue", organizationId],
      });

      // Snapshot previous value for rollback
      const previousQueueData = queryClient.getQueriesData({
        queryKey: ["rescheduling-queue", organizationId],
      });

      // Optimistically update queue data
      queryClient.setQueriesData<ReschedulingQueueResponse>(
        { queryKey: ["rescheduling-queue", organizationId] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.filter(item => item.id !== appointmentId),
            total: old.total - 1,
          };
        }
      );

      return { previousQueueData };
    },
    
    // Revert optimistic update on error
    onError: (_error, _variables, context) => {
      if (context?.previousQueueData) {
        context.previousQueueData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    
    // Refetch queue data on success/error to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["rescheduling-queue", organizationId],
      });
    },
    
    meta: {
      errorMessage: "Failed to cancel appointment",
      successMessage: "Appointment canceled successfully",
    },
  });
};

/**
 * Hook for rescheduling appointments from the queue
 */
export const useRescheduleFromQueue = () => {
  const queryClient = useQueryClient();
  const { organizationId } = useAuth();

  return useMutation({
    mutationFn: ({ 
      appointmentId, 
      rescheduleData
    }: { 
      appointmentId: string; 
      rescheduleData: {
        doctor_id: string;
        unit_id: string;
        start_time: string; // ISO string in clinic timezone
        end_time: string;   // ISO string in clinic timezone
        service_id: string;
        notes?: string;
      };
    }) => rescheduleAppointment(appointmentId, rescheduleData),
    
    // Optimistic update - remove from queue cache
    onMutate: async ({ appointmentId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["rescheduling-queue", organizationId],
      });

      // Snapshot previous value for rollback
      const previousQueueData = queryClient.getQueriesData({
        queryKey: ["rescheduling-queue", organizationId],
      });

      // Remove from queue cache (appointment is now rescheduled)
      queryClient.setQueriesData<ReschedulingQueueResponse>(
        { queryKey: ["rescheduling-queue", organizationId] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.filter(item => item.id !== appointmentId),
            total: old.total - 1,
          };
        }
      );

      return { previousQueueData };
    },
    
    // Revert optimistic update on error
    onError: (_error, _variables, context) => {
      if (context?.previousQueueData) {
        context.previousQueueData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    
    // Refetch queue and appointments data on success/error
    onSettled: () => {
      // Refetch queue data
      queryClient.invalidateQueries({
        queryKey: ["rescheduling-queue", organizationId],
      });
      
      // Refetch appointments data (new appointment was created)
      queryClient.invalidateQueries({
        queryKey: ["appointments", organizationId],
      });
    },
    
    meta: {
      errorMessage: "Failed to reschedule appointment",
      successMessage: "Appointment rescheduled successfully",
    },
  });
};

/**
 * Hook to get total count of items in rescheduling queue
 * Useful for showing badge counts in navigation
 */
export const useReschedulingQueueCount = () => {
  const { organizationId, readyForFetches } = useAuth();

  return useQuery<number, Error>({
    queryKey: ["rescheduling-queue-count", organizationId],
    
    queryFn: async (): Promise<number> => {
      if (!organizationId) {
        throw new Error("No organization ID available");
      }
      const result = await getReschedulingQueue({ limit: 1 }); // Just get count
      return result.total;
    },
    
    enabled: readyForFetches && !!organizationId,
    
    // Update count every 10 minutes
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    
    refetchOnWindowFocus: true,
    refetchInterval: 10 * 60 * 1000,
    refetchIntervalInBackground: false,
    
    retry: 2,
  });
};