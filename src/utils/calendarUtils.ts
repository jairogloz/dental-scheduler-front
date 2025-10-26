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
      end = endOfWeek(date, { weekStartsOn: 1 }); // Sunday end at 23:59:59.999
      // Ensure we capture the full Sunday by extending to end of day
      end = endOfDay(end);
      break;
    case "month":
      // For month view, we need a wider range to include partial weeks
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      start = startOfWeek(monthStart, { weekStartsOn: 1 });
      end = endOfWeek(monthEnd, { weekStartsOn: 1 });
      // Ensure we capture the full last day
      end = endOfDay(end);
      break;
    default:
      // Default to day view range
      start = startOfDay(date);
      end = endOfDay(date);
  }

  return { start, end };
};

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

/**
 * Darkens a hex color while preserving its hue and saturation
 * @param color - Hex color string (e.g., "#3B82F6")
 * @param percent - Percentage to darken (0-100). Default is 40 for good contrast
 * @returns Darkened hex color string with preserved color identity
 */
export const darkenColor = (color: string, percent: number = 40): string => {
  // Remove # if present
  const hex = color.replace("#", "");
  
  // Parse RGB values (0-255)
  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;
  
  // Convert RGB to HSL
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  let l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  // Darken by reducing lightness while keeping hue and saturation
  l = Math.max(0, l * (1 - percent / 100));
  
  // Boost saturation slightly to maintain vibrancy
  s = Math.min(1, s * 1.2);

  // Convert HSL back to RGB
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  let newR, newG, newB;
  if (s === 0) {
    newR = newG = newB = l; // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    newR = hue2rgb(p, q, h + 1/3);
    newG = hue2rgb(p, q, h);
    newB = hue2rgb(p, q, h - 1/3);
  }

  // Convert back to 0-255 range and hex
  const toHex = (n: number) => {
    const hex = Math.round(n * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
};

export const getDoctorColor = (
  doctorId: string,
  doctors?: { id: string; color?: string }[] | null
): string => {
  if (!doctorId || !Array.isArray(doctors) || doctors.length === 0) {
    return "#9CA3AF"; // Neutral gray
  }

  const doctor = doctors.find((d) => d.id === doctorId);
  
  // Use the color from the backend if available, otherwise fall back to neutral gray
  return doctor?.color || "#dcdce3";
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
