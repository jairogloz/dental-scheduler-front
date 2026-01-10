import React, { useState, useEffect, useRef } from "react";
import "../../styles/Modal.css";

interface SnoozeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (number: number, time_unit: string) => void;
  appointmentTitle?: string;
  isLoading?: boolean;
}

const QUANTITY_OPTIONS = [
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 5, label: "5" },
];

const TIME_UNITS = [
  { value: "days", label: "Días" },
  { value: "weeks", label: "Semanas" },
  { value: "months", label: "Meses" },
];

export const SnoozeModal: React.FC<SnoozeModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  appointmentTitle,
  isLoading = false,
}) => {
  const [number, setNumber] = useState<number>(1);
  const [timeUnit, setTimeUnit] = useState<string>("days");
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (QUANTITY_OPTIONS.some((option) => option.value === number)) {
      onSubmit(number, timeUnit);
    }
  };

  const handleClose = () => {
    setNumber(1);
    setTimeUnit("days");
    onClose();
  };

  // Focus submit button when modal opens
  useEffect(() => {
    if (isOpen && submitButtonRef.current) {
      const timer = setTimeout(() => {
        submitButtonRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      style={{ zIndex: 1001 }}
      onClick={handleClose}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "400px",
          maxWidth: "90vw",
          backgroundColor: "white",
          padding: "0",
          borderRadius: "8px",
        }}
      >
        <div
          style={{
            padding: "20px 20px 0",
            borderBottom: "1px solid #e9ecef",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: "18px",
              fontWeight: "600",
              color: "#212529",
            }}
          >
            Posponer Cita
          </h3>
          <button
            onClick={handleClose}
            disabled={isLoading}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              color: "#6c757d",
              cursor: "pointer",
              padding: "4px",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: "20px" }}>
          {appointmentTitle && (
            <div
              style={{
                backgroundColor: "#f3f4f6",
                padding: "12px",
                borderRadius: "8px",
                marginBottom: "20px",
              }}
            >
              <h4
                style={{
                  margin: "0 0 4px 0",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                Cita
              </h4>
              <p style={{ margin: "0", color: "#6b7280", fontSize: "14px" }}>
                {appointmentTitle}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "500",
                  marginBottom: "12px",
                }}
              >
                ¿Por cuánto tiempo quieres posponer esta cita?
              </label>

              <div style={{ display: "flex", gap: "15px" }}>
                <div style={{ flex: 1, minWidth: "0" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      color: "#6b7280",
                      marginBottom: "4px",
                    }}
                  >
                    Cantidad
                  </label>
                  <select
                    value={number}
                    onChange={(e) => setNumber(parseInt(e.target.value))}
                    disabled={isLoading}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px",
                      backgroundColor: "white",
                    }}
                    required
                  >
                    {QUANTITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ flex: 1, minWidth: "0" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      color: "#6b7280",
                      marginBottom: "4px",
                    }}
                  >
                    Unidad
                  </label>
                  <select
                    value={timeUnit}
                    onChange={(e) => setTimeUnit(e.target.value)}
                    disabled={isLoading}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px",
                      backgroundColor: "white",
                    }}
                    required
                  >
                    {TIME_UNITS.map((unit) => (
                      <option key={unit.value} value={unit.value}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#dbeafe",
                padding: "12px",
                borderRadius: "8px",
                marginBottom: "24px",
              }}
            >
              <p style={{ margin: "0", fontSize: "14px", color: "#1e40af" }}>
                Esta cita será removida de la cola y reaparecerá después de{" "}
                <strong>
                  {number}{" "}
                  {TIME_UNITS.find(
                    (u) => u.value === timeUnit
                  )?.label.toLowerCase()}
                </strong>
                .
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
                paddingTop: "20px",
                borderTop: "1px solid #e9ecef",
                marginTop: "20px",
              }}
            >
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                  opacity: isLoading ? 0.5 : 1,
                }}
              >
                Cancelar
              </button>
              <button
                ref={submitButtonRef}
                type="submit"
                disabled={
                  isLoading ||
                  !QUANTITY_OPTIONS.some((option) => option.value === number)
                }
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#f59e0b",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                  opacity:
                    isLoading ||
                    !QUANTITY_OPTIONS.some((option) => option.value === number)
                      ? 0.5
                      : 1,
                }}
              >
                {isLoading ? "Posponiendo..." : "Posponer"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
