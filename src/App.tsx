import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format } from "date-fns";
import { parse } from "date-fns/parse";
import { startOfWeek } from "date-fns/startOfWeek";
import { getDay } from "date-fns/getDay";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useEffect, useState } from "react";
import { enUS } from "date-fns/locale/en-US";
import { es } from "date-fns/locale/es"; // Import Spanish locale
import AppointmentModal from "./components/Modal/Appointment/AppointmentModal";
import type { View } from "react-big-calendar";
import {
  getDoctors,
  getUnits,
  getAppointments,
  createAppointment,
} from "./api/useAPI";
import type { Doctor } from "./api/entities/Doctor";

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
  const [events, setEvents] = useState<Event[]>([]);
  const [view, setView] = useState<View>("week");
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
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [units, setUnits] = useState<
    { resourceId: string; resourceTitle: string }[]
  >([]);

  useEffect(() => {
    const fetchData = async () => {
      const [fetchedDoctors, fetchedUnits, fetchedAppointments] =
        await Promise.all([
          getDoctors(),
          getUnits("clinic-1"), // Assuming clinicId is "clinic-1"
          getAppointments(),
        ]);

      setDoctors(fetchedDoctors);
      setUnits(
        fetchedUnits.map((unit) => ({
          resourceId: unit.id,
          resourceTitle: unit.name,
        }))
      );
      setEvents(
        fetchedAppointments.map((appointment) => ({
          title: `${appointment.patientId} - ${appointment.doctorId}`,
          start: new Date(appointment.start),
          end: new Date(appointment.end),
          resourceId: appointment.unitId,
        }))
      );
    };

    fetchData();
  }, []);

  const handleSelectSlot = (slotInfo: any) => {
    setSelectedSlot(slotInfo);
    setAppointmentForm({
      patientName: "",
      doctorName: "",
      treatmentType: "",
      resourceId: slotInfo.resourceId || "",
      start: slotInfo.start, // Use the exact start time from the calendar
      end: slotInfo.end, // Use the exact end time from the calendar
    });
    setShowModal(true);
  };

  const handleAddAppointment = async () => {
    const newAppointment = {
      patientId: appointmentForm.patientName,
      doctorId:
        doctors.find((doc) => doc.name === appointmentForm.doctorName)?.id ||
        "",
      unitId: appointmentForm.resourceId,
      start: appointmentForm.start,
      end: appointmentForm.end,
    };

    try {
      const createdAppointment = await createAppointment(newAppointment);
      setEvents([
        ...events,
        {
          title: `${createdAppointment.patientId} - ${createdAppointment.doctorId}`,
          start: new Date(createdAppointment.start),
          end: new Date(createdAppointment.end),
          resourceId: createdAppointment.unitId,
        },
      ]);
      setShowModal(false);
      setAppointmentForm({
        patientName: "",
        doctorName: "",
        treatmentType: "",
        resourceId: "",
        start: new Date(),
        end: new Date(),
      });
    } catch (error) {
      console.error("Error creating appointment:", error);
      alert("Error creating appointment: " + error);
    }
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
        resources={view === "day" ? units : undefined}
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
        <AppointmentModal
          showModal={showModal}
          appointmentForm={appointmentForm}
          resources={units}
          doctors={doctors}
          handleCloseModal={handleCloseModal}
          handleAddAppointment={handleAddAppointment}
          setAppointmentForm={setAppointmentForm}
        />
      )}
    </div>
  );
}

export default App;
