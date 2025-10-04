import { apiClient } from "../../lib/apiClient";

export type Appointment = {
  id: string;
  patientId: string;
  doctorId: string;
  treatment: string;
  unitId: string;
  start: Date;
  end: Date;
  // Additional fields from API responses
  patient_name?: string;
  patient_phone?: string;
  doctor_name?: string;
  unit_name?: string;
  clinic_id?: string;
  clinic_name?: string;
  status?: string;
  is_first_visit?: boolean;
};

// Backend API request/response types
export type CreateAppointmentRequest = {
  patient_id: string;
  doctor_id: string;
  unit_id: string;
  start_time: string; // ISO string format
  end_time: string;   // ISO string format
  treatment_type: string; // Changed from treatment to treatment_type
};

export type UpdateAppointmentRequest = {
  patient_id?: string;
  doctor_id?: string;
  unit_id?: string;
  start_time?: string; // ISO string format
  end_time?: string;   // ISO string format
  treatment_type?: string;
  status?: string;
};

export type AppointmentResponse = {
  id: string;
  patient_id: string;
  patient_name?: string; // Now included in backend response
  doctor_id: string;
  unit_id: string;
  start_time: string;
  end_time: string;
  treatment_type: string;
  status: string;
  created_at: string;
  updated_at: string;
  is_first_visit?: boolean;
};

// Backend API wrapper response
export type AppointmentApiResponse = {
  data: AppointmentResponse;
  success: boolean;
};

// Remove mock data and unused imports since we're using real API
export const getAppointments = async (): Promise<Appointment[]> => {
  try {
    // This should be updated to call the real backend API
    // For now, returning empty array until backend endpoint is ready
    return [];
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return [];
  }
};

export const createAppointment = async (
  appointment: Omit<Appointment, "id">, 
  forceCreate: boolean = false
): Promise<Appointment> => {
  try {
    // Log input data for debugging
  // Input data for creating appointment

    // Transform frontend format to backend format
    const requestData: CreateAppointmentRequest = {
      patient_id: appointment.patientId,
      doctor_id: appointment.doctorId,
      unit_id: appointment.unitId,
      start_time: appointment.start.toISOString(),
      end_time: appointment.end.toISOString(),
      treatment_type: appointment.treatment, // Map treatment to treatment_type
    };

    // Log transformed data for debugging
  // Transformed request data ready to send to backend

    const params = new URLSearchParams();
    if (forceCreate) {
      params.append('force_create', 'true');
    }

    const queryString = params.toString();
    const url = `/appointments${queryString ? '?' + queryString : ''}`;

  // Request URL prepared

    const response = await apiClient.post<AppointmentApiResponse>(url, requestData);

    // Debug: Log the backend response to see the exact format
  // Backend response received for created appointment

    // Access the nested appointment data
    const appointmentData = response.data.data;

    // Validate date strings before creating Date objects
    const startDate = new Date(appointmentData.start_time);
    const endDate = new Date(appointmentData.end_time);
    
    if (isNaN(startDate.getTime())) {
      throw new Error(`Invalid start_time from backend: ${appointmentData.start_time}`);
    }
    if (isNaN(endDate.getTime())) {
      throw new Error(`Invalid end_time from backend: ${appointmentData.end_time}`);
    }

  // Dates parsed successfully

    // Transform backend response to frontend format
    return {
      id: appointmentData.id,
      patientId: appointmentData.patient_id,
      doctorId: appointmentData.doctor_id,
      unitId: appointmentData.unit_id,
      start: startDate,
      end: endDate,
      treatment: appointmentData.treatment_type, // Map treatment_type back to treatment
      // Preserve patient_name from backend response for display
      patient_name: appointmentData.patient_name,
      status: appointmentData.status,
      is_first_visit: appointmentData.is_first_visit,
    };
  } catch (error: any) {
    // Log detailed error information for debugging
    console.error("❌ Error completo al crear cita:", error);
    console.error("📋 Detalles del error:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data
      }
    });

    // Handle backend errors
    if (error.response?.status === 409) {
      const errorData = error.response.data;
      throw {
        code: 409,
        message: errorData.message || "Se detectó un conflicto con la cita",
        conflicts: errorData.conflicts || [],
        requiresConfirmation: true
      };
    } else if (error.response?.status === 400) {
      const errorData = error.response.data;
      console.error("🚫 Error 400 - Datos inválidos:", errorData);
      throw {
        code: 400,
        message: errorData.message || "Los datos de la cita son inválidos"
      };
    } else if (error.response?.status === 401) {
      throw {
        code: 401,
        message: "Se requiere autenticación"
      };
    } else {
      console.error("💥 Error inesperado creando cita:", error);
      throw {
        code: 500,
        message: "Ocurrió un error inesperado al crear la cita"
      };
    }
  }
};

