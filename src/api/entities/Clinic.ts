export type Clinic = {
  id: string;
  name: string;
};

// In-memory storage
export const clinics: Clinic[] = [{ id: "clinic-1", name: "Clínica Central" }];
