import { apiClient } from "../../lib/apiClient";

export type Patient = {
  id: string;
  name?: string; // Combined name for display
  first_name?: string; // Backend field
  last_name?: string; // Backend field
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
  first_name: string;
  last_name?: string;
  phone?: string;
};

export type CreatePatientResponse = {
  data: Patient;  // Direct patient object, not nested
  success: boolean;
};

export type UpdatePatientRequest = {
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
};

export type UpdatePatientResponse = {
  data: Patient;
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

    const patients = response.data.data?.patients || [];
    
    // Ensure each patient has a combined name field for display
    const processedPatients = patients.map(patient => {
      
      if (!patient.name && (patient.first_name || patient.last_name)) {
        const combinedName = `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
        return {
          ...patient,
          name: combinedName
        };
      }
      return patient;
    });
    return processedPatients;
  } catch (error) {
    throw error;
  }
};

// Create a new patient
export const createPatient = async (
  patientData: CreatePatientRequest
): Promise<Patient> => {
  try {
    const payload: Record<string, string> = {
      first_name: patientData.first_name.trim(),
    };

    if (patientData.last_name && patientData.last_name.trim()) {
      payload.last_name = patientData.last_name.trim();
    }

    if (patientData.phone && patientData.phone.trim()) {
      payload.phone = patientData.phone.trim();
    }

    // Call backend API - organization_id will be extracted from JWT token by backend
    const response = await apiClient.post<CreatePatientResponse>(
      `/patients`, 
      payload
    );

    if (!response.data || !response.data.data) {
      console.error('Patient creation returned no data:', response.data);
      throw new Error('Invalid response format: missing data');
    }

    const newPatient = response.data.data;
    
    // Ensure we have a combined name field
    if (!newPatient.name && (newPatient.first_name || newPatient.last_name)) {
      newPatient.name = `${newPatient.first_name || ''} ${newPatient.last_name || ''}`.trim();
    }

    return newPatient;
  } catch (error) {
    console.error('Patient creation failed:', error);
    throw error;
  }
};

// Update an existing patient
export const updatePatient = async (
  patientId: string,
  patientData: UpdatePatientRequest
): Promise<Patient> => {
  try {
    console.log('🔄 Updating patient:', { patientId, patientData });

    // Remove undefined or null fields to send only changed data
    const cleanedData: UpdatePatientRequest = {};
    Object.keys(patientData).forEach((key) => {
      const value = patientData[key as keyof UpdatePatientRequest];
      if (value !== undefined && value !== null && value !== '') {
        cleanedData[key as keyof UpdatePatientRequest] = value;
      }
    });

    console.log('📤 Sending PATCH request for patient update:', cleanedData);

    // Call backend API - organization_id will be extracted from JWT token by backend
    const response = await apiClient.patch<UpdatePatientResponse>(
      `/patients/${patientId}`,
      cleanedData
    );

    if (!response.data || !response.data.data) {
      console.error('Patient update returned no data:', response.data);
      throw new Error('Invalid response format: missing data');
    }

    console.log('✅ Patient updated successfully:', response.data.data);

    // Backend returns the updated patient object
    const updatedPatient = response.data.data;
    
    // Ensure we have a combined name field for display purposes
    // Backend returns first_name/last_name separately
    if (!updatedPatient.name && (updatedPatient.first_name || updatedPatient.last_name)) {
      const firstName = updatedPatient.first_name || '';
      const lastName = updatedPatient.last_name || '';
      updatedPatient.name = `${firstName} ${lastName}`.trim();
    }
    
    return updatedPatient;
  } catch (error) {
    console.error('❌ Patient update failed:', error);
    throw error;
  }
};
