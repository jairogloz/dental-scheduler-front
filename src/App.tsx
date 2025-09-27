import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format } from "date-fns";
import { parse } from "date-fns/parse";
import { startOfWeek } from "date-fns/startOfWeek";
import { getDay } from "date-fns/getDay";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useState, useMemo, useCallback, useEffect } from "react";
import { enUS } from "date-fns/locale/en-US";
import { es } from "date-fns/locale/es";
import type { View } from "react-big-calendar";

// Components
import AppointmentModal from "./components/Modal/Appointment/AppointmentModal";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import ClinicFilterBar from "./components/ClinicFilterBar/ClinicFilterBar";

// Hooks
import { useWindowSize } from "./hooks/useWindowSize";
import { useAuth } from "./contexts/AuthContext";
import { useOrganizationQuery } from "./hooks/queries/useOrganizationQuery";
import {
  useFilteredAppointments,
  useCreateAppointment,
} from "./hooks/queries/useAppointmentsQuery";

// Utils
import {
  getCalendarDateRangeUtil,
  getDoctorColor,
  getClinicColor,
} from "./utils/calendarUtils";

const locales = {
  "en-US": enUS,
  "es-MX": es,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales,
});

type Event = {
  appointmentId: string;
  title: string;
  start: Date;
  end: Date;
  resourceId: string;
  clinicId?: string;
};

type AppointmentForm = {
  appointmentId: string;
  patientName: string;
  patientId: string;
  patientPhone?: string;
  doctorId: string;
  doctorName: string;
  treatmentType: string;
  resourceId: string;
  start: Date;
  end: Date;
};

