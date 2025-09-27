import { legacyApiClient as apiClient } from "../../lib/apiClient";

export type Patient = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
};

export type PatientSearchResponse = {
  data: {
    patients: Patient[];
    total: number;
  };
  success: boolean;
};

export type CreatePatientRequest = {
  name: string;
  phone?: string;
};

export type CreatePatientResponse = {
  data: Patient;  // Direct patient object, not nested
  success: boolean;
};

// Search patients with debouncing-friendly API call
export const searchPatients = async (
  query: string, 
  limit: number = 100
): Promise<Patient[]> => {
  if (query.length < 2) {
    return [];
  }

  try {
    // Call backend API - organization_id will be extracted from JWT token by backend
    const response = await apiClient.get<PatientSearchResponse>(
      `/patients/search?q=${encodeURIComponent(query)}&limit=${limit}`
    );

    if (!response.data) {
      console.warn('Patient search returned no data');
      return [];
    }

    return response.data.data?.patients || [];
  } catch (error) {
    console.error('Patient search failed:', error);
    throw error;
  }
};

// Create a new patient
export const createPatient = async (
  patientData: CreatePatientRequest
): Promise<Patient> => {
  try {
    // Call backend API - organization_id will be extracted from JWT token by backend
    const response = await apiClient.post<CreatePatientResponse>(
      `/patients`, 
      patientData
    );

    if (!response.data || !response.data.data) {
      console.error('Patient creation returned no data:', response.data);
      throw new Error('Invalid response format: missing data');
    }

    // Backend returns the patient object directly in data.data
    return response.data.data;
  } catch (error) {
    console.error('Patient creation failed:', error);
    throw error;
  }
};
