import { v4 as uuidv4 } from "uuid";
import { delay } from "../utils";

export type Appointment = {
  id: string;
  patientId: string;
  doctorId: string;
  unitId: string;
  start: Date;
  end: Date;
};

// In-memory storage
const appointments: Appointment[] = [];

export const getAppointments = async (): Promise<Appointment[]> => {
  await delay(500);
  return appointments;
};

export const createAppointment = async (appointment: Omit<Appointment, "id">): Promise<Appointment> => {
  await delay(500);

  const conflict = appointments.some(
    (a) =>
      a.doctorId === appointment.doctorId &&
      ((appointment.start >= a.start && appointment.start < a.end) ||
        (appointment.end > a.start && appointment.end <= a.end)) ||
      a.unitId === appointment.unitId &&
      ((appointment.start >= a.start && appointment.start < a.end) ||
        (appointment.end > a.start && appointment.end <= a.end))
  );

  if (conflict) {
    throw { code: 409, message: "Time slot already taken" };
  }

  const newAppointment = { id: uuidv4(), ...appointment };
  appointments.push(newAppointment);
  console.log("appointments", appointments);
  return newAppointment;
};

export const updateAppointment = async (id: string, newData: Partial<Appointment>): Promise<Appointment> => {
  await delay(500);

  const index = appointments.findIndex((a) => a.id === id);
  if (index === -1) throw { code: 404, message: "Appointment not found" };

  const updatedAppointment = { ...appointments[index], ...newData };
  appointments[index] = updatedAppointment;
  return updatedAppointment;
};

export const blockDoctorTime = async (doctorId: string, dateRange: { start: Date; end: Date }): Promise<void> => {
  await delay(500);
  appointments.push({
    id: uuidv4(),
    patientId: "BLOCKED",
    doctorId,
    unitId: "BLOCKED",
    start: dateRange.start,
    end: dateRange.end,
  });
};
