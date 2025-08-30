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
export const searchPatients = async (query: string, limit: number = 100): Promise<Patient[]> => {
  if (query.length < 2) {
    return [];
  }

  try {
    const { data, error } = await apiClient.get<PatientSearchResponse>(
      `/patients/search?q=${encodeURIComponent(query)}&limit=${limit}`
    );

    if (error) {
      console.error('Patient search API error:', error);
      throw error;
    }

    if (!data) {
      console.warn('Patient search returned no data');
      return [];
    }

    return data.data?.patients || [];
  } catch (error) {
    console.error('Patient search failed:', error);
    throw error;
  }
};

// Create a new patient
export const createPatient = async (patientData: CreatePatientRequest): Promise<Patient> => {
  try {
    const { data, error } = await apiClient.post<CreatePatientResponse>('/patients', patientData);

    if (error) {
      console.error('Patient creation API error:', error);
      throw error;
    }

    if (!data || !data.data) {
      console.error('Patient creation returned no data:', data);
      throw new Error('Invalid response format: missing data');
    }

    // Backend returns the patient object directly in data.data
    return data.data;
  } catch (error) {
    console.error('Patient creation failed:', error);
    throw error;
  }
};
