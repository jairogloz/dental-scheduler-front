import React, { useEffect, useMemo, useRef, useState } from "react";

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
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalClinics = clinics.length;
  const selectedCount = selectedClinics.length;
  const isFiltered = totalClinics > 0 && selectedCount !== totalClinics;

  const buttonLabel = useMemo(() => {
    if (selectedCount === 0) {
      return "Ninguna seleccionada";
    }
    if (selectedCount === totalClinics) {
      return "Todas";
    }
    return `${selectedCount} seleccionadas`;
  }, [selectedCount, totalClinics]);

  const handleClinicToggle = (clinicId: string) => {
    const updatedSelection = selectedClinics.includes(clinicId)
      ? selectedClinics.filter((id) => id !== clinicId)
      : [...selectedClinics, clinicId];

    onClinicsChange(updatedSelection);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!clinics || clinics.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "14px",
        position: "relative",
      }}
    >
      <span
        style={{
          fontWeight: "600",
          color: "#374151",
        }}
      >
        Clínicas:
      </span>

      <div style={{ position: "relative" }}>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 12px",
            border: "1px solid #cbd5f5",
            borderRadius: "6px",
            backgroundColor: isFiltered ? "rgba(59,130,246,0.08)" : "#fff",
            color: "#1f2937",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 500,
            boxShadow: isFiltered ? "0 0 0 1px rgba(59,130,246,0.2)" : "none",
            minWidth: "160px",
            justifyContent: "space-between",
          }}
        >
          <span>{buttonLabel}</span>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {isFiltered && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: "18px",
                  padding: "0 6px",
                  borderRadius: "9999px",
                  backgroundColor: "#3b82f6",
                  color: "#fff",
                  fontSize: "11px",
                  fontWeight: 600,
                }}
              >
                {selectedCount}
              </span>
            )}
            <span style={{ fontSize: "10px" }}>▼</span>
          </div>
        </button>

        {isOpen && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              left: 0,
              minWidth: "220px",
              maxHeight: "240px",
              overflowY: "auto",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              backgroundColor: "#fff",
              boxShadow: "0 10px 30px rgba(15, 23, 42, 0.12)",
              padding: "8px 0",
              zIndex: 5,
            }}
          >
            {clinics.map((clinic) => {
              const clinicColor = getClinicColor
                ? getClinicColor(clinic.id)
                : "#9CA3AF";

              return (
                <label
                  key={clinic.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "8px 14px",
                    cursor: "pointer",
                    fontSize: "13px",
                    color: "#1f2937",
                    backgroundColor: selectedClinics.includes(clinic.id)
                      ? "rgba(59,130,246,0.07)"
                      : "transparent",
                    transition: "background-color 0.15s ease",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedClinics.includes(clinic.id)}
                    onChange={() => handleClinicToggle(clinic.id)}
                    style={{ cursor: "pointer" }}
                  />
                  <span
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "2px",
                      backgroundColor: clinicColor,
                    }}
                  />
                  <span>{clinic.name}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClinicFilterBar;
