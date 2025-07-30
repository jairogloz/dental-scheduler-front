import { useState } from "react";
import Select from "react-select";
import DatePicker from "react-datepicker";
import type { Doctor } from "../../../api/entities/Doctor";
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

  if (!showModal) return null;

  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);

  const doctorOptions = doctors.map((doctor: Doctor) => ({
    value: doctor.id,
    label: `${doctor.name} - ${doctor.specialty}`,
  }));

  console.log("mode:", mode);
  const isReadOnly = mode === "see-only" || mode === "edit";

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
          padding: "20px",
          overflowY: "auto",
          maxHeight: "90vh",
        }}
      >
        {/* Form Section */}
        <div className="modal-form" style={{ flex: isMobile ? "none" : "1" }}>
          {/* Close Button */}
          <button
            onClick={handleCloseModal} // Directly close the modal
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              background: "none",
              border: "none",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            X
          </button>

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
                    ? doctors.find(
                        (doc: Doctor) => doc.id === selectedOption.value
                      )?.defaultUnit || ""
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
            <input
              type="text"
              value={appointmentForm.patientName}
              onChange={(e) =>
                setAppointmentForm({
                  ...appointmentForm,
                  patientName: e.target.value,
                })
              }
              className="custom-text-input"
              disabled={isReadOnly}
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
