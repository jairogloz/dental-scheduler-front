import React from "react";

type Clinic = {
  id: string;
  name: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
};

interface ClinicFilterBarProps {
  selectedClinics: string[];
  onClinicsChange: (selectedClinicIds: string[]) => void;
  clinics: Clinic[];
  getClinicColor?: (clinicId: string) => string;
}

const ClinicFilterBar: React.FC<ClinicFilterBarProps> = ({
  selectedClinics,
  onClinicsChange,
  clinics,
  getClinicColor,
}) => {
  const handleClinicToggle = (clinicId: string) => {
    const updatedSelection = selectedClinics.includes(clinicId)
      ? selectedClinics.filter((id) => id !== clinicId)
      : [...selectedClinics, clinicId];

    onClinicsChange(updatedSelection);
  };

  if (!clinics || clinics.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        padding: "12px 0",
        borderBottom: "1px solid #e2e8f0",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        fontSize: "14px",
      }}
    >
      <span
        style={{
          fontWeight: "600",
          color: "#374151",
          marginRight: "8px",
        }}
      >
        Clínicas:
      </span>

      {clinics.map((clinic: Clinic) => {
        const clinicColor = getClinicColor
          ? getClinicColor(clinic.id)
          : "#9CA3AF";

        return (
          <label
            key={clinic.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
              color: "#374151",
              padding: "4px 8px",
              borderLeft: `3px solid ${clinicColor}`,
              borderRadius: "4px",
              backgroundColor: selectedClinics.includes(clinic.id)
                ? "rgba(59, 130, 246, 0.1)"
                : "transparent",
              transition: "background-color 0.2s ease",
            }}
          >
            <input
              type="checkbox"
              checked={selectedClinics.includes(clinic.id)}
              onChange={() => handleClinicToggle(clinic.id)}
              style={{
                margin: 0,
                cursor: "pointer",
              }}
            />
            {clinic.name}
          </label>
        );
      })}
    </div>
  );
};

export default ClinicFilterBar;
