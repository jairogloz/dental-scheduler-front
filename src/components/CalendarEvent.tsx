import React from "react";

interface CalendarEventProps {
  event: {
    title: string;
    appointmentId?: string;
    patientName?: string;
    doctorName?: string;
    isConfirmed?: boolean;
    isFirstVisit?: boolean;
    backgroundColor?: string; // For special events like "Seleccionado"
  };
}

const CalendarEvent: React.FC<CalendarEventProps> = ({ event }) => {
  // If it's a special event (like "Seleccionado"), just show the title
  if (event.backgroundColor || !event.patientName) {
    return <div style={{ fontSize: "inherit" }}>{event.title}</div>;
  }

  return (
    <div
      style={{
        whiteSpace: "normal",
        overflow: "visible",
        lineHeight: "1.3",
        fontSize: "inherit",
      }}
    >
      {event.isFirstVisit && (
        <div style={{ fontSize: "0.9em", marginBottom: "2px" }}>
          (Primera visita)
        </div>
      )}
      <div>
        {event.isConfirmed && "✓ "}
        Px: <strong>{event.patientName}</strong>
      </div>
      <div>Dx: {event.doctorName}</div>
    </div>
  );
};

export default CalendarEvent;
