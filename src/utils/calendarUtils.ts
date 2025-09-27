import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import type { View } from "react-big-calendar";

export const getCalendarDateRangeUtil = (date: Date, view: View) => {
  let start: Date;
  let end: Date;

  switch (view) {
    case "day":
      start = startOfDay(date);
      end = endOfDay(date);
      break;
    case "week":
      start = startOfWeek(date, { weekStartsOn: 1 }); // Monday start
      end = endOfWeek(date, { weekStartsOn: 1 });
      break;
    case "month":
      // For month view, we need a wider range to include partial weeks
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      start = startOfWeek(monthStart, { weekStartsOn: 1 });
      end = endOfWeek(monthEnd, { weekStartsOn: 1 });
      break;
    default:
      // Default to day view range
      start = startOfDay(date);
      end = endOfDay(date);
  }

  return { start, end };
};

// Color arrays for doctors and clinics
const doctorColors = [
  "#3498db", // Blue
  "#e74c3c", // Red
  "#2ecc71", // Green
  "#f39c12", // Orange
  "#9b59b6", // Purple
  "#1abc9c", // Turquoise
  "#e67e22", // Dark Orange
  "#34495e", // Dark Blue-Gray
];

const clinicColors = [
  "#3498db", // Blue
  "#e74c3c", // Red
  "#2ecc71", // Green
  "#f39c12", // Orange
  "#9b59b6", // Purple
  "#1abc9c", // Turquoise
  "#e67e22", // Dark Orange
  "#95a5a6", // Gray
];

export const getDoctorColor = (
  doctorId: string,
  doctors?: { id: string }[] | null
): string => {
  if (!doctorId || !Array.isArray(doctors) || doctors.length === 0) {
    return "#9CA3AF"; // Neutral gray
  }

  const doctorIndex = doctors.findIndex((doctor) => doctor.id === doctorId);
  return doctorColors[
    doctorIndex === -1 ? 0 : doctorIndex % doctorColors.length
  ];
};

export const getClinicColor = (
  clinicId?: string,
  clinics?: { id: string }[] | null
): string => {
  if (!clinicId || !Array.isArray(clinics) || clinics.length === 0) {
    return "#9CA3AF"; // Neutral gray
  }

  const clinicIndex = clinics.findIndex((clinic) => clinic.id === clinicId);
  return clinicColors[
    clinicIndex === -1 ? 0 : clinicIndex % clinicColors.length
  ];
};
