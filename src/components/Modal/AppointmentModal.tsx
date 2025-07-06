import React from "react";

const AppointmentModal = ({
  showModal,
  appointmentForm,
  resources,
  handleCloseModal,
  handleAddAppointment,
  setAppointmentForm,
}: any) => {
  if (!showModal) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "30px",
          borderRadius: "8px",
          width: "400px",
          maxWidth: "90vw",
        }}
      >
        <h3>Nueva Cita Dental</h3>
        {/* Form fields */}
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
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
        </div>
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>
            Nombre del Doctor:
          </label>
          <input
            type="text"
            value={appointmentForm.doctorName}
            onChange={(e) =>
              setAppointmentForm({
                ...appointmentForm,
                doctorName: e.target.value,
              })
            }
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
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
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
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
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          >
            <option value="">Seleccionar Unidad</option>
            {resources.map((resource) => (
              <option key={resource.resourceId} value={resource.resourceId}>
                {resource.resourceTitle}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <p>
            <strong>Fecha y Hora:</strong>{" "}
            {appointmentForm.start.toLocaleString()} -{" "}
            {appointmentForm.end.toLocaleString()}
          </p>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button
            onClick={handleCloseModal}
            style={{
              padding: "10px 20px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
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
        </div>
      </div>
    </div>
  );
};

export default AppointmentModal;
