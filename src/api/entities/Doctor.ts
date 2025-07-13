import { delay } from "../utils"
import type { Appointment } from "./Appointment";
import { getAppointments } from "./Appointment";

export type Doctor = {
  id: string;
  name: string;
  specialty: string;
  defaultClinic: string;
  defaultUnit: string;
};

// In-memory storage
const doctors: Doctor[] = [
  { id: "doctor-1", name: "Dr. Pérez", specialty: "Ortodoncia", defaultUnit: "unidad-1", defaultClinic: "clinic-1" },
  { id: "doctor-2", name: "Dr. López", specialty: "Endodoncia", defaultUnit: "unidad-2", defaultClinic: "clinic-1" },
];

export const getDoctors = async (): Promise<Doctor[]> => {
  await delay(500);
  return doctors;
};

export const getDoctorAvailability = async (doctorId: string, date: Date): Promise<Appointment[]> => {
  await delay(500);
  const appointments = await getAppointments();
  return appointments.filter((a) => a.doctorId === doctorId && a.start.toDateString() === date.toDateString());
};