function App() {
  const { isMobile } = useWindowSize();
  const { organizationId } = useAuth();

  // UI State
  const [view, setView] = useState<View>(isMobile ? "day" : "week");
  const [date, setDate] = useState<Date>(new Date());
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "see-only">(
    "create"
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState("appointments");
  const [selectedClinics, setSelectedClinics] = useState<string[]>([]);

  // Form state
  const [appointmentForm, setAppointmentForm] = useState<AppointmentForm>({
    appointmentId: "",
    patientName: "",
    patientId: "",
    doctorId: "",
    doctorName: "",
    treatmentType: "",
    resourceId: "",
    start: new Date(),
    end: new Date(),
  });

  // Data queries - only call useOrganizationQuery once
  const { data: organizationData, isLoading: organizationLoading } =
    useOrganizationQuery();

  // Extract doctors from organization data to avoid multiple API calls
  const doctors = organizationData?.doctors || [];

  // Calculate date range for appointments query
  const dateRange = useMemo(() => {
    return getCalendarDateRangeUtil(date, view);
  }, [date, view]);

  // Get filtered appointments for the current view
  const { appointments: filteredAppointments, isLoading: appointmentsLoading } =
    useFilteredAppointments(
      dateRange.start,
      dateRange.end,
      selectedClinics,
      true // exclude cancelled
    );

  // Initialize selected clinics when organization data loads
  const allClinicIds = useMemo(() => {
    return organizationData?.clinics?.map((clinic) => clinic.id) || [];
  }, [organizationData?.clinics]);

  // Set initial clinic selection
  useEffect(() => {
    if (allClinicIds.length > 0 && selectedClinics.length === 0) {
      setSelectedClinics(allClinicIds);
    }
  }, [allClinicIds, selectedClinics.length]);

  // Transform appointments to calendar events (memoized)
  const events = useMemo((): Event[] => {
    if (!filteredAppointments.length || !organizationData) return [];

    return filteredAppointments.map((appointment) => {
      const doctor = doctors.find((d) => d.id === appointment.doctorId);
      const doctorLabel = doctor?.name || appointment.doctorId;
      const patientLabel = appointment.patient_name || appointment.patientId;

      // Find unit and clinic for styling
      const unit = organizationData.units.find(
        (u) => u.id === appointment.unitId
      );
      const clinicId = unit?.clinic_id;

      // Add checkmark for confirmed appointments
      const checkmark = appointment.status === "confirmed" ? "✓ " : "";

      return {
        title: `${checkmark}Px: ${patientLabel}\nDr: ${doctorLabel} \nID: ${appointment.id}`,
        start: appointment.start,
        end: appointment.end,
        resourceId: appointment.doctorId,
        appointmentId: appointment.id,
        clinicId,
      };
    });
  }, [filteredAppointments, organizationData, doctors]);

  // Stable event styling function
  const eventPropGetter = useCallback(
    (event: Event) => {
      const backgroundColor = getDoctorColor(event.resourceId, doctors);
      const clinicColor = getClinicColor(
        event.clinicId,
        organizationData?.clinics
      );

      return {
        style: {
          backgroundColor,
          color: "white",
          borderRadius: "4px",
          border: "none",
          padding: "2px 5px",
          opacity: "0.95",
          fontSize: "13.5px",
          fontWeight: "500",
          outline: `2px solid ${clinicColor}`,
          outlineOffset: "-1px",
        },
        className: "calendar-event-with-clinic-outline",
      };
    },
    [doctors, organizationData?.clinics]
  );

  // Stable callback handlers
  const handleSelectSlot = useCallback(
    (slotInfo: any) => {
      if (!organizationData?.doctors?.length) {
        alert("No doctors available. Please add doctors first.");
        return;
      }

      // Get first clinic and its first unit as defaults
      const firstClinic = organizationData.clinics?.[0];
      const firstUnitOfFirstClinic = firstClinic
        ? organizationData.units?.find(
            (unit) => unit.clinic_id === firstClinic.id
          )
        : null;

      const defaultDoctor = organizationData.doctors[0];
      setAppointmentForm({
        appointmentId: "",
        patientName: "",
        patientId: "",
        doctorId: defaultDoctor.id,
        doctorName: defaultDoctor.name || defaultDoctor.id,
        treatmentType: "",
        resourceId: firstUnitOfFirstClinic?.id || "", // Use first unit ID as resourceId
        start: slotInfo.start,
        end: slotInfo.end,
      });
      setModalMode("create");
      setShowModal(true);
    },
    [
      organizationData?.doctors,
      organizationData?.clinics,
      organizationData?.units,
    ]
  );

  const handleSelectEvent = useCallback(
    (event: Event) => {
      const appointment = filteredAppointments.find(
        (apt) => apt.id === event.appointmentId
      );
      if (!appointment) return;

      const doctor = doctors.find((d) => d.id === appointment.doctorId);

      setAppointmentForm({
        appointmentId: appointment.id,
        patientName: appointment.patient_name || "",
        patientId: appointment.patientId,
        patientPhone: appointment.patient_phone || "",
        doctorId: appointment.doctorId,
        doctorName: doctor?.name || appointment.doctorId,
        treatmentType: appointment.treatment || "",
        resourceId: appointment.unitId, // Use unitId instead of doctorId for clinic/unit lookup
        start: appointment.start,
        end: appointment.end,
      });
      setModalMode("see-only");
      setShowModal(true);
    },
    [filteredAppointments, doctors]
  );

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
  }, []);

  // Mutation for creating appointments
  const createAppointmentMutation = useCreateAppointment();

  const handleAddAppointment = useCallback(
    async (appointmentData: any) => {
      try {
        await createAppointmentMutation.mutateAsync(appointmentData);
        // Don't close modal here - let the success modal handle it
      } catch (error) {
        console.error("❌ Failed to create appointment:", error);
        alert("Failed to create appointment. Please try again.");
      }
    },
    [createAppointmentMutation]
  );

  // Show loading state
  if (organizationLoading && !organizationData) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <div>Loading organization data...</div>
      </div>
    );
  }

  // Show error state
  if (!organizationId) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <div>No organization access. Please contact support.</div>
      </div>
    );
  }

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

        <div style={{ padding: isMobile ? "10px" : "20px" }}>
          {organizationData ? (
            <>
              <ClinicFilterBar
                selectedClinics={selectedClinics}
                onClinicsChange={setSelectedClinics}
                clinics={organizationData.clinics}
                getClinicColor={(clinicId) =>
                  getClinicColor(clinicId, organizationData.clinics)
                }
              />

              {appointmentsLoading ? (
                <div style={{ textAlign: "center", padding: "20px" }}>
                  Loading appointments...
                </div>
              ) : (
                <Calendar
                  localizer={localizer}
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: isMobile ? 500 : 600, marginTop: "20px" }}
                  onSelectSlot={handleSelectSlot}
                  onSelectEvent={handleSelectEvent}
                  selectable
                  popup
                  view={view}
                  onView={setView}
                  date={date}
                  onNavigate={setDate}
                  eventPropGetter={eventPropGetter}
                  step={15}
                  timeslots={1}
                  showMultiDayTimes
                  formats={{
                    timeGutterFormat: (date) => {
                      // Show time label for every 15-minute increment
                      return format(date, "h:mm a");
                    },
                    agendaTimeFormat: (date) => format(date, "hh:mm a"),
                    eventTimeRangeFormat: ({ start, end }) =>
                      `${format(start, "hh:mm a")} - ${format(end, "hh:mm a")}`,
                  }}
                  min={new Date(0, 0, 0, 7, 0, 0)}
                  max={new Date(0, 0, 0, 23, 0, 0)}
                />
              )}
            </>
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                backgroundColor: "white",
                borderRadius: "8px",
              }}
            >
              <h2>No Organization Data</h2>
              <p>
                Unable to load organization data. Please try refreshing the
                page.
              </p>
            </div>
          )}
        </div>

        {showModal && (
          <AppointmentModal
            showModal={showModal}
            mode={modalMode}
            appointmentForm={appointmentForm}
            doctors={doctors}
            clinics={organizationData?.clinics || []}
            units={organizationData?.units || []}
            handleCloseModal={handleCloseModal}
            handleAddAppointment={handleAddAppointment}
            setAppointmentForm={setAppointmentForm}
            appointments={filteredAppointments}
          />
        )}
      </div>
    </>
  );
}

export default App;
