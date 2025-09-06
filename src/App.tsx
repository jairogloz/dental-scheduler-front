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
import { getDoctors, getUnits, getAppointments } from "./api/useAPI";
import type { Doctor } from "./api/entities/Doctor";
import {
  createAppointment,
  deleteAppointment,
  getAppointments as getAppointmentsEntity,
} from "./api/entities/Appointment";
import { useWindowSize } from "./hooks/useWindowSize";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import ClinicFilterBar from "./components/ClinicFilterBar/ClinicFilterBar";

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
  patientId: string; // Add patientId
  doctorId: string;
  doctorName: string;
  treatmentType: string;
  resourceId: string;
  start: Date;
  end: Date;
};

// Doctor colors - will be dynamically assigned based on available doctors
const doctorColors: string[] = [
  "#3B82F6", // Modern Blue - professional and calming
  "#10B981", // Emerald Green - fresh and medical
  "#8B5CF6", // Purple - sophisticated and distinctive
  "#F59E0B", // Amber Orange - warm and energetic
  "#EF4444", // Modern Red - attention-grabbing but not harsh
  "#06B6D4", // Cyan - medical and clean
  "#8B5A2B", // Brown - warm and reliable
  "#EC4899", // Pink - caring and approachable
];

const getDoctorColor = (doctorId: string, doctors: Doctor[]): string => {
  const doctorIndex = doctors.findIndex((doctor) => doctor.id === doctorId);
  if (doctorIndex === -1) return "#ccc"; // Default color for unknown doctors
  return doctorColors[doctorIndex % doctorColors.length];
};

