import { useState, useEffect } from "react";
import Select from "react-select";
import DatePicker from "react-datepicker";
import type { Doctor } from "../../../api/entities/Doctor";
import type { Patient } from "../../../api/entities/Patient";
import PatientSearchAutocomplete from "../../PatientSearch/PatientSearchAutocomplete";
import AddPatientModal from "../../PatientSearch/AddPatientModal";
import "react-datepicker/dist/react-datepicker.css";
import "./AppointmentModal.css";
import DoctorDayView from "./DoctorDayView";
import { useWindowSize } from "../../../hooks/useWindowSize";
import "../../../styles/Modal.css";

const AppointmentModal = ({
  showModal,
  mode = "create", // "create", "edit", or "see-only"
  appointmentForm, // Includes appointmentId
  resources,
  doctors,
  handleCloseModal,
  handleAddAppointment,
  handleCancelAppointment, // New handler for canceling appointments
  setAppointmentForm,
  appointments, // Receive appointments prop
}: any) => {
  const { isMobile } = useWindowSize();

  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [initialPatientName, setInitialPatientName] = useState<string>("");

  if (!showModal) return null;

  // Type guard to ensure doctors is an array before mapping
  const doctorOptions = Array.isArray(doctors)
    ? doctors.map((doctor: Doctor) => ({
        value: doctor.id,
        label: `${doctor.name} - ${doctor.specialty}`,
      }))
    : [];

  const isReadOnly = mode === "see-only" || mode === "edit";

  // Patient search handlers
  const handlePatientSelect = (patient: Patient | null) => {
    setSelectedPatient(patient);
    setAppointmentForm({
      ...appointmentForm,
      patientName: patient?.name || "",
      patientId: patient?.id || "",
    });
  };

  const handleAddNewPatient = (searchQuery?: string) => {
    setInitialPatientName(searchQuery || "");
    setShowAddPatientModal(true);
  };

  const handlePatientCreated = (newPatient: Patient) => {
    console.log("📝 Patient created successfully:", newPatient);

    // Update selected patient state
    setSelectedPatient(newPatient);

    // Update appointment form with patient details
    const updatedForm = {
      ...appointmentForm,
      patientName: newPatient.name,
      patientId: newPatient.id,
    };

    console.log("📋 Updating appointment form:", updatedForm);
    setAppointmentForm(updatedForm);

    // Close the add patient modal
    setShowAddPatientModal(false);

    console.log("✅ Patient selection and form update completed");
  };

  const handleCloseAddPatientModal = () => {
    setShowAddPatientModal(false);
  };

  // Sync selectedPatient with appointmentForm when modal opens or form changes
  useEffect(() => {
    if (showModal) {
      console.log("🔄 Modal opened, initializing patient selection...");
      console.log("📋 Current appointmentForm:", {
        patientName: appointmentForm.patientName,
        patientId: appointmentForm.patientId,
      });

      // Reset patient selection state when modal opens
      if (appointmentForm.patientName && appointmentForm.patientId) {
        // If we have both name and ID, create a patient object
        const patient = {
          id: appointmentForm.patientId,
          name: appointmentForm.patientName,
        };
        console.log("👤 Setting selected patient:", patient);
        setSelectedPatient(patient);
      } else if (appointmentForm.patientName && !appointmentForm.patientId) {
        // If we only have a name (legacy data), clear selection to allow search
        console.log("⚠️ Only name found, clearing selection for search");
        setSelectedPatient(null);
      } else {
        // Clear selection if no patient data
        console.log("🆕 No patient data, clearing selection");
        setSelectedPatient(null);
      }
    }
  }, [showModal, appointmentForm.patientName, appointmentForm.patientId]);

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
        <div className="modal-form" style={{ flex: isMobile ? "none" : "1" }}>
          <h3>
            {mode === "create"
              ? "Nueva Cita Dental"
              : mode === "edit"
              ? "Editar Cita Dental"
              : "Detalles de la Cita"}
          </h3>

          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>
              Nombre del Doctor:
            </label>
            <Select
              options={doctorOptions}
              value={doctorOptions.find(
                (option: { value: string; label: string }) =>
                  option.value === appointmentForm.doctorId
              )}
              onChange={(
                selectedOption: { value: string; label: string } | null
              ) =>
                setAppointmentForm({
                  ...appointmentForm,
                  doctorId: selectedOption?.value || "",
                  doctorName: selectedOption?.label || "",
                  resourceId: selectedOption
                    ? Array.isArray(doctors)
                      ? doctors.find(
                          (doc: Doctor) => doc.id === selectedOption.value
                        )?.default_unit_id || ""
                      : ""
                    : "",
                })
              }
              placeholder="Seleccionar doctor..."
              isClearable
              isDisabled={isReadOnly}
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>
              Nombre del Paciente:
            </label>
            <PatientSearchAutocomplete
              selectedPatient={selectedPatient}
              onPatientSelect={handlePatientSelect}
              onAddNewPatient={handleAddNewPatient}
              disabled={isReadOnly}
              placeholder="Buscar paciente por nombre..."
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
              className="custom-text-input"
              disabled={isReadOnly}
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
              className="custom-selector"
              disabled={isReadOnly}
            >
              <option value="">Seleccionar Unidad</option>
              {resources.map(
                (resource: { resourceId: string; resourceTitle: string }) => (
                  <option key={resource.resourceId} value={resource.resourceId}>
                    {resource.resourceTitle}
                  </option>
                )
              )}
            </select>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>
              Fecha y Hora de Inicio:
            </label>
            <DatePicker
              selected={appointmentForm.start}
              onChange={(date) => {
                if (date) {
                  const newStart = date;
                  const newEnd = new Date(newStart.getTime() + 15 * 60 * 1000); // Add 15 minutes (one timeslot)
                  setAppointmentForm({
                    ...appointmentForm,
                    start: newStart,
                    end:
                      newStart >= appointmentForm.end
                        ? newEnd
                        : appointmentForm.end, // Adjust end time if needed
                  });
                }
              }}
              showTimeSelect
              dateFormat="Pp"
              timeFormat="HH:mm"
              timeIntervals={15}
              className="form-control"
              disabled={isReadOnly}
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>
              Fecha y Hora de Fin:
            </label>
            <DatePicker
              selected={appointmentForm.end}
              onChange={(date) =>
                setAppointmentForm({
                  ...appointmentForm,
                  end: date || appointmentForm.end,
                })
              }
              showTimeSelect
              dateFormat="Pp"
              timeFormat="HH:mm"
              timeIntervals={15}
              className="form-control"
              disabled={isReadOnly}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <p>
              <strong>Fecha y Hora:</strong>{" "}
              {appointmentForm.start.toLocaleString()} -{" "}
              {appointmentForm.end.toLocaleString()}
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
