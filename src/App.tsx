import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format } from "date-fns";
import { parse } from "date-fns/parse";
import { startOfWeek } from "date-fns/startOfWeek";
import { getDay } from "date-fns/getDay";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useEffect, useState, useMemo } from "react";
import { enUS } from "date-fns/locale/en-US";
import { es } from "date-fns/locale/es"; // Import Spanish locale
import AppointmentModal from "./components/Modal/Appointment/AppointmentModal";
import type { View } from "react-big-calendar";

// Note: organization-provided doctor objects may have a slightly different shape than the strict `Doctor` type.
// We'll accept any objects that contain an `id` string to avoid brittle type mismatches.
import {
  createAppointment,
  deleteAppointment,
  cancelAppointment,
} from "./api/entities/Appointment";
import { useWindowSize } from "./hooks/useWindowSize";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import ClinicFilterBar from "./components/ClinicFilterBar/ClinicFilterBar";
import { useAuth } from "./contexts/AuthContext";

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

const getDoctorColor = (
  doctorId?: string | null,
  doctors?: { id: string }[] | null
): string => {
  // Defensive: if we don't have a valid doctorId or doctors list, return a neutral color
  if (!doctorId || !Array.isArray(doctors) || doctors.length === 0) {
    return "#ccc";
  }

  const doctorIndex = doctors.findIndex((doctor) => doctor.id === doctorId);
  if (doctorIndex === -1) return "#ccc"; // Default color for unknown doctors
  return doctorColors[doctorIndex % doctorColors.length];
};