export const updateAppointment = async (id: string, appointmentData: any): Promise<Appointment> => {
  try {
    console.log('🔄 Updating appointment:', { id, appointmentData });

    // Transform frontend format to backend format
    const requestData: UpdateAppointmentRequest = {
      patient_id: appointmentData.patientId,
      doctor_id: appointmentData.doctorId,
      unit_id: appointmentData.resourceId,
      start_time: appointmentData.start_time,
      end_time: appointmentData.end_time,
      treatment_type: appointmentData.treatmentType,
      status: appointmentData.status,
    };

    // Remove undefined or empty fields
    Object.keys(requestData).forEach(key => {
      const value = requestData[key as keyof UpdateAppointmentRequest];
      if (value === undefined || value === null || value === "") {
        delete requestData[key as keyof UpdateAppointmentRequest];
      }
    });

    console.log('📤 Sending PATCH request for update:', requestData);

    let response;
    const startTime = Date.now();
    try {
      console.log('⏳ Making update API call...');
      response = await apiClient.patch<AppointmentApiResponse>(
        `/appointments/${id}`,
        requestData
      );
      const endTime = Date.now();
      console.log(`✅ Update response received in ${endTime - startTime}ms:`, response.data);
    } catch (apiError: any) {
      const endTime = Date.now();
      console.error(`❌ Update API call failed after ${endTime - startTime}ms:`, apiError);
      console.error('❌ Update API Error details:', {
        status: apiError.response?.status,
        statusText: apiError.response?.statusText,
        data: apiError.response?.data,
        message: apiError.message,
        isTimeout: apiError.code === 'ECONNABORTED'
      });
      throw apiError;
    }

    // Access the nested appointment data
    const updatedAppointment = response.data.data;

    // Validate date strings before creating Date objects
    const startDate = new Date(updatedAppointment.start_time);
    const endDate = new Date(updatedAppointment.end_time);
    
    if (isNaN(startDate.getTime())) {
      throw new Error(`Invalid start_time from backend: ${updatedAppointment.start_time}`);
    }
    if (isNaN(endDate.getTime())) {
      throw new Error(`Invalid end_time from backend: ${updatedAppointment.end_time}`);
    }

    // Transform backend response to frontend format
    return {
      id: updatedAppointment.id,
      patientId: updatedAppointment.patient_id,
      doctorId: updatedAppointment.doctor_id,
      unitId: updatedAppointment.unit_id,
      start: startDate,
      end: endDate,
      treatment: updatedAppointment.treatment_type,
      // Preserve patient_name from backend response for display
      patient_name: updatedAppointment.patient_name,
      status: updatedAppointment.status,
      is_first_visit: updatedAppointment.is_first_visit,
    };
  } catch (error: any) {
    console.error("❌ Error updating appointment:", error);
    console.error("📋 Update error details:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data
      }
    });

    // Handle specific error cases
    if (error.response?.status === 404) {
      throw new Error("Appointment not found");
    } else if (error.response?.status === 400) {
      const errorData = error.response.data;
      throw new Error(errorData.message || "Invalid appointment data");
    }

    throw error;
  }
};

export const cancelAppointment = async (id: string): Promise<Appointment> => {
  try {
    console.log(`🚫 Cancelling appointment ${id}`);

    // Send PATCH request with status="cancelled"
    const requestData = {
      status: "cancelled"
    };

    console.log('📤 Sending PATCH request to cancel appointment:', requestData);

    let response;
    const startTime = Date.now();
    try {
      console.log('⏳ Making cancel API call...');
      response = await apiClient.patch<AppointmentApiResponse>(
        `/appointments/${id}`,
        requestData
      );
      const endTime = Date.now();
      console.log(`✅ Cancel response received in ${endTime - startTime}ms:`, response.data);
    } catch (apiError: any) {
      const endTime = Date.now();
      console.error(`❌ Cancel API call failed after ${endTime - startTime}ms:`, apiError);
      console.error('❌ Cancel API Error details:', {
        status: apiError.response?.status,
        statusText: apiError.response?.statusText,
        data: apiError.response?.data,
        message: apiError.message,
        isTimeout: apiError.code === 'ECONNABORTED'
      });
      throw apiError;
    }

    // Access the nested appointment data
    const cancelledAppointment = response.data.data;

    // Validate date strings before creating Date objects
    const startDate = new Date(cancelledAppointment.start_time);
    const endDate = new Date(cancelledAppointment.end_time);
    
    if (isNaN(startDate.getTime())) {
      throw new Error(`Invalid start_time from backend: ${cancelledAppointment.start_time}`);
    }
    if (isNaN(endDate.getTime())) {
      throw new Error(`Invalid end_time from backend: ${cancelledAppointment.end_time}`);
    }

    // Transform backend response to frontend format
    return {
      id: cancelledAppointment.id,
      patientId: cancelledAppointment.patient_id,
      doctorId: cancelledAppointment.doctor_id,
      unitId: cancelledAppointment.unit_id,
      start: startDate,
      end: endDate,
      treatment: cancelledAppointment.treatment_type,
      // Preserve patient_name from backend response for display
      patient_name: cancelledAppointment.patient_name,
      status: cancelledAppointment.status, // Should be "cancelled"
      is_first_visit: cancelledAppointment.is_first_visit,
    };
  } catch (error: any) {
    console.error("❌ Error cancelling appointment:", error);
    console.error("📋 Cancel error details:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data
      }
    });

    // Handle specific error cases
    if (error.response?.status === 404) {
      throw new Error("Appointment not found");
    } else if (error.response?.status === 400) {
      const errorData = error.response.data;
      throw new Error(errorData.message || "Invalid appointment data");
    }

    throw error;
  }
};

