import React, { useState } from "react";
import Select from "react-select"; // Import React-Select
import DatePicker from "react-datepicker";
import type { Doctor } from "../../../api/entities/Doctor";
import "react-datepicker/dist/react-datepicker.css";
import "./AppointmentModal.css";

const AppointmentModal = ({
  showModal,
  appointmentForm,
  resources,
  doctors,
  handleCloseModal,
  handleAddAppointment,
  setAppointmentForm,
}: any) => {
  if (!showModal) return null;

  const doctorOptions = doctors.map((doctor: Doctor) => ({
    value: doctor.id,
    label: `${doctor.name} - ${doctor.specialty}`,
  }));

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

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>
            Nombre del Doctor:
          </label>
          <Select
            options={doctorOptions}
            value={doctorOptions.find(
              (option) => option.value === appointmentForm.doctorId
            )}
            onChange={(selectedOption: any) =>
              setAppointmentForm({
                ...appointmentForm,
                doctorId: selectedOption?.value || "",
                doctorName: selectedOption?.label || "",
                resourceId: selectedOption
                  ? doctors.find((doc) => doc.id === selectedOption.value)
                      ?.defaultUnit || ""
                  : "",
              })
            }
            placeholder="Seleccionar doctor..."
            isClearable
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
          >
            <option value="">Seleccionar Unidad</option>
            {resources.map(
              (resource: { resourceId: string; resourceTitle: string }) => (
                <option
                  key={resource.resourceId}
                  value={resource.resourceId}
                  selected={resource.resourceId === appointmentForm.resourceId}
                >
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
            onChange={(date) =>
              setAppointmentForm({
                ...appointmentForm,
                start: date || appointmentForm.start,
              })
            }
            showTimeSelect
            dateFormat="Pp"
            timeFormat="HH:mm"
            timeIntervals={15}
            className="form-control"
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
          />
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
