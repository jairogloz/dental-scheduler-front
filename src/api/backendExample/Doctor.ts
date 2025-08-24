// Example: Updated Doctor.ts to use backend API instead of mock data
// This shows how you can migrate from mock data to real API calls

import { apiClient, handleApiResponse } from "../../lib/apiClient"

export type Doctor = {
  id: string;
  name: string;
  specialty: string;
  defaultClinic: string;
  defaultUnit: string;
};

// Backend API implementation - replace mock data
export const getDoctors = async (): Promise<Doctor[]> => {
  const response = await apiClient.get<Doctor[]>('/doctors')
  return handleApiResponse(response) || []
}

export const getDoctor = async (id: string): Promise<Doctor | null> => {
  const response = await apiClient.get<Doctor>(`/doctors/${id}`)
  return handleApiResponse(response)
}

export const createDoctor = async (doctor: Omit<Doctor, "id">): Promise<Doctor> => {
  const response = await apiClient.post<Doctor>('/doctors', doctor)
  return handleApiResponse(response)!
}

export const updateDoctor = async (id: string, doctor: Partial<Doctor>): Promise<Doctor> => {
  const response = await apiClient.put<Doctor>(`/doctors/${id}`, doctor)
  return handleApiResponse(response)!
}

export const deleteDoctor = async (id: string): Promise<void> => {
  const response = await apiClient.delete(`/doctors/${id}`)
  handleApiResponse(response)
}

export const getDoctorAvailability = async (doctorId: string, date: Date): Promise<any[]> => {
  const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD format
  const response = await apiClient.get<any[]>(`/doctors/${doctorId}/availability?date=${dateStr}`)
  return handleApiResponse(response) || []
}

/* 
  Migration Notes:
  
  1. The apiClient automatically handles:
     - Adding authentication headers (JWT from Supabase)
     - Content-Type headers
     - Error handling
     - JSON parsing
  
  2. When your backend is ready, replace your existing API calls by:
     - Importing from this file instead of the mock version
     - Or updating the existing files to use apiClient
  
  3. The JWT token from Supabase auth will be sent to your backend,
     so your Go backend can verify the user is authenticated
  
  4. Your backend should validate the JWT and extract user info
     to determine permissions and data access
*/
