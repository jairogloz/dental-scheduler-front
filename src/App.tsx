import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import { format } from "date-fns";
import { parse } from "date-fns/parse";
import { startOfWeek } from "date-fns/startOfWeek";
import { getDay } from "date-fns/getDay";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useState, useMemo, useCallback, useEffect } from "react";
import { enUS } from "date-fns/locale/en-US";
import { es } from "date-fns/locale/es";
import type { View } from "react-big-calendar";
import type { Patient } from "./api/entities/Patient";

// Components
import AppointmentModal from "./components/Modal/Appointment/AppointmentModal";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import ClinicFilterBar from "./components/ClinicFilterBar/ClinicFilterBar";
import DoctorFilterBar from "./components/DoctorFilterBar/DoctorFilterBar";
import CalendarEvent from "./components/CalendarEvent";
import ConfirmationDialog from "./components/Modal/ConfirmationDialog";

// Hooks
import { useWindowSize } from "./hooks/useWindowSize";
import { useAuth } from "./contexts/AuthContext";
import { useOrganizationQuery } from "./hooks/queries/useOrganizationQuery";
import {
  useFilteredAppointments,
  useCreateAppointment,
  useUpdateAppointment,
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

// Create DnD Calendar component with proper typing
const DnDCalendar = withDragAndDrop<Event>(Calendar);

// Spanish messages for calendar toolbar
const messages = {
  today: "Hoy",
  previous: "Atrás",
  next: "Siguiente",
  month: "Mes",
  week: "Semana",
  day: "Día",
  agenda: "Agenda",
  date: "Fecha",
  time: "Hora",
  event: "Evento",
  allDay: "Todo el día",
  yesterday: "Ayer",
  tomorrow: "Mañana",
  noEventsInRange: "No hay eventos en este rango.",
  showMore: (total: number) => `+ Ver más (${total})`,
};

type Event = {
  appointmentId: string;
  title: string;
  start: Date;
  end: Date;
  resourceId: string;
  clinicId?: string;
  patientName?: string;
  doctorName?: string;
  isConfirmed?: boolean;
  isFirstVisit?: boolean;
};

type AppointmentForm = {
  appointmentId: string;
  patient?: Patient; // Full patient object from backend
  patientName: string;
  patientId: string;
  patientPhone?: string;
  doctorId: string;
  doctorName: string;
  serviceId: string;
  serviceName?: string;
  resourceId: string;
  start: Date;
  end: Date;
  status?: string;
  is_first_visit?: boolean;
  notes?: string;
};

type BlockingDialogState = {
  title: string;
  message: string;
  confirmText?: string;
};

function App() {
  const { isMobile } = useWindowSize();
  const { organizationId, signOut } = useAuth();

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
  const [selectedDoctors, setSelectedDoctors] = useState<string[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Drag and drop state
  const [showDragConfirmation, setShowDragConfirmation] = useState(false);
  const [pendingEventChange, setPendingEventChange] = useState<{
    event: Event;
    start: Date;
    end: Date;
    isResize?: boolean;
  } | null>(null);
  const [blockingDialog, setBlockingDialog] =
    useState<BlockingDialogState | null>(null);

  // Form state
  const [appointmentForm, setAppointmentForm] = useState<AppointmentForm>({
    appointmentId: "",
    patientName: "",
    patientId: "",
    doctorId: "",
    doctorName: "",
    serviceId: "",
    serviceName: "",
    resourceId: "",
    start: new Date(),
    end: new Date(),
    status: undefined,
    notes: "",
  });

  // Data queries - only call useOrganizationQuery once
  const { data: organizationData, isLoading: organizationLoading } =
    useOrganizationQuery();

  const clinics = organizationData?.clinics ?? [];
  const units = organizationData?.units ?? [];
  const organizationDoctors = organizationData?.doctors ?? [];
  const services = organizationData?.services ?? [];

  useEffect(() => {
    if (organizationLoading) {
      return;
    }

    if (!organizationId) {
      setBlockingDialog({
        title: "Sin acceso a organización",
        message:
          "No encontramos una organización asociada a tu cuenta. Comunícate con soporte para que te asignen una.",
        confirmText: "Ok, contactaré al soporte",
      });
      return;
    }

    if (!organizationData) {
      setBlockingDialog(null);
      return;
    }

    if (clinics.length === 0) {
      setBlockingDialog({
        title: "Clínicas no configuradas",
        message:
          "Tu organización aún no tiene clínicas registradas. Comunícate con soporte para configurarlas antes de continuar.",
        confirmText: "Ok, contactaré al soporte",
      });
      return;
    }

    if (units.length === 0) {
      setBlockingDialog({
        title: "Unidades no configuradas",
        message:
          "Tu organización no tiene unidades registradas. Comunícate con soporte para crear al menos una unidad.",
        confirmText: "Ok, contactaré al soporte",
      });
      return;
    }

    if (organizationDoctors.length === 0) {
      setBlockingDialog({
        title: "Doctores no configurados",
        message:
          "No se han registrado doctores en tu organización. Comunícate con soporte para agregarlos antes de continuar.",
        confirmText: "Ok, contactaré al soporte",
      });
      return;
    }

    if (services.length === 0) {
      setBlockingDialog({
        title: "Servicios no configurados",
        message:
          "Tu organización aún no tiene servicios configurados. Comunícate con soporte para darlos de alta.",
        confirmText: "Ok, contactaré al soporte",
      });
      return;
    }

    setBlockingDialog(null);
  }, [
    organizationLoading,
    organizationId,
    organizationData,
    clinics,
    units,
    organizationDoctors,
    services,
  ]);

  const handleBlockingDialogConfirm = useCallback(() => {
    void signOut();
  }, [signOut]);

  // Extract doctors from organization data and add virtual "Sin Doctor" for unassigned appointments
  const doctors = useMemo(() => {
    const orgDoctors = organizationDoctors;
    // Only add virtual "Sin Doctor" if we have organization data
    if (orgDoctors.length === 0) {
      return [];
    }

    // Add virtual "Sin Doctor" entry for unassigned appointments
    const virtualSinDoctor = {
      id: "sin-doctor",
      name: "Sin Doctor",
      // Add other properties that might be expected
      clinic_id: "",
      specialization: "",
      schedule: null,
    };
    return [...orgDoctors, virtualSinDoctor];
  }, [organizationDoctors]);

  // Calculate date range for appointments query
  const dateRange = useMemo(() => {
    const range = getCalendarDateRangeUtil(date, view);
    console.log("📅 Date range for query:", {
      view,
      currentDate: date,
      start: range.start,
      end: range.end,
      startFormatted: format(range.start, "yyyy-MM-dd HH:mm:ss"),
      endFormatted: format(range.end, "yyyy-MM-dd HH:mm:ss"),
    });
    return range;
  }, [date, view]);

  // Get filtered appointments for the current view
  const { appointments: filteredAppointments, isLoading: appointmentsLoading } =
    useFilteredAppointments(
      dateRange.start,
      dateRange.end,
      selectedClinics,
      selectedDoctors,
      true // exclude cancelled
    );

  // Initialize selected clinics when organization data loads
  const allClinicIds = useMemo(() => {
    return clinics.map((clinic) => clinic.id);
  }, [clinics]);

  // Initialize selected doctors when organization data loads (including virtual "Sin Doctor")
  const allDoctorIds = useMemo(() => {
    return doctors.map((doctor) => doctor.id);
  }, [doctors]);

  // Set initial clinic selection
  useEffect(() => {
    if (allClinicIds.length > 0 && selectedClinics.length === 0) {
      setSelectedClinics(allClinicIds);
    }
  }, [allClinicIds, selectedClinics.length]);

  // Set initial doctor selection
  useEffect(() => {
    if (allDoctorIds.length > 0 && selectedDoctors.length === 0) {
      setSelectedDoctors(allDoctorIds);
    }
  }, [allDoctorIds, selectedDoctors.length]);

  // Transform appointments to calendar events (memoized)
  const events = useMemo((): Event[] => {
    if (!filteredAppointments.length) return [];

    return filteredAppointments.map((appointment) => {
      const doctor = doctors.find((d) => d.id === appointment.doctorId);
      const doctorLabel = doctor?.name || appointment.doctorId;
      const patientLabel = appointment.patient_name || appointment.patientId;

      // Find unit and clinic for styling
      const unit = units.find((u) => u.id === appointment.unitId);
      const clinicId = unit?.clinic_id;

      return {
        title: `${patientLabel} - ${doctorLabel}`, // Fallback for non-custom views
        start: appointment.start,
        end: appointment.end,
        resourceId: appointment.doctorId,
        appointmentId: appointment.id,
        clinicId,
        patientName: patientLabel,
        doctorName: doctorLabel,
        isConfirmed: appointment.status === "confirmed",
        isFirstVisit: appointment.is_first_visit,
      };
    });
  }, [filteredAppointments, doctors, units]);

  // Stable event styling function
  const eventPropGetter = useCallback(
    (event: Event) => {
      const backgroundColor = getDoctorColor(event.resourceId, doctors);
      const clinicColor = getClinicColor(event.clinicId, clinics);

      const isSelected = event.appointmentId === selectedEventId;

      const baseStyle = {
        backgroundColor,
        color: "white",
        borderRadius: "4px",
        border: "none",
        padding: "2px 5px",
        opacity: "0.95",
        fontSize: "11.7px",
        fontWeight: "500",
        outline: `2px solid ${clinicColor}`,
        outlineOffset: "-1px",
      };

      if (isSelected) {
        return {
          style: {
            ...baseStyle,
            backgroundColor: "lightblue",
            color: "black",
          },
          className: "calendar-event-with-clinic-outline rbc-event--selected",
        };
      }
      return {
        style: baseStyle,
        className: "calendar-event-with-clinic-outline",
      };
    },
    [doctors, clinics, selectedEventId]
  );

  // Stable callback handlers
  const handleSelectSlot = useCallback(
    (slotInfo: any) => {
      if (!organizationDoctors.length) {
        alert("No doctors available. Please add doctors first.");
        return;
      }

      // Get first clinic and its first unit as defaults
      const firstClinic = clinics[0];
      const firstUnitOfFirstClinic = firstClinic
        ? units.find((unit) => unit.clinic_id === firstClinic.id)
        : null;

      const defaultDoctor = organizationDoctors[0];
      setAppointmentForm({
        appointmentId: "",
        patientName: "",
        patientId: "",
        doctorId: defaultDoctor.id,
        doctorName: defaultDoctor.name || defaultDoctor.id,
        serviceId: "",
        serviceName: "",
        resourceId: firstUnitOfFirstClinic?.id || "", // Use first unit ID as resourceId
        start: slotInfo.start,
        end: slotInfo.end,
        status: undefined, // Will be set to 'scheduled' by AppointmentModal
      });
      setModalMode("create");
      setShowModal(true);
    },
    [organizationDoctors, clinics, units]
  );

  const handleSelectEvent = useCallback(
    (event: Event) => {
      const appointment = filteredAppointments.find(
        (apt) => apt.id === event.appointmentId
      );
      if (!appointment) return;

      console.log("🎯 handleSelectEvent - Appointment clicked:", appointment);
      console.log(
        "👤 handleSelectEvent - appointment.patient:",
        appointment.patient
      );

      // Set the selected event ID for visual feedback
      console.log("🎯 Setting selectedEventId to:", event.appointmentId);
      setSelectedEventId(event.appointmentId);

      const doctor = doctors.find((d) => d.id === appointment.doctorId);

      const formData = {
        appointmentId: appointment.id,
        patient: appointment.patient, // Pass the full patient object from backend
        patientName: appointment.patient
          ? `${appointment.patient.first_name || ""} ${
              appointment.patient.last_name || ""
            }`.trim()
          : appointment.patient_name || "",
        patientId: appointment.patient?.id || appointment.patientId,
        patientPhone:
          appointment.patient?.phone || appointment.patient_phone || "",
        doctorId: appointment.doctorId,
        doctorName: doctor?.name || appointment.doctorId,
        serviceId: appointment.serviceId,
        serviceName: appointment.serviceName,
        resourceId: appointment.unitId, // Use unitId instead of doctorId for clinic/unit lookup
        start: appointment.start,
        end: appointment.end,
        status: appointment.status, // Include the appointment status
        is_first_visit: appointment.is_first_visit, // Include the first visit flag
        notes: appointment.notes || "",
      };

      console.log("📋 handleSelectEvent - Setting appointmentForm:", formData);
      setAppointmentForm(formData);
      setModalMode("see-only");
      setShowModal(true);
    },
    [filteredAppointments, doctors]
  );

  const handleCloseModal = useCallback(() => {
    setSelectedEventId(null);
    setShowModal(false);
  }, []);

  // Mutation for creating appointments
  const createAppointmentMutation = useCreateAppointment();
  const updateAppointmentMutation = useUpdateAppointment();

  const handleAddAppointment = useCallback(
    async (appointmentData: any) => {
      try {
        console.log("➕ Creating appointment with dates:", {
          start: appointmentData.start,
          end: appointmentData.end,
          startFormatted: format(
            appointmentData.start,
            "yyyy-MM-dd HH:mm:ss EEEE"
          ),
          endFormatted: format(appointmentData.end, "yyyy-MM-dd HH:mm:ss EEEE"),
        });
        await createAppointmentMutation.mutateAsync(appointmentData);
        // Don't close modal here - let the success modal handle it
      } catch (error) {
        console.error("❌ Failed to create appointment:", error);
        alert("Failed to create appointment. Please try again.");
      }
    },
    [createAppointmentMutation]
  );

  // Handle event drop (drag and move)
  const handleEventDrop = useCallback(
    ({
      event,
      start,
      end,
    }: {
      event: Event;
      start: string | Date;
      end: string | Date;
    }) => {
      console.log("🎯 RBC provided drag dates:", {
        startType: typeof start,
        endType: typeof end,
        startRaw: start,
        endRaw: end,
        startString: start.toString(),
        endString: end.toString(),
      });
      const startDate = typeof start === "string" ? new Date(start) : start;
      const endDate = typeof end === "string" ? new Date(end) : end;
      console.log("🎯 After conversion:", {
        startDate,
        endDate,
        startISO: startDate.toISOString(),
        endISO: endDate.toISOString(),
      });
      setPendingEventChange({
        event,
        start: startDate,
        end: endDate,
        isResize: false,
      });
      setShowDragConfirmation(true);
    },
    []
  );

  // Handle event resize
  const handleEventResize = useCallback(
    ({
      event,
      start,
      end,
    }: {
      event: Event;
      start: string | Date;
      end: string | Date;
    }) => {
      const startDate = typeof start === "string" ? new Date(start) : start;
      const endDate = typeof end === "string" ? new Date(end) : end;
      setPendingEventChange({
        event,
        start: startDate,
        end: endDate,
        isResize: true,
      });
      setShowDragConfirmation(true);
    },
    []
  );

  // Confirm the drag/resize change
  const handleConfirmEventChange = useCallback(async () => {
    if (!pendingEventChange) return;

    const { event, start, end } = pendingEventChange;
    const appointment = filteredAppointments.find(
      (apt) => apt.id === event.appointmentId
    );

    if (!appointment) {
      alert("Appointment not found");
      setShowDragConfirmation(false);
      setPendingEventChange(null);
      return;
    }

    try {
      console.log("🔄 Updating appointment to new dates:", {
        appointmentId: appointment.id,
        newStart: start,
        newEnd: end,
        startFormatted: format(start, "yyyy-MM-dd HH:mm:ss EEEE"),
        endFormatted: format(end, "yyyy-MM-dd HH:mm:ss EEEE"),
        currentDateRange: {
          start: dateRange.start,
          end: dateRange.end,
          startFormatted: format(dateRange.start, "yyyy-MM-dd HH:mm:ss EEEE"),
          endFormatted: format(dateRange.end, "yyyy-MM-dd HH:mm:ss EEEE"),
        },
      });

      // TIMEZONE HANDLING:
      // - User drags event to new local time (e.g., 2:00 PM in their timezone)
      // - We send to backend using .toISOString() which converts to UTC
      // - Backend stores UTC time
      // - When reading back, new Date(utc_string) converts back to local time
      // This ensures appointments appear at the correct local time regardless of user's timezone
      const startTimeUTC = start.toISOString();
      const endTimeUTC = end.toISOString();

      console.log("📤 Sending update with UTC times:", {
        localStart: format(start, "yyyy-MM-dd HH:mm:ss"),
        localEnd: format(end, "yyyy-MM-dd HH:mm:ss"),
        utcStart: startTimeUTC,
        utcEnd: endTimeUTC,
      });

      await updateAppointmentMutation.mutateAsync({
        id: appointment.id,
        start_time: startTimeUTC,
        end_time: endTimeUTC,
      });

      setShowDragConfirmation(false);
      setPendingEventChange(null);
    } catch (error) {
      console.error("❌ Failed to update appointment:", error);
      alert("Failed to update appointment. Please try again.");
      setShowDragConfirmation(false);
      setPendingEventChange(null);
    }
  }, [
    pendingEventChange,
    filteredAppointments,
    updateAppointmentMutation,
    dateRange,
  ]);

  // Cancel the drag/resize change
  const handleCancelEventChange = useCallback(() => {
    setShowDragConfirmation(false);
    setPendingEventChange(null);
  }, []);

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

  if (blockingDialog) {
    return (
      <>
        <div
          style={{
            minHeight: "100vh",
            backgroundColor: "#f8fafc",
          }}
        />
        <ConfirmationDialog
          isOpen
          title={blockingDialog.title}
          message={blockingDialog.message}
          confirmText={
            blockingDialog.confirmText ?? "Ok, contactaré al soporte"
          }
          onConfirm={handleBlockingDialogConfirm}
          onCancel={() => {}}
          confirmButtonStyle="primary"
          hideCancelButton
        />
      </>
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
              <div
                style={{
                  borderBottom: "1px solid #e2e8f0",
                  padding: "12px 0",
                  marginBottom: "8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "20px",
                    alignItems: "center",
                  }}
                >
                  <ClinicFilterBar
                    selectedClinics={selectedClinics}
                    onClinicsChange={setSelectedClinics}
                    clinics={clinics}
                    getClinicColor={(clinicId) =>
                      getClinicColor(clinicId, clinics)
                    }
                  />

                  <DoctorFilterBar
                    selectedDoctors={selectedDoctors}
                    onDoctorsChange={setSelectedDoctors}
                    doctors={doctors}
                    getDoctorColor={(doctorId) =>
                      getDoctorColor(doctorId, doctors)
                    }
                  />
                </div>
              </div>

              {appointmentsLoading ? (
                <div style={{ textAlign: "center", padding: "20px" }}>
                  Loading appointments...
                </div>
              ) : (
                <DnDCalendar
                  localizer={localizer}
                  culture="es-MX"
                  messages={messages}
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: isMobile ? 500 : 600, marginTop: "20px" }}
                  onSelectSlot={handleSelectSlot}
                  onSelectEvent={handleSelectEvent}
                  onEventDrop={handleEventDrop}
                  onEventResize={handleEventResize}
                  selected={
                    selectedEventId
                      ? events.find((e) => e.appointmentId === selectedEventId)
                      : null
                  }
                  selectable
                  resizable
                  popup
                  view={view}
                  onView={setView}
                  date={date}
                  onNavigate={setDate}
                  eventPropGetter={eventPropGetter}
                  components={{
                    event: CalendarEvent,
                  }}
                  step={15}
                  timeslots={1}
                  showMultiDayTimes
                  formats={{
                    timeGutterFormat: (date) => {
                      // Show time label for every 15-minute increment
                      return format(date, "h:mm a");
                    },
                    agendaTimeFormat: (date) => format(date, "hh:mm a"),
                    eventTimeRangeFormat: () => "", // Hide default time display
                  }}
                  min={new Date(0, 0, 0, 8, 0, 0)}
                  max={new Date(0, 0, 0, 20, 30, 0)}
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
            clinics={clinics}
            units={units}
            services={services}
            handleCloseModal={handleCloseModal}
            handleAddAppointment={handleAddAppointment}
            setAppointmentForm={setAppointmentForm}
            appointments={filteredAppointments}
          />
        )}

        {/* Drag and Drop Confirmation Dialog */}
        {showDragConfirmation &&
          pendingEventChange &&
          (() => {
            const { start, end, isResize } = pendingEventChange;
            const durationMinutes = Math.round(
              (end.getTime() - start.getTime()) / (1000 * 60)
            );
            const dateStr = format(start, "d 'de' MMMM 'de' yyyy", {
              locale: es,
            });
            const startTimeStr = format(start, "h:mm a", { locale: es });
            const endTimeStr = format(end, "h:mm a", { locale: es });

            const message = isResize
              ? `¿Desea cambiar la duración de esta cita al día ${dateStr}, de ${startTimeStr} a ${endTimeStr} (${durationMinutes} min)?`
              : `¿Desea mover esta cita al día ${dateStr}, de ${startTimeStr} a ${endTimeStr} (${durationMinutes} min)?`;

            return (
              <ConfirmationDialog
                isOpen={showDragConfirmation}
                title="Confirmar cambio de cita"
                message={message}
                onConfirm={handleConfirmEventChange}
                onCancel={handleCancelEventChange}
                confirmText="Confirmar"
                cancelText="Cancelar"
              />
            );
          })()}
      </div>
    </>
  );
}

export default App;
