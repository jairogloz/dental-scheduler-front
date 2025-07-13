import { delay } from "../utils";

export type Unit = {
  id: string;
  clinicId: string;
  name: string;
};

// In-memory storage
const units: Unit[] = [
  { id: "unidad-1", clinicId: "clinic-1", name: "Unidad 1" },
  { id: "unidad-2", clinicId: "clinic-1", name: "Unidad 2" },
];

export const getUnits = async (clinicId: string): Promise<Unit[]> => {
  await delay(500);
  return units.filter((unit) => unit.clinicId === clinicId);
};