function App() {
  const { isMobile } = useWindowSize();
  const [events, setEvents] = useState<Event[]>([]);
  const [view, setView] = useState<View>(isMobile ? "day" : "week");
  const [date, setDate] = useState<Date>(new Date());
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "see-only">(
    "create"
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState("appointments");
  const [appointmentForm, setAppointmentForm] = useState<AppointmentForm>({
    appointmentId: "", // Initialize appointmentId
    patientName: "",
    patientId: "", // Initialize patientId
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
  const [selectedClinics, setSelectedClinics] = useState<string[]>([]);

  // Event styling function - now based on doctor
  const eventPropGetter = (event: Event) => {
    const backgroundColor = getDoctorColor(event.resourceId, doctors);
    return {
      style: {
        backgroundColor,
        color: "white",
        borderRadius: "4px",
        border: "none",
        padding: "2px 5px",
        opacity: "0.95", // Slight transparency to show overlaps
        fontSize: "13.5px", // Slightly smaller font for better fit
        fontWeight: "500", // Medium font weight for better readability
        outline: "1px solid rgba(255, 255, 255, 0.8)", // Additional outer outline for extra separation
      },
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
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
          fetchedAppointments.map((appointment) => {
            const doctor = fetchedDoctors.find(
              (d) => d.id === appointment.doctorId
            );
            return {
              title: `${appointment.patientId} - ${
                doctor?.name || appointment.doctorId
              }`,
              start: new Date(appointment.start),
              end: new Date(appointment.end),
              resourceId: appointment.doctorId, // Changed from unitId to doctorId for color assignment
              appointmentId: appointment.id,
            };
          })
        );
      } catch (error) {
        console.error("Error fetching data:", error);
        // Set empty arrays as fallback to prevent UI errors
        setDoctors([]);
        setUnits([]);
        setEvents([]);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    // Set view to "day" when switching to mobile
    if (isMobile && view !== "day") {
      setView("day");
    }
    // Auto-collapse sidebar on mobile
    if (isMobile && !sidebarCollapsed) {
      setSidebarCollapsed(true);
    }
  }, [isMobile, view, sidebarCollapsed]);

  const handleSelectSlot = (slotInfo: any) => {
    setAppointmentForm({
      appointmentId: "", // Reset appointmentId
      patientName: "",
      patientId: "", // Reset patientId
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
    const isPastEvent = event.start < new Date();

    try {
      const appointments = await getAppointmentsEntity(); // Fetch appointments from memory
      const selectedAppointment = appointments.find(
        (appointment) => appointment.id === event.appointmentId
      );

      if (!selectedAppointment) {
        alert("Appointment not found.");
        return;
      }

      setAppointmentForm({
        appointmentId: selectedAppointment.id,
        patientName: selectedAppointment.patientId, // This needs to be fixed to get actual patient name
        patientId: selectedAppointment.patientId,
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
    } catch (error) {
      console.error("Error fetching appointment:", error);
      alert("An error occurred while loading the appointment.");
    }
  };

  const handleNewAppointmentClick = () => {
    const startTime = getNextHourDate();
    const endTime = new Date(startTime.getTime() + 30 * 60000); // Add 30 minutes

    setAppointmentForm({
      appointmentId: "",
      patientName: "",
      patientId: "", // Add patientId
      doctorId: "",
      doctorName: "",
      treatmentType: "",
      resourceId: "",
      start: startTime,
      end: endTime,
    });
    setModalMode("create");
    setShowModal(true);
  };

  const handleAddAppointment = async (forceCreate: boolean = false) => {
    const selectedDoctor = doctors.find(
      (doc) => doc.id === appointmentForm.doctorId // Match by doctor ID
    );

    if (!selectedDoctor) {
      alert("Por favor selecciona un doctor válido.");
      return;
    }

    // Validate that we have a patient ID
    if (!appointmentForm.patientId) {
      alert("Por favor selecciona un paciente antes de crear la cita.");
      return;
    }

    const newAppointment = {
      patientId: appointmentForm.patientId, // Use patientId instead of patientName
      doctorId: selectedDoctor.id,
      treatment: appointmentForm.treatmentType,
      unitId: appointmentForm.resourceId,
      start: appointmentForm.start,
      end: appointmentForm.end,
    };

    try {
      const createdAppointment = await createAppointment(
        newAppointment,
        forceCreate
      );
      setEvents([
        ...events,
        {
          title: `${appointmentForm.patientName} - ${selectedDoctor.name}`, // Use patientName for display
          start: new Date(createdAppointment.start),
          end: new Date(createdAppointment.end),
          resourceId: createdAppointment.doctorId, // Changed from unitId to doctorId for color assignment
          appointmentId: createdAppointment.id,
        },
      ]);
      setShowModal(false);
      setDate(new Date(createdAppointment.start)); // Navigate to appointment date
      setAppointmentForm({
        appointmentId: "", // Reset appointmentId
        patientName: "",
        patientId: "", // Reset patientId
        doctorId: "",
        doctorName: "",
        treatmentType: "",
        resourceId: "",
        start: new Date(),
        end: new Date(),
      });
    } catch (error) {
      if (error && typeof error === "object" && "message" in error) {
        // Check if this is a conflict that requires confirmation
        if ("requiresConfirmation" in error && error.requiresConfirmation) {
          const confirmMessage = `${error.message}\n\n¿Quieres crear la cita de todas formas?`;
          if (window.confirm(confirmMessage)) {
            // User confirmed, try again with forceCreate = true
            // Don't pass the event, pass true explicitly
            handleAddAppointment(true);
          }
        } else {
          alert(error.message); // Show specific error message to the user (now in Spanish)
        }
      } else {
        console.error("Error inesperado:", error);
        alert("Ocurrió un error inesperado. Por favor intenta de nuevo."); // Generic error message in Spanish
      }
    }
  };

  const handleCancelAppointment = async () => {
    try {
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
  };

  const getNextHourDate = () => {
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(now.getHours() + 1, 0, 0, 0);
    return nextHour;
  };

  return (
    <>
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        isMobile={isMobile}
      />
      <div
        style={{
          marginLeft: isMobile ? "0" : sidebarCollapsed ? "60px" : "240px",
          transition: "margin-left 0.3s ease",
          minHeight: "100vh",
          backgroundColor: "#f8fafc",
        }}
      >
        <Header />
        <div style={{ padding: "20px" }}>
          {activeSection === "appointments" ? (
            <>
              <div
                style={{
                  marginBottom: "20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h1
                  style={{
                    margin: 0,
                    fontSize: "24px",
                    fontWeight: "600",
                    color: "#1f2937",
                  }}
                >
                  Gestión de Citas
                </h1>
                <button
                  onClick={handleNewAppointmentClick}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#218838";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#28a745";
                  }}
                >
                  Agregar cita
                </button>
              </div>

              <ClinicFilterBar
                selectedClinics={selectedClinics}
                onClinicsChange={setSelectedClinics}
              />

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
                style={{
                  height: "70vh",
                  backgroundColor: "white",
                  borderRadius: "8px",
                }}
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
            </>
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                backgroundColor: "white",
                borderRadius: "8px",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "20px",
                  color: "#6b7280",
                  fontWeight: "500",
                }}
              >
                {activeSection === "patients" && "Gestión de Pacientes"}
                {activeSection === "doctors" && "Gestión de Doctores"}
                {activeSection === "expenses" && "Gestión de Gastos"}
                {activeSection === "reports" && "Reportes"}
                {activeSection === "settings" && "Configuración"}
              </h2>
              <p
                style={{
                  margin: "16px 0 0 0",
                  color: "#9ca3af",
                  fontSize: "16px",
                }}
              >
                Esta sección estará disponible próximamente.
              </p>
            </div>
          )}

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
      </div>
    </>
  );
}

export default App;
