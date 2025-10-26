import { apiClient } from "../../lib/apiClient";
import { APPOINTMENT_STATUS } from "../../utils/appointmentStatus";
import type { AppointmentStatus } from "../../utils/appointmentStatus";
import type { Patient } from "./Patient";

/**
 * TIMEZONE HANDLING STRATEGY (Updated):
 * 
 * The backend handles timezone conversions based on clinic configuration.
 * The frontend must:
 * 1. SEND to backend: Local time as-is with 'Z' suffix (e.g., "2025-10-25T19:00:00Z")
 * 2. RECEIVE from backend: Dates in UTC format with 'Z' suffix
 * 
 * Example flow:
 * - User selects 7:00 PM (19:00) for appointment
 * - Frontend sends: "2025-10-25T19:00:00Z" (exact time from UI)
 * - Backend knows clinic timezone and converts to UTC for storage
 * - Backend retrieves and returns: "2025-10-26T01:00:00Z" (UTC)
 * - Frontend receives and converts back to local: 7:00 PM
 * - Calendar displays: 7:00 PM ✓
 * 
 * This ensures the backend controls timezone handling based on clinic configuration.
 */

/**
 * Convert Date to ISO string using LOCAL time with 'Z' suffix
 * Sends the exact time the user selected without timezone conversion
 * Example: User selects 19:00 → "2025-08-28T19:00:00Z"
 */
const toLocalTimeWithZ = (date: Date): string => {
  const pad = (num: number) => String(num).padStart(2, '0');

  return date.getFullYear() +
    '-' + pad(date.getMonth() + 1) +
    '-' + pad(date.getDate()) +
    'T' + pad(date.getHours()) +
    ':' + pad(date.getMinutes()) +
    ':' + pad(date.getSeconds()) +
    'Z';
};

export type Appointment = {
  id: string;
  patient?: Patient; // Full patient object from backend
  patientId: string; // Keep for backwards compatibility during transition
  doctorId: string;
  serviceId: string;
  serviceName?: string; // For display purposes
  unitId: string;
  start: Date;
  end: Date;
  notes?: string; // Free-form notes
  // Additional fields from API responses
  patient_name?: string; // Deprecated - use patient.first_name + patient.last_name
  patient_phone?: string; // Deprecated - use patient.phone
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
  service_id: string;
  notes?: string;
};

export type UpdateAppointmentRequest = {
  patient_id?: string;
  doctor_id?: string;
  unit_id?: string;
  start_time?: string; // ISO string format
  end_time?: string;   // ISO string format
  service_id?: string;
  status?: string;
  notes?: string;
};

