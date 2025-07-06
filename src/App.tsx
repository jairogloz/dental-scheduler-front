import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format } from "date-fns";
import { parse } from "date-fns/parse";
import { startOfWeek } from "date-fns/startOfWeek";
import { getDay } from "date-fns/getDay";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useState } from "react";
import { enUS } from "date-fns/locale/en-US";
import { es } from "date-fns/locale/es"; // Import Spanish locale

const locales = {
  "en-US": enUS,
  "es-MX": es,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

type Event = {
  title: string;
  start: Date;
  end: Date;
  resourceId: string;
};

type AppointmentForm = {
  patientName: string;
  doctorName: string;
  treatmentType: string;
  resourceId: string;
  start: Date;
  end: Date;
};

const resourceColors: { [key: string]: string } = {
  "unidad-1": "#3B82F6", // Modern Blue - professional and calming
  "unidad-2": "#10B981", // Emerald Green - fresh and medical
  "unidad-3": "#8B5CF6", // Purple - sophisticated and distinctive
  "unidad-4": "#F59E0B", // Amber Orange - warm and energetic
  "unidad-5": "#EF4444", // Modern Red - attention-grabbing but not harsh
};

const eventPropGetter = (event: Event) => {
  const backgroundColor = resourceColors[event.resourceId] || "#ccc";
  return {
    style: {
      backgroundColor,
      color: "white",
      borderRadius: "4px",
      border: "none",
      padding: "2px 5px",
    },
  };
};

function App() {
  const [events, setEvents] = useState<Event[]>([
    {
      title: "Paciente Juan con Dr. Pérez",
      start: new Date(2024, 5, 5, 10, 0),
      end: new Date(2024, 5, 5, 11, 0),
      resourceId: "unidad-1",
    },
    {
      title: "Paciente Ana con Dr. López",
      start: new Date(2024, 5, 5, 11, 0),
      end: new Date(2024, 5, 5, 12, 0),
      resourceId: "unidad-2",
    },
  ]);

  const [view, setView] = useState<"month" | "week" | "day">("week");
  const [date, setDate] = useState<Date>(new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [appointmentForm, setAppointmentForm] = useState<AppointmentForm>({
    patientName: "",
    doctorName: "",
    treatmentType: "",
    resourceId: "",
    start: new Date(),
    end: new Date(),
  });

  const resources = [
    { resourceId: "unidad-1", resourceTitle: "Unidad 1" },
    { resourceId: "unidad-2", resourceTitle: "Unidad 2" },
    { resourceId: "unidad-3", resourceTitle: "Unidad 3" },
    { resourceId: "unidad-4", resourceTitle: "Unidad 4" },
  ];

  const handleSelectSlot = (slotInfo: any) => {
    setSelectedSlot(slotInfo);
    setAppointmentForm({
      patientName: "",
      doctorName: "",
      treatmentType: "",
      resourceId: slotInfo.resourceId || "",
      start: slotInfo.start,
      end: slotInfo.end,
    });
    setShowModal(true);
  };

  const handleAddAppointment = () => {
    const newEvent: Event = {
      title: `${appointmentForm.patientName} - ${appointmentForm.doctorName}`,
      start: appointmentForm.start,
      end: appointmentForm.end,
      resourceId: appointmentForm.resourceId,
    };

    setEvents([...events, newEvent]);
    setShowModal(false);
    setAppointmentForm({
      patientName: "",
      doctorName: "",
      treatmentType: "",
      resourceId: "",
      start: new Date(),
      end: new Date(),
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedSlot(null);
  };

  return (
    <div style={{ height: "100vh", padding: "20px" }}>
      <h1>Hola Brackets</h1>

      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={() => setView("month")}
          className={`view-button ${view === "month" ? "active" : ""}`}
        >
          Month
        </button>
        <button
          onClick={() => setView("week")}
          className={`view-button ${view === "week" ? "active" : ""}`}
        >
          Week
        </button>
        <button
          onClick={() => setView("day")}
          className={`view-button ${view === "day" ? "active" : ""}`}
        >
          Day
        </button>
      </div>

      <Calendar
        localizer={localizer}
        events={events}
        culture="es-MX" // Set culture to Spanish (Mexico)
        resources={view === "day" ? resources : undefined}
        resourceIdAccessor={view === "day" ? "resourceId" : undefined}
        resourceTitleAccessor="resourceTitle"
        startAccessor="start"
        endAccessor="end"
        date={date}
        onNavigate={(newDate) => setDate(newDate)}
        view={view}
        onView={setView}
        views={["month", "week", "day"]}
        step={15}
        timeslots={1}
        style={{ height: "70vh" }}
        selectable
        onSelectSlot={handleSelectSlot}
        onSelectEvent={(event) => {
          alert(`Evento: ${event.title}`);
        }}
        eventPropGetter={eventPropGetter}
        formats={{
          timeGutterFormat: (date) => format(date, "hh:mm a"), // AM/PM format for time slots
          agendaTimeFormat: (date) => format(date, "hh:mm a"), // AM/PM format for agenda view
        }}
        min={new Date(0, 0, 0, 7, 0, 0)} // Start at 7:00 AM
        max={new Date(0, 0, 0, 23, 0, 0)} // End at 11:00 PM
      />

      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "8px",
              width: "400px",
              maxWidth: "90vw",
            }}
          >
            <h3>Nueva Cita Dental</h3>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>
                Nombre del Paciente:
              </label>
              <input
                type="text"
                value={appointmentForm.patientName}
                onChange={(e) =>
                  setAppointmentForm({
                    ...appointmentForm,
                    patientName: e.target.value,
                  })
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>
                Nombre del Doctor:
              </label>
              <input
                type="text"
                value={appointmentForm.doctorName}
                onChange={(e) =>
                  setAppointmentForm({
                    ...appointmentForm,
                    doctorName: e.target.value,
                  })
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>
                Tipo de Tratamiento:
              </label>
              <input
                type="text"
                value={appointmentForm.treatmentType}
                onChange={(e) =>
                  setAppointmentForm({
                    ...appointmentForm,
                    treatmentType: e.target.value,
                  })
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>
                Unidad:
              </label>
              <select
                value={appointmentForm.resourceId}
                onChange={(e) =>
                  setAppointmentForm({
                    ...appointmentForm,
                    resourceId: e.target.value,
                  })
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
              >
                <option value="">Seleccionar Unidad</option>
                {resources.map((resource) => (
                  <option key={resource.resourceId} value={resource.resourceId}>
                    {resource.resourceTitle}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <p>
                <strong>Fecha y Hora:</strong>{" "}
                {appointmentForm.start.toLocaleString()} -{" "}
                {appointmentForm.end.toLocaleString()}
              </p>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button
                onClick={handleCloseModal}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleAddAppointment}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Agregar Cita
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