export const deleteAppointment = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/appointments/${id}`);
  } catch (error) {
    console.error("Error eliminando cita:", error);
    throw { code: 500, message: "Error al eliminar la cita" };
  }
};

// Get appointments for a specific date range - for incremental loading
export const getAppointmentsByDateRange = async (
  startDate: string, // YYYY-MM-DD format
  endDate: string    // YYYY-MM-DD format
): Promise<Appointment[]> => {
  try {
    const params = new URLSearchParams({
      startDate,
      endDate
    });
    
    const url = `/appointments?${params.toString()}`;
  // Fetching appointments from URL
    
    // The backend should return an array of AppointmentResponse
    const response = await apiClient.get<AppointmentResponse[]>(url);
    
  // Appointments API response received
    
    // Check if response.data is an array, if not handle the different structure
    let appointmentsData: AppointmentResponse[];
    if (Array.isArray(response.data)) {
      appointmentsData = response.data;
    } else if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      // Handle case where response structure is { data: { appointments: [...] }, success: true }
      const responseData = (response.data as any).data;
      if (responseData && 'appointments' in responseData && Array.isArray(responseData.appointments)) {
        appointmentsData = responseData.appointments;
      } else {
        console.error('❌ No appointments array found in response.data.data:', responseData);
        throw new Error('Invalid response format: no appointments array found');
      }
    } else if (response.data && typeof response.data === 'object' && 'appointments' in response.data) {
      // Handle case where data is wrapped in an object like { appointments: [...] }
      appointmentsData = (response.data as any).appointments;
    } else {
      console.error('❌ Unexpected response data structure:', response.data);
      throw new Error('Invalid response format from appointments API');
    }
    
  // Final appointments data prepared for processing
    
    // Transform backend format to frontend format
    const appointments = appointmentsData.map((appt) => {
      const startDate = new Date(appt.start_time);
      const endDate = new Date(appt.end_time);
      
      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.warn("Invalid appointment dates:", {
          id: appt.id,
          start_time: appt.start_time,
          end_time: appt.end_time
        });
        // Skip invalid appointments
        return null;
      }
      
      return {
        id: appt.id,
        patientId: appt.patient_id,
        doctorId: appt.doctor_id,
        unitId: appt.unit_id,
        start: startDate,
        end: endDate,
        treatment: appt.treatment_type,
        // Preserve additional fields from API response
        patient_name: (appt as any).patient_name,
        patient_phone: (appt as any).patient_phone,
        doctor_name: (appt as any).doctor_name,
        unit_name: (appt as any).unit_name,
        clinic_id: (appt as any).clinic_id,
        clinic_name: (appt as any).clinic_name,
        status: (appt as any).status,
        is_first_visit: (appt as any).is_first_visit,
      } as Appointment;
    }).filter((appt): appt is Appointment => appt !== null); // Remove null entries
    
  // Loaded appointments for date range
    return appointments;
  } catch (error) {
    console.error('❌ Error fetching appointments by date range:', error);
    
    // Log more details about the error
    if (error && typeof error === 'object' && 'response' in error) {
      const apiError = error as any;
      console.error('❌ API Error Status:', apiError.response?.status);
      console.error('❌ API Error Data:', apiError.response?.data);
    }
    
    throw error;
  }
};

export const blockDoctorTime = async (doctorId: string, dateRange: { start: Date; end: Date }): Promise<void> => {
  try {
    // TODO: Implement real backend API call for blocking doctor time
    await apiClient.post(`/doctors/${doctorId}/blocked-times`, {
      start_time: dateRange.start.toISOString(),
      end_time: dateRange.end.toISOString(),
    });
  } catch (error) {
    console.error("Error bloqueando tiempo del doctor:", error);
    throw { code: 500, message: "Error al bloquear el tiempo del doctor" };
  }
};
