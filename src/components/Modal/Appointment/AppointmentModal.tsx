import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Select from "react-select";
import DatePicker, { registerLocale } from "react-datepicker";
import { es } from "date-fns/locale";
import { format } from "date-fns";
import type { Doctor } from "../../../api/entities/Doctor";
import type { Patient } from "../../../api/entities/Patient";

import {
  useUpdateAppointment,
  useCancelAppointmentMutation,
} from "../../../hooks/queries/useAppointmentsQuery";
import PatientSearchAutocomplete from "../../PatientSearch/PatientSearchAutocomplete";
import PatientDisplay from "../../PatientSearch/PatientDisplay";
import AddPatientModal from "../Patient/AddPatientModal";
import EditPatientModal from "../Patient/EditPatientModal";
import ConfirmationDialog from "../ConfirmationDialog";
import UniversalModal from "../UniversalModal";
import {
  APPOINTMENT_STATUS,
  getAvailableStatusOptions,
  type AppointmentStatus,
} from "../../../utils/appointmentStatus";
import "react-datepicker/dist/react-datepicker.css";
import "./AppointmentModal.css";
import DoctorDayView from "./DoctorDayView";
import { useWindowSize } from "../../../hooks/useWindowSize";
import "../../../styles/Modal.css";

// Registrar el idioma español
registerLocale("es", es);

/**
 * Convert Date to ISO string using LOCAL time with 'Z' suffix
 * Sends the exact time the user selected without timezone conversion
 * Example: User selects 19:00 → "2025-08-28T19:00:00Z"
 */
const toLocalTimeWithZ = (date: Date): string => {
  const pad = (num: number) => String(num).padStart(2, "0");

  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    "T" +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes()) +
    ":" +
    pad(date.getSeconds()) +
    "Z"
  );
};

const MIN_START_MINUTES = 8 * 60; // 8:00 a.m.
const MAX_START_MINUTES = 20 * 60 + 25; // 8:25 p.m.
const TIME_INTERVAL_MINUTES = 5;

