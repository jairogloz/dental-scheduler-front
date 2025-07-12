import React, { useState } from "react";

type Doctor = {
  id: number;
  name: string;
  specialty: string;
  defaultClinic: string;
  defaultUnit: string;
};

type DoctorSelectProps = {
  doctors: Doctor[];
  value: Doctor | null;
  onChange: (selectedDoctor: Doctor | null) => void;
  onUnitChange: (unit: string | null) => void; // New prop for unit selection
};

const DoctorSelect: React.FC<DoctorSelectProps> = ({
  doctors,
  value,
  onChange,
  onUnitChange,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>(doctors);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [error, setError] = useState("");

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term.trim() === "") {
      setFilteredDoctors(doctors);
      setError("");
      return;
    }

    const matches = doctors.filter(
      (doctor) =>
        doctor.name.toLowerCase().includes(term.toLowerCase()) ||
        doctor.specialty.toLowerCase().includes(term.toLowerCase())
    );

    setFilteredDoctors(matches);
    setError(matches.length === 0 ? "No doctor found" : "");
    setHighlightedIndex(-1);
  };

  const handleSelect = (doctor: Doctor) => {
    setSearchTerm(doctor.name);
    onChange(doctor);
    onUnitChange(doctor.defaultUnit); // Select the doctor's default unit
    setIsDropdownVisible(false);
    setError("");
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
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0) {
        handleSelect(filteredDoctors[highlightedIndex]);
      } else if (filteredDoctors.length === 1) {
        handleSelect(filteredDoctors[0]);
      } else {
        setError("No doctor found");
        onChange(null);
      }
    } else if (e.key === "Escape") {
      setIsDropdownVisible(false);
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    if (!e.relatedTarget || !(e.relatedTarget as HTMLElement).closest("ul")) {
      setIsDropdownVisible(false);
      const exactMatch = doctors.find((doctor) => doctor.name === searchTerm);
      if (!exactMatch) {
        setSearchTerm("");
        onChange(null);
        onUnitChange(null); // Clear the unit if no doctor is selected
        setError("No doctor found");
      }
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <label style={{ display: "block", marginBottom: "5px" }}>
        Nombre del Doctor:
      </label>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        onFocus={() => setIsDropdownVisible(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        style={{
          width: "100%",
          padding: "8px",
          border: "1px solid #ccc",
          borderRadius: "4px",
        }}
        placeholder="Buscar doctor..."
      />
      {isDropdownVisible && filteredDoctors.length > 0 && (
        <ul
          style={{
            listStyleType: "none",
            padding: 0,
            margin: "5px 0 0",
            border: "1px solid #ccc",
            borderRadius: "4px",
            maxHeight: "150px",
            overflowY: "auto",
            backgroundColor: "white",
            position: "absolute",
            width: "100%",
            zIndex: 1001,
          }}
          tabIndex={-1} // Allow focus to prevent onBlur from triggering
        >
          {filteredDoctors.map((doctor, index) => (
            <li
              key={doctor.id}
              onClick={() => handleSelect(doctor)}
              tabIndex={0} // Make clickable with keyboard focus
              style={{
                padding: "8px",
                cursor: "pointer",
                borderBottom: "1px solid #eee",
                backgroundColor:
                  index === highlightedIndex ? "#f0f0f0" : "white",
              }}
            >
              <strong>{doctor.name}</strong> - {doctor.specialty} (
              {doctor.defaultUnit})
            </li>
          ))}
        </ul>
      )}
      {error && <p style={{ color: "red", marginTop: "5px" }}>{error}</p>}
    </div>
  );
};

export default DoctorSelect;
