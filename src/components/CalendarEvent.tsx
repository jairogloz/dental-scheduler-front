import React from "react";
import { format } from "date-fns";

interface CalendarEventProps {
  event: {
    title: string;
    appointmentId?: string;
    patientName?: string;
    doctorName?: string;
    isConfirmed?: boolean;
    isFirstVisit?: boolean;
    backgroundColor?: string; // For special events like "Seleccionado"
    start?: Date;
    end?: Date;
  };
}

const CalendarEvent: React.FC<CalendarEventProps> = ({ event }) => {
  // If it's a special event (like "Seleccionado"), just show the title
  if (event.backgroundColor || !event.patientName) {
    return <div style={{ fontSize: "inherit" }}>{event.title}</div>;
  }

  // Calculate duration in minutes
  const durationMinutes =
    event.start && event.end
      ? (event.end.getTime() - event.start.getTime()) / (1000 * 60)
      : 0;

  const isShortAppointment = durationMinutes < 30;

  // Common text style for overflow handling
  const textStyle: React.CSSProperties = {
    overflow: "hidden",
    textOverflow: "clip",
    whiteSpace: "nowrap",
  };

  return (
    <div
      style={{
        overflow: "hidden",
        lineHeight: "1.3",
        fontSize: "inherit",
      }}
    >
      {/* Show time only for appointments >= 30 min */}
      {!isShortAppointment && event.start && event.end && (
        <div style={{ ...textStyle, fontSize: "0.85em", opacity: 0.9 }}>
          {format(event.start, "h:mm a")} - {format(event.end, "h:mm a")}
        </div>
      )}

      {/* Patient line with checkmark */}
      <div style={textStyle}>
        {event.isConfirmed && "✓ "}
        <strong>{event.patientName}</strong>
      </div>

      {/* Primera visita always at the bottom */}
      {event.isFirstVisit && (
        <div style={{ ...textStyle, fontSize: "0.9em" }}>(Primera visita)</div>
      )}
    </div>
  );
};

export default CalendarEvent;
