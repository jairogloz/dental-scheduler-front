import React, { useEffect, useMemo, useRef, useState } from "react";

interface Doctor {
  id: string;
  name: string;
}

interface DoctorFilterBarProps {
  selectedDoctors: string[];
  onDoctorsChange: (selectedDoctorIds: string[]) => void;
  doctors: Doctor[];
  getDoctorColor?: (doctorId: string) => string;
}

const DoctorFilterBar: React.FC<DoctorFilterBarProps> = ({
  selectedDoctors,
  onDoctorsChange,
  doctors,
  getDoctorColor,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalDoctors = doctors.length;
  const selectedCount = selectedDoctors.length;
  const isFiltered = totalDoctors > 0 && selectedCount !== totalDoctors;

  const buttonLabel = useMemo(() => {
    if (selectedCount === 0) {
      return "Ninguno seleccionado";
    }
    if (selectedCount === totalDoctors) {
      return "Todos";
    }
    return `${selectedCount} seleccionados`;
  }, [selectedCount, totalDoctors]);

  const handleDoctorToggle = (doctorId: string) => {
    const updatedSelection = selectedDoctors.includes(doctorId)
      ? selectedDoctors.filter((id) => id !== doctorId)
      : [...selectedDoctors, doctorId];

    onDoctorsChange(updatedSelection);
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

  if (!doctors || doctors.length === 0) {
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
        Dr:
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
              minWidth: "240px",
              maxHeight: "260px",
              overflowY: "auto",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              backgroundColor: "#fff",
              boxShadow: "0 10px 30px rgba(15, 23, 42, 0.12)",
              padding: "8px 0",
              zIndex: 5,
            }}
          >
            {doctors.map((doctor) => {
              const doctorColor = getDoctorColor
                ? getDoctorColor(doctor.id)
                : "#9CA3AF";

              return (
                <label
                  key={doctor.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "8px 14px",
                    cursor: "pointer",
                    fontSize: "13px",
                    color: "#1f2937",
                    backgroundColor: selectedDoctors.includes(doctor.id)
                      ? "rgba(59,130,246,0.07)"
                      : "transparent",
                    transition: "background-color 0.15s ease",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedDoctors.includes(doctor.id)}
                    onChange={() => handleDoctorToggle(doctor.id)}
                    style={{ cursor: "pointer" }}
                  />
                  <span
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "2px",
                      backgroundColor: doctorColor,
                    }}
                  />
                  <span>{doctor.name}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorFilterBar;