function App() {
  const { isMobile } = useWindowSize();
  const {
    organizationData,
    loadOrganizationData,
    appointmentCache,
    loadAppointmentsForRange,
    getAppointmentsInRange,
    addAppointmentToCache,
    removeAppointmentFromCache,
    cancelAppointmentInCache,
  } = useAuth();

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
  const [selectedClinics, setSelectedClinics] = useState<string[]>([]);

  // Get doctors and units from organization data
  // Accept any doctor-like objects from organizationData, but ensure they at least have an `id` field.
  // Memoize doctors to prevent infinite re-renders in useEffect dependencies
  const doctors: { id: string }[] = useMemo(
    () => (organizationData?.doctors as any) || [],
    [organizationData?.doctors]
  );
  const units = useMemo(
    () =>
      organizationData?.units.map((unit) => ({
        resourceId: unit.id,
        resourceTitle: unit.name,
      })) || [],
    [organizationData?.units]
  );
  // clinics are managed by selectedClinics state

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

  // Load organization data with current calendar view on initial load
  useEffect(() => {
    if (!organizationData) {
      // Loading organization data with calendar view
      // Map calendar view types to our supported types
      const viewType =
        view === "work_week" ? "week" : (view as "day" | "week" | "month");
      loadOrganizationData(date, viewType);
    }
  }, [organizationData, loadOrganizationData, date, view]);

  // Initialize selectedClinics to all clinics when organization data loads
  useEffect(() => {
    if (organizationData?.clinics && selectedClinics.length === 0) {
      const allClinicIds = organizationData.clinics.map((clinic) => clinic.id);
      setSelectedClinics(allClinicIds);
      // Initialized selectedClinics with all clinics
    }
  }, [organizationData?.clinics, selectedClinics.length]);

  // Calculate date range for current calendar view
  // Memoize this function to prevent infinite re-renders
  const getCalendarDateRange = useMemo(
    () =>
      (currentDate: Date, currentView: View): { start: Date; end: Date } => {
        let startDate: Date, endDate: Date;

        if (currentView === "day") {
          startDate = new Date(currentDate);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(currentDate);
          endDate.setHours(23, 59, 59, 999);
        } else if (currentView === "month") {
          startDate = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            1
          );
          endDate = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() + 1,
            0
          );
          endDate.setHours(23, 59, 59, 999);
        } else {
          // week view
          startDate = new Date(currentDate);
          startDate.setDate(startDate.getDate() - startDate.getDay());
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 6);
          endDate.setHours(23, 59, 59, 999);
        }

        return { start: startDate, end: endDate };
      },
    [] // This function doesn't depend on any variables, so empty dependency array
  );

  // Load appointments when calendar view or date changes
  useEffect(() => {
    const loadAppointmentsForCalendarView = async () => {
      if (!organizationData) return; // Wait for organization data to load

      const { start, end } = getCalendarDateRange(date, view);

      // Add buffer to the range
      const bufferedStart = new Date(start);
      bufferedStart.setDate(bufferedStart.getDate() - 7); // 1 week before
      const bufferedEnd = new Date(end);
      bufferedEnd.setDate(bufferedEnd.getDate() + 7); // 1 week after

      try {
        await loadAppointmentsForRange(bufferedStart, bufferedEnd);
        // Appointments loaded for calendar view
      } catch (error) {
        console.error(
          "❌ Failed to load appointments for calendar view:",
          error
        );
      }
    };

    loadAppointmentsForCalendarView();
  }, [date, view, organizationData, loadAppointmentsForRange]);

  // Update events based on appointment cache and clinic filter
  useEffect(() => {
    if (!organizationData) {
      setEvents([]);
      return;
    }

    const { start, end } = getCalendarDateRange(date, view);
    const appointments = getAppointmentsInRange(start, end);

    // Filter by selected clinics and exclude cancelled appointments
    const filteredAppointments = appointments.filter((appointment) => {
      // Exclude cancelled appointments from calendar display
      if (appointment.status === "cancelled") {
        return false;
      }

      const unit = organizationData.units.find(
        (u) => u.id === appointment.unitId
      );
      return unit && selectedClinics.includes(unit.clinic_id);
    });

    // Convert to calendar events
    const calendarEvents: Event[] = filteredAppointments.map((appointment) => {
      const doctor = doctors.find((d) => d.id === appointment.doctorId) as
        | { id: string; name?: string }
        | undefined;
      const doctorLabel =
        doctor && "name" in doctor
          ? doctor.name || doctor.id
          : appointment.doctorId;
      // Use patient_name directly from appointment object
      const patientLabel = appointment.patient_name || appointment.patientId;
      return {
        title: `${patientLabel} - ${doctorLabel}`,
        start: appointment.start,
        end: appointment.end,
        resourceId: appointment.doctorId,
        appointmentId: appointment.id,
      };
    });

    setEvents(calendarEvents);
  }, [
    appointmentCache.lastUpdated,
    date,
    view,
    selectedClinics,
    organizationData,
    doctors,
    getAppointmentsInRange,
  ]);

  // Polling mechanism for real-time updates (every 2 minutes)
  useEffect(() => {
    if (!organizationData) return; // Don't poll if no organization data

    const pollForUpdates = async () => {
      // Only poll when document is visible (user is active)
      if (document.visibilityState !== "visible") {
        // Skipping poll - document not visible
        return;
      }

      const { start, end } = getCalendarDateRange(date, view);

      try {
        // Polling for appointment updates
        await loadAppointmentsForRange(start, end);
      } catch (error) {
        console.error("❌ Failed to poll for appointment updates:", error);
      }
    };

    // Initial delay before first poll (to avoid immediate polling after load)
    const initialDelay = setTimeout(() => {
      const pollInterval = setInterval(pollForUpdates, 2 * 60 * 1000); // Every 2 minutes

      // Cleanup function
      return () => {
        clearInterval(pollInterval);
      };
    }, 2 * 60 * 1000); // Start polling after 2 minutes

    return () => {
      clearTimeout(initialDelay);
    };
  }, [organizationData, date, view, loadAppointmentsForRange]);

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
    try {
      // Use cached appointments instead of fetching from API
      const { start, end } = getCalendarDateRange(new Date(event.start), view);
      const appointments = getAppointmentsInRange(start, end);
      const selectedAppointment = appointments.find(
        (appointment) => appointment.id === event.appointmentId
      );

      if (!selectedAppointment) {
        alert("Appointment not found.");
        return;
      }

      setAppointmentForm({
        appointmentId: selectedAppointment.id,
        patientName:
          selectedAppointment.patient_name || selectedAppointment.patientId,
        patientId: selectedAppointment.patientId,
        doctorId: selectedAppointment.doctorId,
        doctorName:
          (
            doctors.find((doc) => doc.id === selectedAppointment.doctorId) as
              | { id: string; name?: string }
              | undefined
          )?.name || "",
        treatmentType: selectedAppointment.treatment,
        resourceId: selectedAppointment.unitId,
        start: new Date(selectedAppointment.start),
        end: new Date(selectedAppointment.end),
      });

      setModalMode("see-only");
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

    // Validate that we have a patient ID or name
    if (!appointmentForm.patientId && !appointmentForm.patientName) {
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

      // Add to appointment cache instead of events directly
      addAppointmentToCache(createdAppointment);

      // Navigate to appointment date but don't close modal (let success modal handle that)
      setDate(new Date(createdAppointment.start));

      // Reset form for next appointment
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

      // Return the created appointment so the modal can handle success
      return createdAppointment;
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
      console.log(`🚫 Cancelling appointment ${appointmentForm.appointmentId}`);

      // Cancel appointment (PATCH with status="cancelled")
      const cancelledAppointment = await cancelAppointment(
        appointmentForm.appointmentId
      );

      // Update appointment cache with cancelled appointment
      cancelAppointmentInCache(cancelledAppointment);

      console.log("✅ Appointment cancelled successfully");

      // Don't close modal or show alert - let the modal handle success display
      return cancelledAppointment; // Return the cancelled appointment
    } catch (error) {
      console.error("❌ Failed to cancel appointment:", error);
      // Let the modal handle error display, just throw the error
      throw error;
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
              addAppointmentToCache={addAppointmentToCache} // Pass cache update function
              cancelAppointmentInCache={cancelAppointmentInCache} // Pass cancel cache update function
              setAppointmentForm={setAppointmentForm}
            />
          )}
        </div>
      </div>
    </>
  );
}

export default App;
