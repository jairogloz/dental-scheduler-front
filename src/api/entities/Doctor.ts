import { delay } from "../utils"
import type { Appointment } from "./Appointment";
import { getAppointments } from "./Appointment";
import { legacyApiClient as apiClient } from "../../lib/apiClient";

export type Doctor = {
  id: string;
  name: string;
  specialty: string;
  default_clinic_id: string;
  default_unit_id: string;
  default_clinic_name: string;
  org_id: string;
  org_name: string;
};

export const getDoctors = async (): Promise<Doctor[]> => {
  // No need to get organization_id from profiles table anymore!
  // The JWT token now contains organization_id as a custom claim
  
  // Call backend API - organization_id will be extracted from JWT token by backend
  const response = await apiClient.get<{ data: Doctor[] }>('/doctors');

  // Extract the actual doctors array from the nested data property
  const result = response.data?.data ?? [];
  if (result.length === 0) {
    console.info('No doctors found for this organization. Please add some first.');
  }

  return result;
};

export const getDoctorAvailability = async (doctorId: string, date: Date): Promise<Appointment[]> => {
  await delay(500);
  const appointments = await getAppointments();
  return appointments.filter((a) => a.doctorId === doctorId && a.start.toDateString() === date.toDateString());
};
