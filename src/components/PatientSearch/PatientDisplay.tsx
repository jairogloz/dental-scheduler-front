import React from "react";
import "./PatientSearchAutocomplete.css"; // Reuse existing styles

export interface PatientDisplayProps {
  patientName?: string;
  patientId?: string;
  placeholder?: string;
}

const PatientDisplay: React.FC<PatientDisplayProps> = ({
  patientName,
  patientId,
  placeholder = "Sin paciente asignado",
}) => {
  // Show patient name if available, fallback to patient ID, then placeholder
  const displayValue = patientName || patientId || placeholder;

  return (
    <div className="patient-search-container">
      <div className="patient-search-input-wrapper">
        <input
          type="text"
          value={displayValue}
          readOnly
          disabled
          className="patient-search-input"
          style={{
            backgroundColor: "#f8f9fa",
            cursor: "default",
            color: patientName ? "#212529" : "#6c757d", // Different color for fallback text
          }}
        />
      </div>
    </div>
  );
};

export default PatientDisplay;
