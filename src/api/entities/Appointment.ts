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
  treatment_type: string; // Changed from treatment to treatment_type
  created_at: string;
  updated_at: string;
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

    const response = await apiClient.post<AppointmentResponse>(url, requestData);

    // Transform backend response to frontend format
    return {
      id: response.data.id,
      patientId: response.data.patient_id,
      doctorId: response.data.doctor_id,
      unitId: response.data.unit_id,
      start: new Date(response.data.start_time),
      end: new Date(response.data.end_time),
      treatment: response.data.treatment_type, // Map treatment_type back to treatment
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
