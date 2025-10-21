import React, { useState, useEffect, useRef } from "react";
import {
  createPatient,
  type Patient,
  type CreatePatientRequest,
} from "../../api/entities/Patient";
import "../../styles/Modal.css";
import "./AddPatientModal.css";

export interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientCreated: (patient: Patient) => void;
  initialName?: string;
}

const AddPatientModal: React.FC<AddPatientModalProps> = ({
  isOpen,
  onClose,
  onPatientCreated,
  initialName = "",
}) => {
  const [formData, setFormData] = useState<CreatePatientRequest>({
    first_name: "",
    last_name: "",
    phone: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      const trimmedInitial = initialName.trim();
      const [firstName, ...rest] = trimmedInitial.split(" ");
      const lastName = rest.join(" ").trim();

      setFormData({
        first_name: firstName || "",
        last_name: lastName || "",
        phone: "",
      });
      setError(null);
      // Focus the name input when modal opens
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, initialName]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.first_name.trim()) {
      setError("El nombre del paciente es requerido");
      nameInputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const newPatient = await createPatient({
        first_name: formData.first_name.trim(),
        last_name: formData.last_name?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
      });

      // Success - notify parent and close modal
      onPatientCreated(newPatient);
      onClose();
    } catch (err) {
      console.error("Error creating patient:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Error al crear el paciente. Por favor, intenta de nuevo."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
      return () => {
        document.removeEventListener("keydown", handleEscapeKey);
      };
    }
  }, [isOpen, isSubmitting, onClose]);

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-content add-patient-modal">
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="modal-close-button"
          aria-label="Cerrar modal"
        >
          ×
        </button>

        {/* Modal header */}
        <div className="modal-header">
          <h3>Agregar Nuevo Paciente</h3>
        </div>

        {/* Modal body */}
        <form onSubmit={handleSubmit} className="add-patient-form">
          {/* Error message */}
          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          {/* Name field */}
          <div className="form-group">
            <label htmlFor="patient-first-name">
              Nombre(s) <span className="required">*</span>
            </label>
            <input
              ref={nameInputRef}
              type="text"
              id="patient-first-name"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className="form-input"
              placeholder="Ingresa el nombre"
              maxLength={100}
              required
              aria-describedby={error ? "error-message" : undefined}
            />
          </div>

          <div className="form-group">
            <label htmlFor="patient-last-name">Apellido(s)</label>
            <input
              type="text"
              id="patient-last-name"
              name="last_name"
              value={formData.last_name || ""}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className="form-input"
              placeholder="Ingresa los apellidos"
              maxLength={100}
            />
          </div>

          {/* Phone field */}
          <div className="form-group">
            <label htmlFor="patient-phone">Teléfono</label>
            <input
              type="tel"
              id="patient-phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className="form-input"
              placeholder="Número de teléfono (opcional)"
              maxLength={20}
            />
          </div>

          {/* Form actions */}
          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.first_name.trim()}
              className="btn-primary"
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-small"></span>
                  Guardando...
                </>
              ) : (
                "Guardar Paciente"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPatientModal;
