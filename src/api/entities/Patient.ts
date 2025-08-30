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
  data: {
    patient: Patient;
  };
  success: boolean;
};

// Search patients with debouncing-friendly API call
export const searchPatients = async (query: string, limit: number = 100): Promise<Patient[]> => {
  if (query.length < 2) {
    return [];
  }

  const { data, error } = await apiClient.get<PatientSearchResponse>(
    `/patients/search?q=${encodeURIComponent(query)}&limit=${limit}`
  );

  if (error) {
    throw error;
  }

  return data?.data?.patients || [];
};

// Create a new patient
export const createPatient = async (patientData: CreatePatientRequest): Promise<Patient> => {
  const { data, error } = await apiClient.post<CreatePatientResponse>('/patients', patientData);

  if (error) {
    throw error;
  }

  if (!data?.data?.patient) {
    throw new Error('Invalid response format');
  }

  return data.data.patient;
};
