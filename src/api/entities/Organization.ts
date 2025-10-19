// Organization data shape used across the app (sanitized: arrays never null)
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
  services: Array<{
    id: string;
    name: string;
    base_price?: number;
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
  }>;
};

// Raw backend payload shape (collections can be null when empty)
type OrganizationApiData = {
  organization: OrganizationData["organization"];
  clinics: OrganizationData["clinics"] | null;
  units: OrganizationData["units"] | null;
  doctors: OrganizationData["doctors"] | null;
  services: OrganizationData["services"] | null;
  appointments: OrganizationData["appointments"] | null;
};

// Backend response wrapper
export type OrganizationApiResponse = {
  data: OrganizationApiData;
  success: boolean;
};

// Request parameters for the organization endpoint
export type GetOrganizationDataParams = {
  start_date?: string; // ISO date string (YYYY-MM-DD)
  end_date?: string;   // ISO date string (YYYY-MM-DD)
  limit?: number;      // Limit for appointments
};

/**
 * Fetches comprehensive organization data from the backend API
 * 
 * @param params - Optional query parameters
 * @param accessToken - Access token for authentication
 * @returns Promise<OrganizationData> - Complete organization data including:
 * - Organization details  
 * - All clinics
 * - All units
 * - All doctors
 * - Appointments within date range
 */
export const getOrganizationData = async (
  params: GetOrganizationDataParams = {},
  accessToken: string
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

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
    const url = `${API_BASE_URL}/organization${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    console.log(`📤 API Request: GET ${url}`);
    
    // Use direct fetch with manual token handling
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    console.log(`📥 API Response: ${response.status} GET /organization`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Details:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        url
      });
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    // The API returns { data: OrganizationApiData, success: boolean }
    const apiResponse: OrganizationApiResponse = await response.json();

    // Normalize nullable collections into arrays for frontend consumption
    const rawData = apiResponse.data;
    const organizationData: OrganizationData = {
      organization: rawData.organization,
      clinics: rawData.clinics ?? [],
      units: rawData.units ?? [],
      doctors: rawData.doctors ?? [],
      services: rawData.services ?? [],
      appointments: rawData.appointments ?? [],
    };

    return organizationData;
  } catch (error) {
    console.error('❌ Error fetching organization data:', error);
    throw error;
  }
};
