import { apiClient } from "../../lib/apiClient";

// Backend response wrapper
export type OrganizationApiResponse = {
  data: OrganizationData;
  success: boolean;
};

// Organization consolidated data types matching the backend response
export type OrganizationData = {
  organization: {
    id: string;
    name: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
  clinics: Array<{
    id: string;
    name: string;
    organization_id: string;
    created_at: string;
    updated_at: string;
  }>;
  units: Array<{
    id: string;
    name: string;
    clinic_id: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }>;
  doctors: Array<{
    id: string;
    name: string;
    specialty: string;
    organization_id: string;
    default_unit_id: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }>;
  appointments: Array<{
    id: string;
    patient_id: string;
    doctor_id: string;
    unit_id: string;
    start_time: string; // ISO string format
    end_time: string;   // ISO string format
    treatment_type: string;
    status: string;
    patient_name: string;
    doctor_name: string;
    unit_name: string;
  }> | null; // appointments can be null
};

// Request parameters for the organization endpoint
export type GetOrganizationDataParams = {
  start_date?: string; // ISO date string (YYYY-MM-DD)
  end_date?: string;   // ISO date string (YYYY-MM-DD)
  limit?: number;      // Limit for appointments
};

/**
 * Fetches consolidated organization startup data including:
 * - Organization info
 * - All clinics
 * - All units  
 * - All doctors
 * - Appointments within date range
 */
export const getOrganizationData = async (
  params: GetOrganizationDataParams = {}
): Promise<OrganizationData> => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.start_date) {
      queryParams.append('start_date', params.start_date);
    }
    
    if (params.end_date) {
      queryParams.append('end_date', params.end_date);
    }
    
    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    }

    const url = `/organization${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    console.log('🔍 Fetching organization data from:', url);
    
    // The API returns { data: OrganizationData, success: boolean }
    const response = await apiClient.get<OrganizationApiResponse>(url);
    
    console.log('✅ Organization API Full Response:', response);
    console.log('✅ Organization Response Data:', response.data);
    console.log('✅ Organization Nested Data:', response.data.data);
    
    // Extract the nested data object
    const organizationData = response.data.data;
    
    // Ensure appointments is an array (convert null to empty array)
    if (organizationData.appointments === null) {
      organizationData.appointments = [];
    }
    
    return organizationData;
  } catch (error) {
    console.error('❌ Error fetching organization data:', error);
    
    // Log more details about the error
    if (error && typeof error === 'object' && 'response' in error) {
      const apiError = error as any;
      console.error('❌ API Error Status:', apiError.response?.status);
      console.error('❌ API Error Data:', apiError.response?.data);
      console.error('❌ API Error Headers:', apiError.response?.headers);
    }
    
    throw error;
  }
};
