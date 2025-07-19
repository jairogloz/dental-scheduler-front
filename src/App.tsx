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
import {
  deleteAppointment,
  getAppointments as getAppointmentsEntity,
} from "./api/entities/Appointment";
import { tr } from "date-fns/locale";

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
  appointmentId: string;
  title: string;
  start: Date;
  end: Date;
  resourceId: string;
};

type AppointmentForm = {
  appointmentId: string; // Add appointmentId
  patientName: string;
  doctorId: string;
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
  const [modalMode, setModalMode] = useState<"create" | "edit" | "see-only">(
    "create"
  );
  const [appointmentForm, setAppointmentForm] = useState<AppointmentForm>({
    appointmentId: "", // Initialize appointmentId
    patientName: "",
    doctorId: "",
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
          appointmentId: appointment.id,
        }))
      );
    };

    fetchData();
  }, []);

  const handleSelectSlot = (slotInfo: any) => {
    setSelectedSlot(slotInfo);
    setAppointmentForm({
      appointmentId: "", // Reset appointmentId
      patientName: "",
      doctorId: "",
      doctorName: "",
      treatmentType: "",
      resourceId: slotInfo.resourceId || "",
      start: slotInfo.start, // Use the exact start time from the calendar
      end: slotInfo.end, // Use the exact end time from the calendar
    });
    setModalMode("create");
    setShowModal(true);
  };

  const handleSelectEvent = async (event: Event) => {
    console.log("Selected event:", event);
    const isPastEvent = event.start < new Date();

    try {
      const appointments = await getAppointmentsEntity(); // Fetch appointments from memory
      const selectedAppointment = appointments.find(
        (appointment) => appointment.id === event.appointmentId
      );
      console.log("Selected appointment:", selectedAppointment);

      if (!selectedAppointment) {
        alert("Appointment not found.");
        return;
      }

      setAppointmentForm({
        appointmentId: selectedAppointment.id,
        patientName: selectedAppointment.patientId,
        doctorId: selectedAppointment.doctorId,
        doctorName:
          doctors.find((doc) => doc.id === selectedAppointment.doctorId)
            ?.name || "",
        treatmentType: selectedAppointment.treatment,
        resourceId: selectedAppointment.unitId,
        start: new Date(selectedAppointment.start),
        end: new Date(selectedAppointment.end),
      });

      setModalMode(isPastEvent ? "see-only" : "edit");
      setShowModal(true);
      setSelectedSlot(null);
    } catch (error) {
      console.error("Error fetching appointment:", error);
      alert("An error occurred while loading the appointment.");
    }
  };

  const handleAddAppointment = async () => {
    console.log("doctorId:", appointmentForm.doctorId);
    console.log("doctors:", doctors);
    const selectedDoctor = doctors.find(
      (doc) => doc.id === appointmentForm.doctorId // Match by doctor ID
    );

    if (!selectedDoctor) {
      alert("Please select a valid doctor.");
      return;
    }

    const newAppointment = {
      patientId: appointmentForm.patientName,
      doctorId: selectedDoctor.id,
      treatment: appointmentForm.treatmentType,
      unitId: appointmentForm.resourceId,
      start: appointmentForm.start,
      end: appointmentForm.end,
    };

    try {
      const createdAppointment = await createAppointment(newAppointment);
      setEvents([
        ...events,
        {
          title: `${createdAppointment.patientId} - ${selectedDoctor.name}`, // Show doctor name in the event title
          start: new Date(createdAppointment.start),
          end: new Date(createdAppointment.end),
          resourceId: createdAppointment.unitId,
          appointmentId: createdAppointment.id,
        },
      ]);
      setShowModal(false);
      setAppointmentForm({
        appointmentId: "", // Reset appointmentId
        patientName: "",
        doctorId: "",
        doctorName: "",
        treatmentType: "",
        resourceId: "",
        start: new Date(),
        end: new Date(),
      });
    } catch (error) {
      if (error && typeof error === "object" && "message" in error) {
        alert(error.message); // Show specific error message to the user
      } else {
        console.error("Unexpected error:", error);
        alert("An unexpected error occurred. Please try again."); // Generic error message
      }
    }
  };

  const handleCancelAppointment = async () => {
    try {
      console.log(
        "appointmentForm.appointmentId:",
        appointmentForm.appointmentId
      );
      await deleteAppointment(appointmentForm.appointmentId); // Use appointmentId for deletion
      setEvents(
        events.filter(
          (event) => event.appointmentId !== appointmentForm.appointmentId
        )
      );
      setShowModal(false);
    } catch (error) {
      if (error && typeof error === "object" && "message" in error) {
        alert(error.message); // Show specific error message to the user
      } else {
        console.error("Unexpected error:", error);
        alert("An unexpected error occurred. Please try again."); // Generic error message
      }
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
        onSelectEvent={handleSelectEvent}
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
          mode={modalMode} // Pass the mode to the modal
          appointmentForm={appointmentForm}
          resources={units}
          doctors={doctors}
          handleCloseModal={handleCloseModal}
          handleAddAppointment={handleAddAppointment}
          handleCancelAppointment={handleCancelAppointment} // Pass the cancel handler
          setAppointmentForm={setAppointmentForm}
        />
      )}
    </div>
  );
}

export default App;
