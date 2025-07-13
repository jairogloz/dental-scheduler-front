import React, { useState, useEffect, useRef } from "react";
import DoctorSelect from "./DoctorSelect";
import DatePicker from "react-datepicker";
import type { Doctor } from "../../../api/entities/Doctor";
import "react-datepicker/dist/react-datepicker.css"; // Import styles for react-datepicker
import "./AppointmentModal.css"; // Import custom styles

const AppointmentModal = ({
  showModal,
  appointmentForm,
  resources,
  doctors,
  handleCloseModal,
  handleAddAppointment,
  setAppointmentForm,
}: any) => {
  const [filteredDoctors, setFilteredDoctors] = useState(doctors);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const prevDoctorNameRef = useRef(appointmentForm.doctorName);

  useEffect(() => {
    // Validate the input when the dropdown is closed
    if (
      !isDropdownVisible &&
      prevDoctorNameRef.current !== appointmentForm.doctorName
    ) {
      const isValidDoctor = doctors.some(
        (doctor: any) => doctor.name === appointmentForm.doctorName
      );
      if (!isValidDoctor) {
        setAppointmentForm((prevForm: any) => ({
          ...prevForm,
          doctorName: "",
        }));
      }
      prevDoctorNameRef.current = appointmentForm.doctorName;
    }
  }, [isDropdownVisible, doctors, setAppointmentForm]);

  if (!showModal) return null;

  const handleDoctorSearch = (searchTerm: string) => {
    const filtered = doctors.filter((doctor: any) =>
      doctor.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredDoctors(filtered);
    setAppointmentForm({
      ...appointmentForm,
      doctorName: searchTerm,
    });
    setIsDropdownVisible(true);
    setHighlightedIndex(-1); // Reset highlighted index
  };

  const handleDoctorSelect = (doctorName: string) => {
    setAppointmentForm({
      ...appointmentForm,
      doctorName,
    });
    setFilteredDoctors(doctors); // Reset the filtered list
    setIsDropdownVisible(false);
    setHighlightedIndex(-1); // Reset highlighted index
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isDropdownVisible || filteredDoctors.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prevIndex) =>
        prevIndex < filteredDoctors.length - 1 ? prevIndex + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prevIndex) =>
        prevIndex > 0 ? prevIndex - 1 : filteredDoctors.length - 1
      );
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      handleDoctorSelect(filteredDoctors[highlightedIndex].name);
    } else if (e.key === "Escape") {
      setIsDropdownVisible(false);
    }
  };

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
        {/* Replace Nombre del Doctor input with DoctorSelect */}
        <div style={{ marginBottom: "15px" }}>
          <DoctorSelect
            doctors={doctors}
            value={
              doctors.find(
                (doc: Doctor) => doc.name === appointmentForm.doctorName
              ) || null
            }
            onChange={(selectedDoctor: Doctor | null) =>
              setAppointmentForm({
                ...appointmentForm,
                doctorName: selectedDoctor ? selectedDoctor.name : "",
                resourceId: selectedDoctor ? selectedDoctor.defaultUnit : "", // Automatically set default unit
              })
            }
            onUnitChange={(unit: string | null) =>
              setAppointmentForm({
                ...appointmentForm,
                resourceId: unit || "", // Update the unit when it changes
              })
            }
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
                  selected={resource.resourceId === appointmentForm.resourceId} // Ensure proper selection
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
                start: date || appointmentForm.start, // Ensure date is not null
              })
            }
            showTimeSelect
            dateFormat="Pp" // Format for date and time
            timeFormat="HH:mm"
            timeIntervals={15} // Time intervals in minutes
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
                end: date || appointmentForm.end, // Ensure date is not null
              })
            }
            showTimeSelect
            dateFormat="Pp" // Format for date and time
            timeFormat="HH:mm"
            timeIntervals={15} // Time intervals in minutes
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
