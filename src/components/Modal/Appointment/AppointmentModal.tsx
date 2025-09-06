import { useState, useEffect } from "react";
import Select from "react-select";
import DatePicker, { registerLocale } from "react-datepicker";
import { es } from "date-fns/locale";
import { format } from "date-fns";
import type { Doctor } from "../../../api/entities/Doctor";
import type { Patient } from "../../../api/entities/Patient";
import PatientSearchAutocomplete from "../../PatientSearch/PatientSearchAutocomplete";
import AddPatientModal from "../../PatientSearch/AddPatientModal";
import "react-datepicker/dist/react-datepicker.css";
import "./AppointmentModal.css";
import DoctorDayView from "./DoctorDayView";
import { useWindowSize } from "../../../hooks/useWindowSize";
import { useClinics, useUnits } from "../../../hooks/useOrganizationHelpers";
import "../../../styles/Modal.css";

// Registrar el idioma español
registerLocale("es", es);

const AppointmentModal = ({
  showModal,
  mode = "create", // "create", "edit", or "see-only"
  appointmentForm, // Includes appointmentId
  doctors,
  handleCloseModal,
  handleAddAppointment,
  handleCancelAppointment, // New handler for canceling appointments
  setAppointmentForm,
  appointments, // Receive appointments prop
}: any) => {
  const { isMobile } = useWindowSize();

  // Get organization data
  const { clinics } = useClinics();
  const { units } = useUnits();

  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [initialPatientName, setInitialPatientName] = useState<string>("");
  const [selectedClinicId, setSelectedClinicId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("09:00");
  const [selectedDuration, setSelectedDuration] = useState<number>(60); // Duration in minutes

  if (!showModal) return null;

  // Type guard to ensure doctors is an array before mapping
  const doctorOptions = Array.isArray(doctors)
    ? doctors.map((doctor: Doctor) => ({
        value: doctor.id,
        label: `${doctor.name} - ${doctor.specialty}`,
      }))
    : [];

  // Filter units by selected clinic
  const filteredUnits = selectedClinicId
    ? units.filter((unit) => unit.clinic_id === selectedClinicId)
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

  const isReadOnly = mode === "see-only" || mode === "edit";

  // Generate time options with 15-minute intervals
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
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
    }
    return options;
  };

  // Generate duration options - specific durations only
  const generateDurationOptions = () => {
    const durations = [
      { value: 15, label: "15 min" },
      { value: 30, label: "30 min" },
      { value: 45, label: "45 min" },
      { value: 60, label: "1 hr" },
      { value: 90, label: "1.5 hr" },
      { value: 120, label: "2 hr" },
      { value: 180, label: "3 hr" },
      { value: 240, label: "4 hr" },
    ];
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
      console.warn("Error formatting appointment summary:", error);
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
      console.warn("Invalid parameters for updateAppointmentDateTime:", {
        date,
        time,
        duration,
      });
      return;
    }

    const timeMatch = time.match(/^(\d{1,2}):(\d{2})$/);
    if (!timeMatch) {
      console.warn("Invalid time format:", time);
      return;
    }

    const [hours, minutes] = timeMatch.slice(1).map(Number);

    // Validate hours and minutes
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      console.warn("Invalid time values:", { hours, minutes });
      return;
    }

    const startDateTime = new Date(date);
    startDateTime.setHours(hours, minutes, 0, 0);

    // Verify the date is valid after setting time
    if (isNaN(startDateTime.getTime())) {
      console.warn("Invalid start date created:", startDateTime);
      return;
    }

    const endDateTime = new Date(
      startDateTime.getTime() + duration * 60 * 1000
    );

    // Verify end date is valid
    if (isNaN(endDateTime.getTime())) {
      console.warn("Invalid end date created:", endDateTime);
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
    setAppointmentForm((prevForm: any) => ({
      ...prevForm,
      patientName: patient?.name || "",
      patientId: patient?.id || "",
    }));
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

  // Sync selectedPatient with appointmentForm when modal opens or form changes
  useEffect(() => {
    if (showModal) {
      // Reset patient selection state when modal opens
      if (appointmentForm.patientName && appointmentForm.patientId) {
        // If we have both name and ID, create a patient object
        const patient = {
          id: appointmentForm.patientId,
          name: appointmentForm.patientName,
        };
        setSelectedPatient(patient);
      } else if (appointmentForm.patientName && !appointmentForm.patientId) {
        // If we only have a name (legacy data), clear selection to allow search
        setSelectedPatient(null);
      } else {
        // Clear selection if no patient data
        setSelectedPatient(null);
      }
    }
  }, [showModal, appointmentForm.patientName, appointmentForm.patientId]);

  // Initialize clinic when editing appointment based on selected unit
  useEffect(() => {
    if (showModal && appointmentForm.resourceId && units.length > 0) {
      const selectedUnit = units.find(
        (unit) => unit.id === appointmentForm.resourceId
      );
      if (selectedUnit && selectedUnit.clinic_id !== selectedClinicId) {
        setSelectedClinicId(selectedUnit.clinic_id);
      }
    }
  }, [showModal, appointmentForm.resourceId, units, selectedClinicId]);

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

  // Initialize appointment dates when creating a new appointment
  useEffect(() => {
    if (showModal && mode === "create") {
      // Only initialize once when modal opens for creation
      // Don't check appointmentForm.start/end to avoid dependency loops
      updateAppointmentDateTime(selectedDate, selectedTime, selectedDuration);
    }
  }, [showModal, mode]); // Only depend on modal state and mode

  // Validate and handle appointment creation
  const handleValidatedAddAppointment = () => {
    // Debug logging
    console.log("🐛 DEBUG - appointmentForm:", appointmentForm);
    console.log(
      "🐛 DEBUG - appointmentForm.start:",
      appointmentForm.start,
      typeof appointmentForm.start
    );
    console.log(
      "🐛 DEBUG - appointmentForm.end:",
      appointmentForm.end,
      typeof appointmentForm.end
    );
    console.log("🐛 DEBUG - selectedDate:", selectedDate);
    console.log("🐛 DEBUG - selectedTime:", selectedTime);
    console.log("🐛 DEBUG - selectedDuration:", selectedDuration);

    // Validate required fields
    if (!appointmentForm.doctorId) {
      alert("Por favor selecciona un doctor");
      return;
    }
    if (!appointmentForm.patientId) {
      alert("Por favor selecciona un paciente");
      return;
    }
    if (!appointmentForm.resourceId) {
      alert("Por favor selecciona una unidad");
      return;
    }
    if (!appointmentForm.treatmentType) {
      alert("Por favor ingresa el tipo de tratamiento");
      return;
    }

    // Enhanced date validation with debugging
    if (!appointmentForm.start || !appointmentForm.end) {
      console.error("❌ Missing start or end dates:", {
        start: appointmentForm.start,
        end: appointmentForm.end,
      });
      alert(
        "Por favor selecciona fecha, hora y duración válidas - fechas faltantes"
      );
      return;
    }

    // Check if start/end are valid Date objects
    const startDate = new Date(appointmentForm.start);
    const endDate = new Date(appointmentForm.end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.error("❌ Invalid dates:", {
        start: appointmentForm.start,
        end: appointmentForm.end,
        startValid: !isNaN(startDate.getTime()),
        endValid: !isNaN(endDate.getTime()),
      });
      alert(
        "Por favor selecciona fecha, hora y duración válidas - fechas inválidas"
      );
      return;
    }

    // Convert dates to ISO strings for the backend
    try {
      const appointmentData = {
        ...appointmentForm,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        patient_id: appointmentForm.patientId,
        doctor_id: appointmentForm.doctorId,
        unit_id: appointmentForm.resourceId,
        // Remove the Date objects since we're sending ISO strings
        start: undefined,
        end: undefined,
      };

      console.log("✅ Sending appointment data:", appointmentData);
      handleAddAppointment(appointmentData);
    } catch (error) {
      console.error("❌ Error converting dates to ISO:", error);
      alert("Error al procesar las fechas. Por favor intenta de nuevo.");
    }
  };

  const handleCancel = () => {
    setShowCancelConfirmation(true);
  };

  return (
    <div className="modal-overlay">
      <div
        className="modal-content"
        style={{
          maxWidth:
            appointmentForm.doctorId && mode === "create" ? "900px" : "400px",
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
          <h3>
            {mode === "create"
              ? "Nueva Cita Dental"
              : mode === "edit"
              ? "Editar Cita Dental"
              : "Detalles de la Cita"}
          </h3>

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
            <PatientSearchAutocomplete
              selectedPatient={selectedPatient}
              onPatientSelect={handlePatientSelect}
              onAddNewPatient={handleAddNewPatient}
              disabled={isReadOnly}
              placeholder="Buscar paciente por nombre..."
            />
          </div>

          <div className="form-field">
            <label>Tipo de Tratamiento:</label>
            <input
              type="text"
              value={appointmentForm.treatmentType}
              onChange={(e) =>
                setAppointmentForm((prevForm: any) => ({
                  ...prevForm,
                  treatmentType: e.target.value,
                }))
              }
              className="custom-text-input"
              disabled={isReadOnly}
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
              {clinics.map((clinic) => (
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
              {filteredUnits.map((unit) => (
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
                updateAppointmentDateTime(selectedDate, selectedTime, duration);
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

          <div style={{ marginBottom: "20px" }}>
            <p>
              <strong>Resumen:</strong>{" "}
              {formatAppointmentSummary(appointmentForm.start)}
            </p>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: mode === "create" ? "flex-end" : "space-between",
            }}
          >
            {mode === "edit" && (
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
                Cancelar cita
              </button>
            )}
            {mode === "create" && (
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
        {appointmentForm.doctorId && mode === "create" && (
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
                setAppointmentForm({
                  ...appointmentForm,
                  start,
                  end,
                });
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

      {/* Cancel Confirmation Dialog */}
      {showCancelConfirmation && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div
            className="modal-content"
            style={{
              width: isMobile ? "90vw" : "400px",
              textAlign: "center",
              padding: "20px",
            }}
          >
            <p>
              ¿Estás seguro de que deseas cancelar esta cita? Esta acción no se
              puede deshacer.
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "20px",
              }}
            >
              <button
                onClick={() => setShowCancelConfirmation(false)}
                className="btn-danger"
              >
                No, mantener
              </button>
              <button onClick={handleCancelAppointment} className="btn-success">
                Sí, cancelar cita
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentModal;
