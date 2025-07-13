import { v4 as uuidv4 } from "uuid";
import { delay } from "../utils";

export type Patient = {
  id: string;
  name: string;
  email: string;
};

// In-memory storage
const patients: Patient[] = [
  { id: uuidv4(), name: "Juan Pérez", email: "juan@example.com" },
  { id: uuidv4(), name: "Ana López", email: "ana@example.com" },
];

export const getPatients = async (): Promise<Patient[]> => {
  await delay(500);
  return patients;
};

export const createPatient = async (patient: Omit<Patient, "id">): Promise<Patient> => {
  await delay(500);
  const newPatient = { id: uuidv4(), ...patient };
  patients.push(newPatient);
  return newPatient;
};