export type AppointmentResponse = {
  id: string;
  patient?: Patient; // Full patient object from backend
  patient_id?: string; // Deprecated - use patient.id
  patient_name?: string; // Deprecated - use patient.first_name + patient.last_name
  patient_phone?: string; // Deprecated - use patient.phone
  doctor_id: string;
  clinic_id?: string;
  unit_id: string;
  start_time: string;
  end_time: string;
  service_id: string;
  service_name?: string;
  status: string;
  created_at: string;
  updated_at: string;
  is_first_visit?: boolean;
  notes?: string | null;
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
    // TIMEZONE: Send exact local time selected by user - backend handles UTC conversion
    const requestData: CreateAppointmentRequest = {
      patient_id: appointment.patientId,
      doctor_id: appointment.doctorId,
      unit_id: appointment.unitId,
      start_time: toLocalTimeWithZ(appointment.start), // Format: "2025-08-28T19:00:00Z" (user's selected time)
      end_time: toLocalTimeWithZ(appointment.end),     // Format: "2025-08-28T19:00:00Z" (user's selected time)
      service_id: appointment.serviceId,
      notes: appointment.notes || undefined,
    };

    console.log('📤 Sending POST request to create appointment:', requestData);

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

    // Access the nested appointment data
    const appointmentData = response.data.data;

    console.log('🔍 CREATE - Backend appointmentData:', appointmentData);
    console.log('🔍 CREATE - appointmentData.patient:', appointmentData.patient);
    console.log('🔍 CREATE - appointmentData.patient_id:', appointmentData.patient_id);

    // TIMEZONE: Backend sends dates in UTC format with 'Z' suffix: "2025-08-28T15:04:05Z"
    // JavaScript automatically converts to local timezone when creating Date object
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
      patient: appointmentData.patient, // Full patient object from backend
      patientId: appointmentData.patient?.id || appointmentData.patient_id || "", // Fallback for backwards compatibility
      doctorId: appointmentData.doctor_id && appointmentData.doctor_id !== "unassigned" ? appointmentData.doctor_id : "sin-doctor", // Normalize null/unassigned doctor_id
      unitId: appointmentData.unit_id,
      start: startDate,
      end: endDate,
      serviceId: appointmentData.service_id,
      serviceName: appointmentData.service_name,
      notes: appointmentData.notes ?? undefined,
      // Keep deprecated fields for backwards compatibility during transition
      patient_name: appointmentData.patient 
        ? `${appointmentData.patient.first_name || ''} ${appointmentData.patient.last_name || ''}`.trim()
        : appointmentData.patient_name,
      patient_phone: appointmentData.patient?.phone || appointmentData.patient_phone,
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
    const normalizedStatus: AppointmentStatus =
      typeof appointmentData.status === "string" && appointmentData.status.trim() !== ""
        ? (appointmentData.status.trim() as AppointmentStatus)
        : APPOINTMENT_STATUS.SCHEDULED;

    const requestData: UpdateAppointmentRequest = {
      patient_id: appointmentData.patientId,
      doctor_id: appointmentData.doctorId,
      unit_id: appointmentData.unitId,
      start_time: appointmentData.start_time,
      end_time: appointmentData.end_time,
      service_id: appointmentData.serviceId,
      status: normalizedStatus,
      notes: appointmentData.notes,
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

    // TIMEZONE: Backend sends dates in UTC format with 'Z' suffix: "2025-08-28T15:04:05Z"
    // JavaScript automatically converts to local timezone when creating Date object
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
      patient: updatedAppointment.patient, // Full patient object from backend
      patientId: updatedAppointment.patient?.id || updatedAppointment.patient_id || "", // Fallback for backwards compatibility
      doctorId: updatedAppointment.doctor_id && updatedAppointment.doctor_id !== "unassigned" ? updatedAppointment.doctor_id : "sin-doctor", // Normalize null/unassigned doctor_id
      unitId: updatedAppointment.unit_id,
      start: startDate,
      end: endDate,
      serviceId: updatedAppointment.service_id,
      serviceName: updatedAppointment.service_name,
      notes: updatedAppointment.notes ?? undefined,
      // Keep deprecated fields for backwards compatibility
      patient_name: updatedAppointment.patient 
        ? `${updatedAppointment.patient.first_name || ''} ${updatedAppointment.patient.last_name || ''}`.trim()
        : updatedAppointment.patient_name,
      patient_phone: updatedAppointment.patient?.phone || updatedAppointment.patient_phone,
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

    // TIMEZONE: Backend sends dates in UTC format with 'Z' suffix: "2025-08-28T15:04:05Z"
    // JavaScript automatically converts to local timezone when creating Date object
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
      patient: cancelledAppointment.patient, // Full patient object from backend
      patientId: cancelledAppointment.patient?.id || cancelledAppointment.patient_id || "", // Fallback for backwards compatibility
      doctorId: cancelledAppointment.doctor_id && cancelledAppointment.doctor_id !== "unassigned" ? cancelledAppointment.doctor_id : "sin-doctor", // Normalize null/unassigned doctor_id
      unitId: cancelledAppointment.unit_id,
      start: startDate,
      end: endDate,
      serviceId: cancelledAppointment.service_id,
      serviceName: cancelledAppointment.service_name,
      // Keep deprecated fields for backwards compatibility
      patient_name: cancelledAppointment.patient 
        ? `${cancelledAppointment.patient.first_name || ''} ${cancelledAppointment.patient.last_name || ''}`.trim()
        : cancelledAppointment.patient_name,
      patient_phone: cancelledAppointment.patient?.phone || cancelledAppointment.patient_phone,
      status: cancelledAppointment.status, // Should be "cancelled"
      is_first_visit: cancelledAppointment.is_first_visit,
      notes: cancelledAppointment.notes ?? undefined,
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
      // TIMEZONE: Backend sends dates in UTC format with 'Z' suffix: "2025-08-28T15:04:05Z"
      // JavaScript automatically converts to local timezone when creating Date object
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
      
      // Log first appointment to check structure
      if (appt.id === appointmentsData[0].id) {
        console.log('🔍 FETCH - First appointment from backend:', appt);
        console.log('🔍 FETCH - appt.patient:', appt.patient);
        console.log('🔍 FETCH - appt.patient_id:', appt.patient_id);
      }
      
      return {
        id: appt.id,
        patient: appt.patient, // Full patient object from backend
        patientId: appt.patient?.id || appt.patient_id || "", // Fallback for backwards compatibility
        doctorId: appt.doctor_id && appt.doctor_id !== "unassigned" ? appt.doctor_id : "sin-doctor", // Normalize null/unassigned doctor_id
        unitId: appt.unit_id,
        start: startDate,
        end: endDate,
        serviceId: appt.service_id,
        serviceName: appt.service_name,
        notes: (appt as any).notes ?? undefined,
        // Preserve additional fields from API response
        patient_name: appt.patient 
          ? `${appt.patient.first_name || ''} ${appt.patient.last_name || ''}`.trim()
          : appt.patient_name,
        patient_phone: appt.patient?.phone || appt.patient_phone,
        doctor_name: (appt as any).doctor_name,
        unit_name: (appt as any).unit_name,
        clinic_id: appt.clinic_id,
        clinic_name: (appt as any).clinic_name,
        status: appt.status,
        is_first_visit: appt.is_first_visit,
      } as Appointment;
    }).filter((appt): appt is Appointment => appt !== null); // Remove null entries
    
    // Debug: Log appointments with is_first_visit after transformation
    const firstVisitAppointments = appointments.filter(apt => apt.is_first_visit);
    if (firstVisitAppointments.length > 0) {
      console.log(`✅ Found ${firstVisitAppointments.length} first visit appointments after transformation:`, 
        firstVisitAppointments.map(apt => ({
          patient_name: apt.patient_name,
          is_first_visit: apt.is_first_visit,
        }))
      );
    } else {
      console.log("⚠️ No first visit appointments found after transformation");
    }
    
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
