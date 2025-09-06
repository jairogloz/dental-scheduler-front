import { useAuth } from '../contexts/AuthContext';

/**
 * Helper hooks for easy access to specific organization data
 * These hooks provide a clean interface to access organization data from AuthContext
 */

export const useDoctors = () => {
  const { organizationData, organizationLoading } = useAuth();
  return {
    doctors: organizationData?.doctors || [],
    loading: organizationLoading
  };
};

export const useUnits = () => {
  const { organizationData, organizationLoading } = useAuth();
  return {
    units: organizationData?.units || [],
    loading: organizationLoading
  };
};

export const useClinics = () => {
  const { organizationData, organizationLoading } = useAuth();
  return {
    clinics: organizationData?.clinics || [],
    loading: organizationLoading
  };
};

export const useOrganizationAppointments = () => {
  const { organizationData, organizationLoading } = useAuth();
  return {
    appointments: organizationData?.appointments || [],
    loading: organizationLoading
  };
};

export const useOrganizationInfo = () => {
  const { organizationData, organizationLoading } = useAuth();
  return {
    organization: organizationData?.organization || null,
    loading: organizationLoading
  };
};