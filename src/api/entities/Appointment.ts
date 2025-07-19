import { v4 as uuidv4 } from "uuid";
import { delay } from "../utils";

export type Appointment = {
  id: string;
  patientId: string;
  doctorId: string;
  treatment: string;
  unitId: string;
  start: Date;
  end: Date;
};

// Preloaded appointments
const now = new Date();
const appointments: Appointment[] = [
  {
    id: uuidv4(),
    patientId: "Juan Pérez",
    doctorId: "doctor-1",
    treatment: "Ortodoncia",
    unitId: "unidad-1",
    start: new Date(now.getTime() + 1 * 60 * 60 * 1000), // Current time + 1 hour
    end: new Date(now.getTime() + 1.5 * 60 * 60 * 1000), // Current time + 1.5 hours
  },
  {
    id: uuidv4(),
    patientId: "Ana López",
    doctorId: "doctor-2",
    treatment: "Endodoncia",
    unitId: "unidad-2",
    start: new Date(now.getTime() + 2 * 60 * 60 * 1000), // Current time + 2 hours
    end: new Date(now.getTime() + 2.5 * 60 * 60 * 1000), // Current time + 2.5 hours
  },
  {
    id: uuidv4(),
    patientId: "Carlos García",
    doctorId: "doctor-1",
    treatment: "Ortodoncia",
    unitId: "unidad-1",
    start: new Date(now.getTime() - 22 * 60 * 60 * 1000), // Yesterday at the same time + 1 hour
    end: new Date(now.getTime() - 21.5 * 60 * 60 * 1000), // Yesterday + 1.5 hours
  },
];

const blockedTimeRanges: { doctorId: string; start: Date; end: Date }[] = [];

export const getAppointments = async (): Promise<Appointment[]> => {
  await delay(500);
  return appointments;
};

export const createAppointment = async (appointment: Omit<Appointment, "id">): Promise<Appointment> => {
  console.log("Creating appointment:", appointment);
  try {
    await delay(500);

    // Check if start time is in the future
    if (appointment.start <= new Date()) {
      throw { code: 400, message: "Start time must be in the future" };
    }

    // Check if end time is after start time
    if (appointment.end <= appointment.start) {
      throw { code: 400, message: "End time must be after start time" };
    }

    // Check for overlapping appointments in the same unit
    const unitConflict = appointments.some(
      (a) =>
        a.unitId === appointment.unitId &&
        ((appointment.start >= a.start && appointment.start < a.end) ||
          (appointment.end > a.start && appointment.end <= a.end))
    );
    if (unitConflict) {
      throw { code: 409, message: "Selected unit is already booked at this time" };
    }

    // Check for overlapping appointments for the same doctor
    const conflictingDoctors = appointments
      .filter(
        (a) =>
          a.doctorId === appointment.doctorId &&
          ((appointment.start >= a.start && appointment.start < a.end) ||
            (appointment.end > a.start && appointment.end <= a.end))
      )
      .map((a) => a.doctorId);

    if (conflictingDoctors.length > 0) {
      console.log("Conflicting doctor IDs:", conflictingDoctors);
      throw { code: 409, message: "Doctor already has an appointment at this time" };
    }

    // Check if the doctor has a blocked time range that overlaps
    const blockedConflict = blockedTimeRanges.some(
      (block) =>
        block.doctorId === appointment.doctorId &&
        ((appointment.start >= block.start && appointment.start < block.end) ||
          (appointment.end > block.start && appointment.end <= block.end))
    );
    if (blockedConflict) {
      throw { code: 409, message: "Doctor is unavailable at this time" };
    }

    // If all checks pass, add the appointment
    const newAppointment = { id: uuidv4(), ...appointment };
    appointments.push(newAppointment);
    console.log("appointments", appointments);
    return newAppointment;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && "message" in error) {
      throw error; // Re-throw known errors for the caller to handle
    } else {
      console.error("Unexpected error:", error);
      throw { code: 500, message: "An unexpected error occurred" }; // Generic error
    }
  }
};

export const updateAppointment = async (id: string, newData: Partial<Appointment>): Promise<Appointment> => {
  await delay(500);

  const index = appointments.findIndex((a) => a.id === id);
  if (index === -1) throw { code: 404, message: "Appointment not found" };

  const updatedAppointment = { ...appointments[index], ...newData };
  appointments[index] = updatedAppointment;
  return updatedAppointment;
};

export const deleteAppointment = async (id: string): Promise<void> => {
  await delay(500);
  const index = appointments.findIndex((a) => a.id === id);
  if (index === -1) throw { code: 404, message: "Appointment not found" };
  appointments.splice(index, 1);
};

export const blockDoctorTime = async (doctorId: string, dateRange: { start: Date; end: Date }): Promise<void> => {
  await delay(500);
  blockedTimeRanges.push({
    doctorId,
    start: dateRange.start,
    end: dateRange.end,
  });
};
