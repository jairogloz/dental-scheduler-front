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
  "#264653", // Deep teal-blue: professional, calming, modern
  "#2A9D8F", // Muted emerald: balanced, natural, fresh
  "#1D3557", // Navy blue: trustworthy, steady, serene
  "#4E342E", // Coffee brown: warm, stable, grounded
  "#6D597A", // Muted violet: creative, soothing, not overwhelming
  "#1B4965", // Steel blue: intellectual, trustworthy
  "#3A6351", // Forest green: natural, restorative, calm
  "#5E548E", // Lavender gray: balanced, sophisticated
  "#495057", // Charcoal gray: professional, neutral, timeless
  "#7B8CDE", // Muted periwinkle: calm, friendly, soft accent
  "#8B5E3C", // Chestnut brown: earthy, grounded, reassuring
  "#457B9D", // Ocean blue: fresh, clean, clear focus
  "#6B705C", // Olive-gray: natural, subtle, warm
  "#9C6644", // Terracotta brown: warm, inviting
  "#5B4B8A", // Indigo gray: creative, calm
  "#1E6091", // Deep cyan-blue: clear, professional
  "#335C67", // Deep forest teal: serious, stable
  "#5E548E", // Dusty purple: introspective, elegant
  "#283618", // Dark olive: earthy, calm
  "#7B2CBF", // Deep violet: confident, distinctive
];

// Clinic colors: Medium-bright colors for borders that stand out against white background
const clinicColors = [
  "#2A9D8F", // Teal green: modern, refreshing
  "#E76F51", // Terracotta orange: warm, friendly
  "#F4A261", // Golden amber: optimistic, inviting
  "#E9C46A", // Soft yellow: energetic but not harsh
  "#8AB17D", // Soft green: restorative, natural
  "#669BBC", // Clear blue: trustworthy, professional
  "#FF6B6B", // Coral red: visible, energetic
  "#9C89B8", // Lavender: creative, distinctive
  "#F28482", // Light coral: warm, approachable
  "#3D5A80", // Cool blue: stable, clean
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
