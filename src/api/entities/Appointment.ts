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
  // Add a test appointment with real backend IDs to test conflicts
  {
    id: uuidv4(),
    patientId: "Test Patient",
    doctorId: "89209989-077e-4daf-b382-579fd8774605", // Anahí Perales ID
    treatment: "Test Treatment",
    unitId: "b1eb2c47-5e82-4db4-ae10-8abab99a1638", // Her default unit
    start: new Date(now.getTime() + 3 * 60 * 60 * 1000), // Current time + 3 hours
    end: new Date(now.getTime() + 4 * 60 * 60 * 1000), // Current time + 4 hours
  },
  // Add another test appointment for easier conflict testing
  {
    id: uuidv4(),
    patientId: "Easy Conflict Test",
    doctorId: "89209989-077e-4daf-b382-579fd8774605", // Same doctor
    treatment: "Conflict Test",
    unitId: "b1eb2c47-5e82-4db4-ae10-8abab99a1638", // Same unit
    start: new Date(now.getTime() + 30 * 60 * 1000), // Current time + 30 minutes
    end: new Date(now.getTime() + 60 * 60 * 1000), // Current time + 1 hour
  },
];

const blockedTimeRanges: { doctorId: string; start: Date; end: Date }[] = [];

export const getAppointments = async (): Promise<Appointment[]> => {
  await delay(500);
  return appointments;
};

export const createAppointment = async (
  appointment: Omit<Appointment, "id">, 
  forceCreate: boolean = false
): Promise<Appointment> => {
  // Ensure forceCreate is actually a boolean (in case an event gets passed)
  const shouldForceCreate = typeof forceCreate === 'boolean' ? forceCreate : false;
  
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

    const conflicts: string[] = [];

    // Check for overlapping appointments in the same unit
    const unitConflict = appointments.some(
      (a) =>
        a.unitId === appointment.unitId &&
        ((appointment.start >= a.start && appointment.start < a.end) ||
          (appointment.end > a.start && appointment.end <= a.end))
    );
    if (unitConflict) {
      conflicts.push("Selected unit is already booked at this time");
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
      conflicts.push("Doctor already has an appointment at this time");
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

    // If there are conflicts and user hasn't confirmed, throw a special error
    if (conflicts.length > 0 && !shouldForceCreate) {
      throw { 
        code: 409, 
        message: conflicts.join(". "), 
        conflicts: conflicts,
        requiresConfirmation: true 
      };
    }

    // If all checks pass or user confirmed, add the appointment
    const newAppointment = { id: uuidv4(), ...appointment };
    appointments.push(newAppointment);
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
