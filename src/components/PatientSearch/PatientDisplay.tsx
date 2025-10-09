import React from "react";
import "./PatientSearchAutocomplete.css"; // Reuse existing styles

export interface PatientDisplayProps {
  patientName?: string;
  patientId?: string;
  placeholder?: string;
  onEdit?: () => void;
  onRemove?: () => void;
  showActions?: boolean;
}

const PatientDisplay: React.FC<PatientDisplayProps> = ({
  patientName,
  patientId,
  placeholder = "Sin paciente asignado",
  onEdit,
  onRemove,
  showActions = false,
}) => {
  // Show patient name if available, fallback to patient ID, then placeholder
  const displayValue = patientName || patientId || placeholder;
  const hasPatient = !!(patientName || patientId);

  return (
    <div className="patient-search-container">
      <div
        className="patient-search-input-wrapper"
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
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
            flex: 1,
          }}
        />

        {/* Action buttons - only show if patient is selected and showActions is true */}
        {showActions && hasPatient && (
          <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
            {/* Edit button */}
            {onEdit && (
              <button
                onClick={onEdit}
                title="Editar paciente"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px 8px",
                  color: "#007bff",
                  fontSize: "16px",
                  display: "flex",
                  alignItems: "center",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#0056b3";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#007bff";
                }}
              >
                ✏️
              </button>
            )}

            {/* Remove button */}
            {onRemove && (
              <button
                onClick={onRemove}
                title="Quitar paciente"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px 8px",
                  color: "#dc3545",
                  fontSize: "18px",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#c82333";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#dc3545";
                }}
              >
                ×
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDisplay;
