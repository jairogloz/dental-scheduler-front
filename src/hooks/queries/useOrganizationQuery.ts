import { useQuery } from "@tanstack/react-query";
import { getOrganizationData, type OrganizationData } from "../../api/entities/Organization";
import { useAuth } from "../../contexts/AuthContext";

/**
 * TanStack Query hook for organization data
 * Replaces the manual organization data management in AuthContext
 * 
 * Features:
 * - Automatic caching and background updates
 * - Loading and error states
 * - Automatic refetch on mount and reconnect
 * - Stale-while-revalidate pattern
 */
export const useOrganizationQuery = () => {
  const { organizationId, session } = useAuth();

  return useQuery<OrganizationData, Error>({
    // Query key includes organizationId for cache segmentation
    queryKey: ["organization", organizationId],
    
    // Query function - only runs when organizationId and session exist
    queryFn: async (): Promise<OrganizationData> => {
      if (!organizationId) {
        throw new Error("No organization ID available");
      }
      if (!session?.access_token) {
        throw new Error("No access token available");
      }
      
      // Get a broad date range to include sufficient appointments
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 30); // 30 days ago
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 60); // 60 days ahead
      
      return await getOrganizationData({
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
        limit: 500,
      }, session.access_token);
    },
    
    // Only run query when we have both organizationId and session
    enabled: !!organizationId && !!session?.access_token,
    
    // Organization data is relatively static - cache for 10 minutes
    staleTime: 10 * 60 * 1000,
    
    // Keep in cache for 30 minutes after component unmount
    gcTime: 30 * 60 * 1000,
    
    // Retry on failure - organization data is critical
    retry: 3,
    
    // Log query state changes for debugging
    meta: {
      errorMessage: "Failed to load organization data",
    },
  });
};

/**
 * Helper hooks for accessing specific organization data
 * These provide the same interface as the old useOrganizationHelpers
 */
export const useDoctors = () => {
  const { data: organizationData, isLoading, error } = useOrganizationQuery();
  
  return {
    doctors: organizationData?.doctors || [],
    loading: isLoading,
    error,
  };
};

export const useClinics = () => {
  const { data: organizationData, isLoading, error } = useOrganizationQuery();
  
  return {
    clinics: organizationData?.clinics || [],
    loading: isLoading,
    error,
  };
};

export const useUnits = () => {
  const { data: organizationData, isLoading, error } = useOrganizationQuery();
  
  return {
    units: organizationData?.units || [],
    loading: isLoading,
    error,
  };
};

export const useOrganizationInfo = () => {
  const { data: organizationData, isLoading, error } = useOrganizationQuery();
  
  return {
    organization: organizationData?.organization || null,
    loading: isLoading,
    error,
  };
};
