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
// Doctor colors: Dark, professional colors with good white text contrast and psychological comfort
const doctorColors = [
  "#2C3E50", // Deep blue-gray: professional, trustworthy, calming
  "#27AE60", // Forest green: natural, balanced, soothing
  "#8E44AD", // Deep purple: sophisticated, creative, calm
  "#16A085", // Dark teal: refreshing, modern, stable
  "#D35400", // Warm orange-brown: energetic but grounded, approachable
  "#7F8C8D", // Slate gray: neutral, professional, easy on eyes
  "#2980B9", // Deep blue: trustworthy, reliable, calming
  "#A0522D", // Saddle brown: warm, stable, earthy
  "#5D4E75", // Muted purple: calming, sophisticated
  "#2F4F4F", // Dark slate gray: professional, timeless
];

// Clinic colors: Medium-bright colors for borders that stand out against white background
const clinicColors = [
  "#3498DB", // Bright blue: trustworthy, professional, highly visible
  "#E74C3C", // Coral red: energetic, attention-grabbing, warm
  "#2ECC71", // Emerald green: fresh, positive, natural
  "#F39C12", // Golden orange: optimistic, friendly, vibrant
  "#9B59B6", // Rich purple: sophisticated, creative, distinctive
  "#1ABC9C", // Turquoise: modern, calm, refreshing
  "#E67E22", // Burnt orange: warm, energetic, professional
  "#34495E", // Steel blue: stable, trustworthy, modern
  "#E91E63", // Rose pink: caring, warm, distinctive
  "#00BCD4", // Cyan: fresh, modern, tech-forward
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
