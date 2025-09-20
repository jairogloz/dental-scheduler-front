import { apiClient } from "../../lib/apiClient";

export type Appointment = {
  id: string;
  patientId: string;
  doctorId: string;
  treatment: string;
  unitId: string;
  start: Date;
  end: Date;
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

export type AppointmentResponse = {
  id: string;
  patient_id: string;
  doctor_id: string;
  unit_id: string;
  start_time: string;
  end_time: string;
  treatment_type: string;
  status: string;
  created_at: string;
  updated_at: string;
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
    console.log("🔍 Datos de entrada para crear cita:", {
      appointment,
      forceCreate
    });

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
    console.log("📤 Datos transformados para enviar al backend:", requestData);

    const params = new URLSearchParams();
    if (forceCreate) {
      params.append('force_create', 'true');
    }

    const queryString = params.toString();
    const url = `/appointments${queryString ? '?' + queryString : ''}`;

    console.log("🌐 URL de la petición:", url);

    const response = await apiClient.post<AppointmentApiResponse>(url, requestData);

    // Debug: Log the backend response to see the exact format
    console.log("📥 Respuesta del backend:", response.data);
    console.log("📅 start_time del backend:", response.data.data.start_time, typeof response.data.data.start_time);
    console.log("📅 end_time del backend:", response.data.data.end_time, typeof response.data.data.end_time);

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

    console.log("✅ Fechas parseadas correctamente:", { startDate, endDate });

    // Transform backend response to frontend format
    return {
      id: appointmentData.id,
      patientId: appointmentData.patient_id,
      doctorId: appointmentData.doctor_id,
      unitId: appointmentData.unit_id,
      start: startDate,
      end: endDate,
      treatment: appointmentData.treatment_type, // Map treatment_type back to treatment
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

export const updateAppointment = async (id: string, newData: Partial<Appointment>): Promise<Appointment> => {
  try {
    // TODO: Implement real backend API call for updating appointments
    const updateData: any = {};
    
    // Transform fields as needed
    if (newData.start) updateData.start_time = newData.start.toISOString();
    if (newData.end) updateData.end_time = newData.end.toISOString();
    if (newData.treatment) updateData.treatment_type = newData.treatment; // Map treatment to treatment_type
    if (newData.patientId) updateData.patient_id = newData.patientId;
    if (newData.doctorId) updateData.doctor_id = newData.doctorId;
    if (newData.unitId) updateData.unit_id = newData.unitId;

    const response = await apiClient.put<AppointmentResponse>(`/appointments/${id}`, updateData);

    return {
      id: response.data.id,
      patientId: response.data.patient_id,
      doctorId: response.data.doctor_id,
      unitId: response.data.unit_id,
      start: new Date(response.data.start_time),
      end: new Date(response.data.end_time),
      treatment: response.data.treatment_type, // Map treatment_type back to treatment
    };
  } catch (error) {
    console.error("Error actualizando cita:", error);
    throw { code: 500, message: "Error al actualizar la cita" };
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
    console.log('🔍 Fetching appointments from:', url);
    
    // The backend should return an array of AppointmentResponse
    const response = await apiClient.get<AppointmentResponse[]>(url);
    
    console.log('✅ Appointments API Response:', response);
    console.log('✅ Response data type:', typeof response.data);
    console.log('✅ Response data is array:', Array.isArray(response.data));
    console.log('✅ Response data structure:', response.data);
    
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
    
    console.log('✅ Final appointments data to process (should be array):', appointmentsData);
    console.log('✅ Is appointments data an array?', Array.isArray(appointmentsData));
    
    // Transform backend format to frontend format
    const appointments: Appointment[] = appointmentsData.map((appt) => {
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
      };
    }).filter((appt): appt is Appointment => appt !== null); // Remove null entries
    
    console.log(`✅ Loaded ${appointments.length} appointments for date range ${startDate} to ${endDate}`);
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
