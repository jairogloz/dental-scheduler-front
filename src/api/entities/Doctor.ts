import { delay } from "../utils"
import type { Appointment } from "./Appointment";
import { getAppointments } from "./Appointment";
import { apiClient } from "../../lib/apiClient";
import { supabase } from "../../lib/supabase";

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
  // Get user profile to extract organization_id
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Get user profile from profiles table
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (profileError) {
    throw new Error(`Failed to get user profile: ${profileError.message}`);
  }

  if (!profile?.organization_id) {
    throw new Error('User has no organization assigned');
  }

  // Call backend API with organization_id as query parameter
  const { data, error } = await apiClient.get<{ data: Doctor[] }>(`/doctors?orgId=${profile.organization_id}`);
  if (error) {
    throw error;
  }

  console.log('getDoctors apiClient response:', { data, error });
  
  // Extract the actual doctors array from the nested data property
  const result = data?.data ?? [];
  if (result.length === 0) {
    console.info('No doctors found for this organization. Please add some first.');
  }

  console.log('getDoctors returning:', result);
  return result;
};

export const getDoctorAvailability = async (doctorId: string, date: Date): Promise<Appointment[]> => {
  await delay(500);
  const appointments = await getAppointments();
  return appointments.filter((a) => a.doctorId === doctorId && a.start.toDateString() === date.toDateString());
};
