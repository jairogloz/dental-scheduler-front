import React, { useState, useEffect, useRef } from "react";
import {
  createPatient,
  type Patient,
  type CreatePatientRequest,
} from "../../api/entities/Patient";
import { useAuth } from "../../contexts/AuthContext";
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
  const { organizationId } = useAuth(); // Use organizationId directly from context
  const [formData, setFormData] = useState<CreatePatientRequest>({
    name: "",
    phone: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: initialName || "",
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
    if (!formData.name.trim()) {
      setError("El nombre del paciente es requerido");
      nameInputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const newPatient = await createPatient({
        name: formData.name.trim(),
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
            <label htmlFor="patient-name">
              Nombre del Paciente <span className="required">*</span>
            </label>
            <input
              ref={nameInputRef}
              type="text"
              id="patient-name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className="form-input"
              placeholder="Ingresa el nombre completo"
              maxLength={100}
              required
              aria-describedby={error ? "error-message" : undefined}
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
              disabled={isSubmitting || !formData.name.trim()}
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