const AppointmentModal = ({
  showModal,
  mode = "create", // "create", "edit", or "see-only"
  appointmentForm, // Includes appointmentId
  doctors,
  clinics, // Passed as prop
  units, // Passed as prop
  services, // Services array from organization
  handleCloseModal,
  handleAddAppointment,

  setAppointmentForm,
  appointments, // Receive appointments prop
}: any) => {
  const queryClient = useQueryClient();
  const { isMobile } = useWindowSize();

  // Mutation hooks for appointments
  const updateAppointmentMutation = useUpdateAppointment();
  const cancelAppointmentMutation = useCancelAppointmentMutation();

  const [currentMode, setCurrentMode] = useState(mode); // Internal mode state for switching
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [
    showRescheduleRequestConfirmation,
    setShowRescheduleRequestConfirmation,
  ] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [originalAppointmentForm, setOriginalAppointmentForm] =
    useState<any>(null); // Store original form data
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [showEditPatientModal, setShowEditPatientModal] = useState(false);
  const [initialPatientName, setInitialPatientName] = useState<string>("");
  const [selectedClinicId, setSelectedClinicId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("09:00");
  const [selectedDuration, setSelectedDuration] = useState<number>(60); // Duration in minutes

  // Universal modal state
  const [universalModal, setUniversalModal] = useState({
    isOpen: false,
    type: "success" as "confirmation" | "success" | "error",
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Helper functions for showing different types of modals
  const showSuccessModal = (
    title: string,
    message: string,
    onConfirm?: () => void
  ) => {
    setUniversalModal({
      isOpen: true,
      type: "success",
      title,
      message,
      onConfirm:
        onConfirm ||
        (() => {
          setUniversalModal((prev) => ({ ...prev, isOpen: false }));
          handleCloseModal(); // Close appointment modal and return to calendar
        }),
    });
  };

  const showErrorModal = (title: string, message: string) => {
    setUniversalModal({
      isOpen: true,
      type: "error",
      title,
      message,
      onConfirm: () =>
        setUniversalModal((prev) => ({ ...prev, isOpen: false })),
    });
  };

  if (!showModal) return null;

  // Type guard to ensure doctors is an array before mapping
  const doctorOptions = Array.isArray(doctors)
    ? doctors.map((doctor: Doctor) => ({
        value: doctor.id,
        label: `${doctor.name} - ${doctor.specialty}`,
      }))
    : [];

  // Type guard to ensure services is an array before mapping
  const serviceOptions = Array.isArray(services)
    ? services.map((service: any) => ({
        value: service.id,
        label: service.base_price
          ? `${service.name} ($${service.base_price})`
          : service.name,
      }))
    : [];

  // Filter units by selected clinic
  const filteredUnits = selectedClinicId
    ? units.filter((unit: any) => unit.clinic_id === selectedClinicId)
    : units;

  // Handle clinic change
  const handleClinicChange = (clinicId: string) => {
    setSelectedClinicId(clinicId);
    // Clear unit selection when clinic changes
    setAppointmentForm((prevForm: any) => ({
      ...prevForm,
      resourceId: "",
    }));
  };

  const isReadOnly = currentMode === "see-only";
  const isRescheduleRequestDisabled = [
    APPOINTMENT_STATUS.NEEDS_RESCHEDULING,
    APPOINTMENT_STATUS.RESCHEDULED,
    APPOINTMENT_STATUS.CANCELLED,
  ].includes(appointmentForm?.status);

  // Generate time options with 5-minute intervals for finer control
  const generateTimeOptions = () => {
    const options = [];
    for (
      let totalMinutes = MIN_START_MINUTES;
      totalMinutes <= MAX_START_MINUTES;
      totalMinutes += TIME_INTERVAL_MINUTES
    ) {
      const hour = Math.floor(totalMinutes / 60);
      const minute = totalMinutes % 60;
      const timeString = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
      const time12 = new Date(`2000-01-01T${timeString}`).toLocaleTimeString(
        "en-US",
        {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }
      );
      options.push({ value: timeString, label: time12 });
    }
    return options;
  };

  // Generate duration options in 5-minute increments up to 3 hours
  const generateDurationOptions = () => {
    const formatLabel = (minutes: number) => {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      const parts: string[] = [];

      if (hours > 0) {
        parts.push(`${hours} ${hours === 1 ? "hora" : "horas"}`);
      }
      if (remainingMinutes > 0 || hours === 0) {
        parts.push(`${remainingMinutes} min`);
      }

      return parts.join(" ");
    };

    const durations: { value: number; label: string }[] = [];
    for (let minutes = 5; minutes <= 180; minutes += 5) {
      durations.push({ value: minutes, label: formatLabel(minutes) });
    }

    if (
      selectedDuration &&
      !durations.some((option) => option.value === selectedDuration)
    ) {
      durations.push({
        value: selectedDuration,
        label: formatLabel(selectedDuration),
      });
    }

    return durations;
  };

  // Formatear resumen de la cita en español
  const formatAppointmentSummary = (startDate: Date) => {
    // Verificar que la fecha sea válida
    if (!startDate || isNaN(startDate.getTime())) {
      return "Selecciona fecha, hora y duración para ver el resumen";
    }

    try {
      // Formatear con date-fns para obtener el formato deseado
      const dayName = format(startDate, "EEEE", { locale: es }); // día de la semana
      const dayNumber = format(startDate, "d", { locale: es }); // día del mes
      const monthName = format(startDate, "MMMM", { locale: es }); // mes completo
      const year = format(startDate, "yyyy", { locale: es }); // año
      const time = format(startDate, "h:mm a", { locale: es }); // hora en formato AM/PM

      return `Cita para el día ${dayName} ${dayNumber} de ${monthName} de ${year} a las ${time}`;
    } catch (error) {
      return "Error al formatear la fecha";
    }
  };

  // Update appointment form when date, time, or duration changes
  const updateAppointmentDateTime = (
    date: Date,
    time: string,
    duration: number
  ) => {
    // Validate inputs
    if (!date || !time || !duration || isNaN(date.getTime()) || duration <= 0) {
      return;
    }

    const timeMatch = time.match(/^(\d{1,2}):(\d{2})$/);
    if (!timeMatch) {
      return;
    }

    const [hours, minutes] = timeMatch.slice(1).map(Number);

    // Validate hours and minutes
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return;
    }

    // TIMEZONE HANDLING:
    // Create a Date object in LOCAL timezone using setHours()
    // When sent to backend, toLocalTimeWithZ() sends the exact time without conversion
    // Example: User selects 7:00 PM (19:00)
    //          → setHours(19, 0) creates local 7:00 PM Date object
    //          → toLocalTimeWithZ() sends "2025-08-28T19:00:00Z" (exact time from UI)
    //          → Backend knows clinic timezone and converts to UTC for storage
    //          → Backend returns dates in UTC, frontend converts back to local for display
    const startDateTime = new Date(date);
    startDateTime.setHours(hours, minutes, 0, 0);

    // Verify the date is valid after setting time
    if (isNaN(startDateTime.getTime())) {
      return;
    }

    const endDateTime = new Date(
      startDateTime.getTime() + duration * 60 * 1000
    );

    // Verify end date is valid
    if (isNaN(endDateTime.getTime())) {
      return;
    }

    setAppointmentForm((prevForm: any) => ({
      ...prevForm,
      start: startDateTime,
      end: endDateTime,
    }));
  };

  // Patient search handlers
  const handlePatientSelect = (patient: Patient | null) => {
    setSelectedPatient(patient);

    // Only update form data when actually selecting a patient (not when clearing)
    // In edit mode, clearing the search doesn't clear the original patient data
    if (patient) {
      setAppointmentForm((prevForm: any) => ({
        ...prevForm,
        patientName: patient.name,
        patientId: patient.id,
      }));
    } else if (currentMode === "create") {
      // In create mode, clearing should clear the form
      setAppointmentForm((prevForm: any) => ({
        ...prevForm,
        patientName: "",
        patientId: "",
      }));
    }
    // In edit mode, when clearing (patient is null), we don't update the form
    // This preserves the original patient data for cancel changes functionality
  };

  const handleAddNewPatient = (searchQuery?: string) => {
    setInitialPatientName(searchQuery || "");
    setShowAddPatientModal(true);
  };

  const handlePatientCreated = (newPatient: Patient) => {
    // Update selected patient state
    setSelectedPatient(newPatient);

    // Update appointment form with patient details
    const updatedForm = {
      ...appointmentForm,
      patientName: newPatient.name,
      patientId: newPatient.id,
    };

    setAppointmentForm(updatedForm);

    // Close the add patient modal
    setShowAddPatientModal(false);
  };

  const handleCloseAddPatientModal = () => {
    setShowAddPatientModal(false);
  };

  // Handle edit patient
  const handleEditPatient = () => {
    // In see-only mode, we might not have selectedPatient set yet
    // So we get it from appointmentForm if needed
    let patientToEdit = selectedPatient;

    if (!patientToEdit && appointmentForm.patient) {
      // Use the full patient object from the appointment (includes first_name and last_name separately)
      patientToEdit = appointmentForm.patient;
      setSelectedPatient(patientToEdit);
    } else if (!patientToEdit && appointmentForm.patientId) {
      // Fallback: construct patient object from form data (for backwards compatibility)
      // This should rarely happen now that backend returns full patient object
      patientToEdit = {
        id: appointmentForm.patientId,
        name: appointmentForm.patientName,
        phone: appointmentForm.patientPhone,
        email: undefined,
      };
      setSelectedPatient(patientToEdit);
    }

    if (patientToEdit) {
      setShowEditPatientModal(true);
    }
  };

  // Handle patient updated
  const handlePatientUpdated = (updatedPatient: Patient) => {
    const combinedName =
      updatedPatient.name ||
      `${updatedPatient.first_name || ""} ${
        updatedPatient.last_name || ""
      }`.trim();

    const normalizedPatient = {
      ...updatedPatient,
      name: combinedName,
    };

    // Update selected patient state
    setSelectedPatient(normalizedPatient);

    // Update appointment form with updated patient details
    const updatedForm = {
      ...appointmentForm,
      patientName: combinedName,
      patientPhone: updatedPatient.phone,
      patient: normalizedPatient,
    };

    setAppointmentForm(updatedForm);

    // Refresh related appointment queries so calendar data stays in sync
    queryClient.invalidateQueries({ queryKey: ["appointments"], exact: false });
  };

  const handleCloseEditPatientModal = () => {
    setShowEditPatientModal(false);
  };

  // Handle remove patient
  const handleRemovePatient = () => {
    setSelectedPatient(null);
    const updatedForm = {
      ...appointmentForm,
      patientName: "",
      patientId: "",
      patientPhone: "",
    };
    setAppointmentForm(updatedForm);
  };

  // Mode switching functions
  const handleEditAppointment = () => {
    setCurrentMode("edit");
  };

  const handleCancelChanges = () => {
    // Reset form to original data
    if (originalAppointmentForm) {
      setAppointmentForm(originalAppointmentForm);
    }

    // Reset mode to see-only
    setCurrentMode("see-only");

    // Clear any patient selection
    setSelectedPatient(null);
  };

  const handleConfirmRescheduleRequest = () => {
    setShowRescheduleRequestConfirmation(false);
    void handleQuickStatusUpdate(APPOINTMENT_STATUS.NEEDS_RESCHEDULING);
  };

  // Quick status update handler - makes immediate API call
  const handleQuickStatusUpdate = async (newStatus: string) => {
    // For create mode, just update the form state (no API call until appointment is created)
    if (currentMode === "create") {
      setAppointmentForm((prevForm: any) => ({
        ...prevForm,
        status: newStatus,
      }));
      return;
    }

    // For existing appointments, make immediate API call
    if (!appointmentForm.appointmentId) {
      showErrorModal(
        "Error",
        "No se puede actualizar el estado: ID de cita no encontrado"
      );
      return;
    }

    try {
      // Use existing updateAppointmentMutation with only status
      const updateData = {
        id: appointmentForm.appointmentId,
        status: newStatus,
      };

      await updateAppointmentMutation.mutateAsync(updateData);

      // Update local form state
      setAppointmentForm((prevForm: any) => ({
        ...prevForm,
        status: newStatus,
      }));

      // Show success feedback (brief message)
      showSuccessModal(
        "Estado actualizado",
        `El estado de la cita se ha actualizado correctamente.`
      );
    } catch (error: any) {
      showErrorModal(
        "Error al actualizar estado",
        "No se pudo actualizar el estado de la cita. Inténtalo de nuevo."
      );
    }
  };

  // Sync selectedPatient when switching to edit mode (only on mode change, not form data change)
  useEffect(() => {
    if (currentMode === "edit") {
      // Use the current appointmentForm data to set initial patient selection
      const currentForm = appointmentForm; // Capture current form data
      if (currentForm.patientName) {
        // If we have patient name, create a patient object
        const patient: Patient = {
          id: currentForm.patientId || "",
          name: currentForm.patientName,
          email: undefined,
          phone: undefined,
        };
        setSelectedPatient(patient);
      } else {
        // Clear selection to allow search
        setSelectedPatient(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMode]); // Only depend on currentMode to avoid interference with user interactions

  // Sync internal mode with prop mode when modal opens and store original form data
  useEffect(() => {
    if (showModal) {
      setCurrentMode(mode);
      // Store the original form data when modal opens (only once)
      setOriginalAppointmentForm({ ...appointmentForm });

      // Initialize status if not present - default to 'scheduled' for new appointments
      if (!appointmentForm.status) {
        setAppointmentForm((prevForm: any) => ({
          ...prevForm,
          status: APPOINTMENT_STATUS.SCHEDULED,
        }));
      }
    }
  }, [showModal, mode]); // Removed appointmentForm dependency to prevent mode reset on form changes

  // Initialize clinic when editing appointment based on selected unit
  useEffect(() => {
    if (showModal && appointmentForm.resourceId && units.length > 0) {
      const selectedUnit = units.find(
        (unit: any) => unit.id === appointmentForm.resourceId
      );
      if (selectedUnit && selectedUnit.clinic_id !== selectedClinicId) {
        setSelectedClinicId(selectedUnit.clinic_id);
      }
    }
  }, [showModal, appointmentForm.resourceId, units, selectedClinicId]);

  // Initialize clinic to first available clinic for new appointments
  useEffect(() => {
    if (
      showModal &&
      mode === "create" &&
      clinics.length > 0 &&
      !selectedClinicId
    ) {
      setSelectedClinicId(clinics[0].id);
    }
  }, [showModal, mode, clinics, selectedClinicId]);

  // Initialize date, time, and duration from appointmentForm
  useEffect(() => {
    if (showModal && appointmentForm.start) {
      const startDate = new Date(appointmentForm.start);
      const endDate = new Date(appointmentForm.end);

      // Set date
      setSelectedDate(startDate);

      // Set time (HH:MM format)
      const timeString = `${startDate
        .getHours()
        .toString()
        .padStart(2, "0")}:${startDate
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;
      setSelectedTime(timeString);

      // Calculate duration in minutes
      const durationMinutes = Math.round(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60)
      );
      setSelectedDuration(durationMinutes);
    }
  }, [showModal, appointmentForm.start, appointmentForm.end]);

  // Initialize appointment dates when creating a new appointment (only if no time was set from calendar)
  useEffect(() => {
    if (showModal && currentMode === "create" && !appointmentForm.start) {
      // Only initialize when modal opens for creation AND no start time is set
      // This prevents overriding calendar slot selections
      updateAppointmentDateTime(selectedDate, selectedTime, selectedDuration);
    }
  }, [showModal, currentMode, appointmentForm.start]); // Include appointmentForm.start to check if calendar selection exists

  // Validate and handle appointment creation
  const handleValidatedAddAppointment = async () => {
    // Create a validated form object, ensuring patient data is properly set
    const validatedForm = { ...appointmentForm };

    // If we have a selectedPatient but the form doesn't have patientId, use selectedPatient data
    if (selectedPatient && selectedPatient.id && !validatedForm.patientId) {
      validatedForm.patientId = selectedPatient.id;
      validatedForm.patientName = selectedPatient.name;
    }

    // Validate required fields using the validated form
    if (!validatedForm.doctorId) {
      alert("Por favor selecciona un doctor");
      return;
    }
    if (!validatedForm.patientId && !validatedForm.patientName) {
      alert("Por favor selecciona un paciente");
      return;
    }
    if (!appointmentForm.resourceId) {
      alert("Por favor selecciona una unidad");
      return;
    }
    if (!appointmentForm.serviceId) {
      alert("Por favor selecciona un servicio");
      return;
    }

    // Enhanced date validation with debugging
    if (!validatedForm.start || !validatedForm.end) {
      alert(
        "Por favor selecciona fecha, hora y duración válidas - fechas faltantes"
      );
      return;
    }

    // Check if start/end are valid Date objects
    const startDate = new Date(validatedForm.start);
    const endDate = new Date(validatedForm.end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      alert(
        "Por favor selecciona fecha, hora y duración válidas - fechas inválidas"
      );
      return;
    }

    // Prepare appointment data with Date objects for the API
    try {
      const appointmentData = {
        ...validatedForm,
        start: startDate, // Keep as Date object
        end: endDate, // Keep as Date object
        patientId: validatedForm.patientId,
        doctorId: validatedForm.doctorId,
        unitId: validatedForm.resourceId, // Map resourceId to unitId
        serviceId: validatedForm.serviceId,
        notes: validatedForm.notes || "",
      };

      try {
        // Call handleAddAppointment and wait for it to complete
        await handleAddAppointment(appointmentData);

        // Show success modal
        showSuccessModal(
          "¡Cita creada exitosamente!",
          "La nueva cita se ha agregado al calendario."
        );
      } catch (createError: any) {
        showErrorModal(
          "Error al crear la cita",
          createError.message ||
            "Ocurrió un error inesperado. Por favor intenta de nuevo."
        );
      }
    } catch (error) {
      showErrorModal(
        "Error en los datos",
        "Error al procesar las fechas. Por favor intenta de nuevo."
      );
    }
  };

  const handleValidatedUpdateAppointment = async () => {
    // Create a validated form object, ensuring patient data is properly set
    const validatedForm = { ...appointmentForm };

    // If we have a selectedPatient but the form doesn't have patientId, use selectedPatient data
    if (selectedPatient && selectedPatient.id && !validatedForm.patientId) {
      validatedForm.patientId = selectedPatient.id;
      validatedForm.patientName = selectedPatient.name;
    }

    // Validate required fields using the validated form
    if (!validatedForm.doctorId) {
      showErrorModal("Campo requerido", "Por favor selecciona un doctor");
      return;
    }
    if (!validatedForm.patientId && !validatedForm.patientName) {
      showErrorModal("Campo requerido", "Por favor selecciona un paciente");
      return;
    }
    if (!validatedForm.resourceId) {
      showErrorModal("Campo requerido", "Por favor selecciona una unidad");
      return;
    }
    if (!validatedForm.serviceId) {
      showErrorModal("Campo requerido", "Por favor selecciona un servicio");
      return;
    }

    // Enhanced date validation with debugging
    if (!validatedForm.start || !validatedForm.end) {
      alert(
        "Por favor selecciona fecha, hora y duración válidas - fechas faltantes"
      );
      return;
    }

    // Check if start/end are valid Date objects
    const startDate = new Date(validatedForm.start);
    const endDate = new Date(validatedForm.end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      alert(
        "Por favor selecciona fecha, hora y duración válidas - fechas inválidas"
      );
      return;
    }

    // Check if start_time has changed to set rescheduled status
    let finalStatus = validatedForm.status || APPOINTMENT_STATUS.SCHEDULED;

    if (originalAppointmentForm && originalAppointmentForm.start) {
      // Compare times using getTime() to avoid UTC conversion issues
      const originalStartTime = new Date(
        originalAppointmentForm.start
      ).getTime();
      const newStartTime = startDate.getTime();

      // If start time changed and status is not already cancelled, set as rescheduled
      if (
        originalStartTime !== newStartTime &&
        finalStatus !== APPOINTMENT_STATUS.CANCELLED
      ) {
        finalStatus = APPOINTMENT_STATUS.RESCHEDULED;
      }
    }

    // Send exact local time to backend with 'Z' suffix - backend handles UTC conversion
    try {
      const updateData = {
        id: validatedForm.appointmentId,
        patientId: validatedForm.patientId,
        doctorId: validatedForm.doctorId,
        unitId: validatedForm.resourceId,
        clinicId: selectedClinicId || undefined,
        resourceId: validatedForm.resourceId,
        serviceId: validatedForm.serviceId,
        start_time: toLocalTimeWithZ(startDate),
        end_time: toLocalTimeWithZ(endDate),
        status: finalStatus,
        notes: validatedForm.notes || "",
      };

      try {
        // Use the mutation hook which handles cache invalidation automatically
        const updatedAppointment = await updateAppointmentMutation.mutateAsync(
          updateData
        );

        // Update the appointment form with the response data to reflect changes
        setAppointmentForm({
          ...validatedForm,
          start: updatedAppointment.start,
          end: updatedAppointment.end,
          status: updatedAppointment.status || finalStatus,
          notes: updatedAppointment.notes || validatedForm.notes || "",
        });

        // Switch back to see-only mode
        setCurrentMode("see-only");

        // Show success modal
        showSuccessModal(
          "¡Cita actualizada exitosamente!",
          "Los cambios se han guardado correctamente."
        );
      } catch (updateError: any) {
        showErrorModal(
          "Error al actualizar la cita",
          updateError.message ||
            "Error al actualizar la cita. Por favor intenta de nuevo."
        );
      }
    } catch (error: any) {
      alert("Error al procesar los datos. Por favor intenta de nuevo.");
    }
  };

  const handleCancel = () => {
    setShowCancelConfirmation(true);
  };

  const handleConfirmCancel = async () => {
    setShowCancelConfirmation(false);

    try {
      // Use the mutation hook which handles cache invalidation automatically
      await cancelAppointmentMutation.mutateAsync(
        appointmentForm.appointmentId
      );

      // Show success modal
      showSuccessModal(
        "¡Cita cancelada exitosamente!",
        "La cita ha sido cancelada correctamente."
      );
    } catch (error: any) {
      showErrorModal(
        "Error al cancelar la cita",
        error.message ||
          "Error al cancelar la cita. Por favor intenta de nuevo."
      );
    }
  };

  const handleCancelConfirmation = () => {
    setShowCancelConfirmation(false);
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking directly on the overlay, not on modal content
    if (e.target === e.currentTarget) {
      handleCloseModal();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div
        className="modal-content"
        {...(showCancelConfirmation ||
        universalModal.isOpen ||
        showEditPatientModal
          ? { inert: true as any }
          : {})}
        style={{
          maxWidth:
            appointmentForm.doctorId && currentMode === "create"
              ? "900px"
              : "400px",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: "20px",
          backgroundColor: "white",
          padding: "30px",
          borderRadius: "8px",
          position: "relative", // Important for absolute positioning of close button
          overflowY: "auto",
          maxHeight: "90vh",
        }}
      >
        {/* Close button */}
        <button
          onClick={handleCloseModal}
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            background: "none",
            border: "none",
            fontSize: "20px",
            cursor: "pointer",
            color: "#666",
            padding: "5px",
            lineHeight: "1",
          }}
        >
          ×
        </button>

        {/* Form Section */}
        <div
          className="modal-form appointment-form-compact"
          style={{ flex: isMobile ? "none" : "1" }}
        >
          {/* Header with title and status dropdown */}
          <div className="appointment-header">
            <h3>
              {currentMode === "create"
                ? "Nueva Cita Dental"
                : currentMode === "edit"
                ? "Editar Cita Dental"
                : "Detalles de la Cita"}
            </h3>

            {/* Status dropdown - show only for existing appointments (edit and see-only modes) */}
            {currentMode !== "create" && appointmentForm.start && (
              <div className="status-dropdown-container">
                <Select
                  options={getAvailableStatusOptions(
                    new Date(appointmentForm.start),
                    appointmentForm.status as AppointmentStatus
                  )}
                  value={getAvailableStatusOptions(
                    new Date(appointmentForm.start),
                    appointmentForm.status as AppointmentStatus
                  ).find(
                    (option) =>
                      option.value ===
                      (appointmentForm.status || APPOINTMENT_STATUS.SCHEDULED)
                  )}
                  onChange={(selectedOption) => {
                    if (selectedOption) {
                      handleQuickStatusUpdate(selectedOption.value);
                    }
                  }}
                  placeholder="Estado..."
                  isClearable={false}
                  isDisabled={false} // Always enabled
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: "32px",
                      fontSize: "12px",
                    }),
                    valueContainer: (base) => ({
                      ...base,
                      padding: "2px 8px",
                    }),
                    option: (base) => ({
                      ...base,
                      fontSize: "12px",
                    }),
                  }}
                />
              </div>
            )}
          </div>

          <div className="form-field">
            <label>Nombre del Doctor:</label>
            <Select
              options={doctorOptions}
              value={doctorOptions.find(
                (option: { value: string; label: string }) =>
                  option.value === appointmentForm.doctorId
              )}
              onChange={(
                selectedOption: { value: string; label: string } | null
              ) =>
                setAppointmentForm((prevForm: any) => ({
                  ...prevForm,
                  doctorId: selectedOption?.value || "",
                  doctorName: selectedOption?.label || "",
                  resourceId: selectedOption
                    ? Array.isArray(doctors)
                      ? doctors.find(
                          (doc: Doctor) => doc.id === selectedOption.value
                        )?.default_unit_id || ""
                      : ""
                    : "",
                }))
              }
              placeholder="Seleccionar doctor..."
              isClearable
              isDisabled={isReadOnly}
            />
          </div>

          <div className="form-field">
            <label>Nombre del Paciente:</label>
            {currentMode === "see-only" ? (
              <PatientDisplay
                patientName={appointmentForm.patientName}
                patientId={appointmentForm.patientId}
                placeholder="Sin paciente asignado"
                showActions={true}
                onEdit={handleEditPatient}
                onRemove={handleRemovePatient}
                disableRemove={true} // Disable remove in view-only mode
              />
            ) : (
              <PatientSearchAutocomplete
                selectedPatient={selectedPatient}
                onPatientSelect={handlePatientSelect}
                onAddNewPatient={handleAddNewPatient}
                onEditPatient={handleEditPatient}
                disabled={false}
                placeholder="Buscar paciente por nombre..."
              />
            )}
          </div>

          {currentMode === "see-only" && (
            <div className="form-field">
              <label>Tel: {appointmentForm.patientPhone || "(vacío)"}</label>
            </div>
          )}

          <div className="form-field">
            <label>Servicio:</label>
            <Select
              options={serviceOptions}
              value={
                appointmentForm.serviceId
                  ? serviceOptions.find(
                      (option) => option.value === appointmentForm.serviceId
                    )
                  : null
              }
              onChange={(selectedOption) => {
                const service = services.find(
                  (s: any) => s.id === selectedOption?.value
                );
                setAppointmentForm((prevForm: any) => ({
                  ...prevForm,
                  serviceId: selectedOption?.value || "",
                  serviceName: service?.name || "",
                }));
              }}
              placeholder="Seleccionar Servicio"
              className="react-select-container"
              classNamePrefix="react-select"
              isDisabled={isReadOnly}
              styles={{
                control: (provided) => ({
                  ...provided,
                  minHeight: "42px",
                  borderColor: "#ccc",
                }),
              }}
            />
          </div>

          <div className="form-field">
            <label>Clínica:</label>
            <select
              value={selectedClinicId}
              onChange={(e) => handleClinicChange(e.target.value)}
              className="custom-selector"
              disabled={isReadOnly}
            >
              <option value="">Seleccionar Clínica</option>
              {clinics.map((clinic: any) => (
                <option key={clinic.id} value={clinic.id}>
                  {clinic.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>Unidad:</label>
            <select
              value={appointmentForm.resourceId}
              onChange={(e) =>
                setAppointmentForm((prevForm: any) => ({
                  ...prevForm,
                  resourceId: e.target.value,
                }))
              }
              className="custom-selector"
              disabled={isReadOnly || !selectedClinicId}
            >
              <option value="">
                {selectedClinicId
                  ? "Seleccionar Unidad"
                  : "Primero selecciona una clínica"}
              </option>
              {filteredUnits.map((unit: any) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>Fecha:</label>
            <DatePicker
              selected={selectedDate}
              onChange={(date) => {
                if (date) {
                  setSelectedDate(date);
                  updateAppointmentDateTime(
                    date,
                    selectedTime,
                    selectedDuration
                  );
                }
              }}
              dateFormat="dd/MMM/yyyy"
              locale="es"
              className="form-control"
              disabled={isReadOnly}
            />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Hora:</label>
              <select
                value={selectedTime}
                onChange={(e) => {
                  setSelectedTime(e.target.value);
                  updateAppointmentDateTime(
                    selectedDate,
                    e.target.value,
                    selectedDuration
                  );
                }}
                className="custom-selector"
                disabled={isReadOnly}
              >
                {generateTimeOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Duración:</label>
              <select
                value={selectedDuration}
                onChange={(e) => {
                  const duration = parseInt(e.target.value);
                  setSelectedDuration(duration);
                  updateAppointmentDateTime(
                    selectedDate,
                    selectedTime,
                    duration
                  );
                }}
                className="custom-selector"
                disabled={isReadOnly}
              >
                {generateDurationOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <p>
              <strong>Resumen:</strong>{" "}
              {formatAppointmentSummary(appointmentForm.start)}
            </p>
          </div>

          <div className="form-field">
            <label>Notas:</label>
            {currentMode === "see-only" ? (
              <div
                style={{
                  whiteSpace: "pre-wrap",
                  border: "1px solid #ddd",
                  borderRadius: 4,
                  padding: 10,
                  minHeight: 60,
                  background: "#fafafa",
                }}
              >
                {appointmentForm.notes && appointmentForm.notes.trim()
                  ? appointmentForm.notes
                  : "(sin notas)"}
              </div>
            ) : (
              <textarea
                value={appointmentForm.notes || ""}
                onChange={(e) =>
                  setAppointmentForm((prev: any) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                placeholder="Agregar notas de la cita (opcional)"
                rows={3}
                style={{ width: "100%" }}
              />
            )}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent:
                currentMode === "create" ? "flex-end" : "space-between",
              gap: "10px",
            }}
          >
            {/* See-Only Mode Buttons */}
            {currentMode === "see-only" && (
              <>
                <button
                  type="button"
                  onClick={handleCancel}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Cancelar Cita
                </button>
                <button
                  type="button"
                  onClick={() => setShowRescheduleRequestConfirmation(true)}
                  disabled={isRescheduleRequestDisabled}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: isRescheduleRequestDisabled
                      ? "#fcd34d"
                      : "#fbbf24",
                    color: "#1f2937",
                    border: "none",
                    borderRadius: "4px",
                    cursor: isRescheduleRequestDisabled
                      ? "not-allowed"
                      : "pointer",
                    opacity: isRescheduleRequestDisabled ? 0.7 : 1,
                  }}
                >
                  Solicita Reagendar
                </button>
                <button
                  type="button"
                  onClick={handleEditAppointment}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Editar Cita
                </button>
              </>
            )}

            {/* Edit Mode Buttons */}
            {currentMode === "edit" && (
              <>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={handleCancel}
                    style={{
                      padding: "10px 20px",
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Cancelar Cita
                  </button>
                  <button
                    onClick={handleCancelChanges}
                    style={{
                      padding: "10px 20px",
                      backgroundColor: "#6c757d",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Cancelar Cambios
                  </button>
                </div>
                <button
                  onClick={handleValidatedUpdateAppointment}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Guardar Cambios
                </button>
              </>
            )}

            {/* Create Mode Buttons */}
            {currentMode === "create" && (
              <button
                onClick={handleValidatedAddAppointment}
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
            )}
          </div>
        </div>

        {/* Calendar Section */}
        {appointmentForm.doctorId && currentMode === "create" && (
          <div
            style={{
              flex: isMobile ? "none" : "1",
              borderLeft: isMobile ? "none" : "1px solid #eee",
              borderTop: isMobile ? "1px solid #eee" : "none",
              paddingLeft: "20px",
              paddingTop: isMobile ? "20px" : "0",
              minHeight: isMobile ? "500px" : "auto",
            }}
          >
            <DoctorDayView
              doctorId={appointmentForm.doctorId}
              selectedDate={appointmentForm.start}
              selectedInterval={{
                start: appointmentForm.start,
                end: appointmentForm.end,
              }}
              onSlotSelect={(start, end) => {
                // Update appointmentForm
                setAppointmentForm({
                  ...appointmentForm,
                  start,
                  end,
                });

                // Update local state to sync form fields
                setSelectedDate(start);
                const timeString = `${start
                  .getHours()
                  .toString()
                  .padStart(2, "0")}:${start
                  .getMinutes()
                  .toString()
                  .padStart(2, "0")}`;
                setSelectedTime(timeString);

                // Calculate duration in minutes
                const durationMinutes = Math.round(
                  (end.getTime() - start.getTime()) / (1000 * 60)
                );
                setSelectedDuration(durationMinutes);
              }}
              existingAppointments={appointments}
            />
          </div>
        )}
      </div>

      {/* Add Patient Modal */}
      <AddPatientModal
        isOpen={showAddPatientModal}
        onClose={handleCloseAddPatientModal}
        onPatientCreated={handlePatientCreated}
        initialName={initialPatientName}
      />

      {/* Edit Patient Modal */}
      {selectedPatient && (
        <EditPatientModal
          isOpen={showEditPatientModal}
          patient={selectedPatient}
          onClose={handleCloseEditPatientModal}
          onPatientUpdated={handlePatientUpdated}
        />
      )}

      <ConfirmationDialog
        isOpen={showRescheduleRequestConfirmation}
        title="Solicita Reagendar"
        message={
          '¿Seguro que deseas cambiar el estatus de esta cita a "Solicita Reagendar"? Si confirmas, el espacio en la agenda se liberará.'
        }
        confirmText="Sí, solicitar"
        cancelText="No, mantener"
        onConfirm={handleConfirmRescheduleRequest}
        onCancel={() => setShowRescheduleRequestConfirmation(false)}
        confirmButtonStyle="primary"
      />

      {/* Cancel Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showCancelConfirmation}
        title="Cancelar Cita"
        message="¿Estás seguro de que deseas cancelar esta cita? Esta acción no se puede deshacer."
        confirmText="Sí, cancelar cita"
        cancelText="No, mantener"
        onConfirm={handleConfirmCancel}
        onCancel={handleCancelConfirmation}
        confirmButtonStyle="danger"
      />

      {/* Universal Modal for Success/Error Messages */}
      <UniversalModal
        isOpen={universalModal.isOpen}
        type={universalModal.type}
        title={universalModal.title}
        message={universalModal.message}
        onConfirm={universalModal.onConfirm}
      />
    </div>
  );
};

export default AppointmentModal;
