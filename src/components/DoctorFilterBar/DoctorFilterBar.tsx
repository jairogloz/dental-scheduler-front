import React from "react";

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
  const handleDoctorToggle = (doctorId: string) => {
    const updatedSelection = selectedDoctors.includes(doctorId)
      ? selectedDoctors.filter((id) => id !== doctorId)
      : [...selectedDoctors, doctorId];

    onDoctorsChange(updatedSelection);
  };

  if (!doctors || doctors.length === 0) {
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
        Dr:
      </span>

      {doctors.map((doctor: Doctor) => {
        const doctorColor = getDoctorColor
          ? getDoctorColor(doctor.id)
          : "#9CA3AF";

        return (
          <label
            key={doctor.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
              color: "#374151",
              padding: "4px 8px",
              borderLeft: `3px solid ${doctorColor}`,
              borderRadius: "4px",
              backgroundColor: selectedDoctors.includes(doctor.id)
                ? "rgba(59, 130, 246, 0.1)"
                : "transparent",
              transition: "background-color 0.2s ease",
            }}
          >
            <input
              type="checkbox"
              checked={selectedDoctors.includes(doctor.id)}
              onChange={() => handleDoctorToggle(doctor.id)}
              style={{
                margin: 0,
                cursor: "pointer",
              }}
            />
            {doctor.name}
          </label>
        );
      })}
    </div>
  );
};

export default DoctorFilterBar;
