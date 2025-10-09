import React, { useState, useEffect } from "react";
import type {
  Patient,
  UpdatePatientRequest,
} from "../../../api/entities/Patient";
import { updatePatient } from "../../../api/entities/Patient";
import ConfirmationDialog from "../ConfirmationDialog";
import UniversalModal from "../UniversalModal";
import "../../Modal/Appointment/AppointmentModal.css";

interface EditPatientModalProps {
  isOpen: boolean;
  patient: Patient;
  onClose: () => void;
  onPatientUpdated: (updatedPatient: Patient) => void;
}

const EditPatientModal: React.FC<EditPatientModalProps> = ({
  isOpen,
  patient,
  onClose,
  onPatientUpdated,
}) => {
  // Parse patient name into first and last name
  const parsePatientName = (name?: string) => {
    if (!name) {
      return { firstName: "", lastName: "" };
    }
    const parts = name.trim().split(" ");
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: "" };
    }
    const firstName = parts[0];
    const lastName = parts.slice(1).join(" ");
    return { firstName, lastName };
  };

  const { firstName: initialFirstName, lastName: initialLastName } =
    parsePatientName(patient.name);

  // Form state
  const [formData, setFormData] = useState({
    firstName: initialFirstName,
    lastName: initialLastName,
    phone: patient.phone || "",
    email: patient.email || "",
  });

  // Track original data to detect changes
  const [originalData, setOriginalData] = useState({
    firstName: initialFirstName,
    lastName: initialLastName,
    phone: patient.phone || "",
    email: patient.email || "",
  });

  // UI state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Success/error modal state
  const [universalModal, setUniversalModal] = useState({
    isOpen: false,
    type: "success" as "success" | "error",
    title: "",
    message: "",
  });

  // Update form when patient changes
  useEffect(() => {
    if (isOpen) {
      const { firstName, lastName } = parsePatientName(patient.name);
      const newData = {
        firstName,
        lastName,
        phone: patient.phone || "",
        email: patient.email || "",
      };
      setFormData(newData);
      setOriginalData(newData);
      setValidationErrors({});
    }
  }, [isOpen, patient]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateEmail = (email: string): boolean => {
    if (!email) return true; // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // First name is required
    if (!formData.firstName.trim()) {
      errors.firstName = "El nombre es requerido";
    }

    // Email validation (if provided)
    if (formData.email && !validateEmail(formData.email)) {
      errors.email = "Email inválido";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const hasChanges = (): boolean => {
    return (
      formData.firstName !== originalData.firstName ||
      formData.lastName !== originalData.lastName ||
      formData.phone !== originalData.phone ||
      formData.email !== originalData.email
    );
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    if (!hasChanges()) {
      setUniversalModal({
        isOpen: true,
        type: "error",
        title: "Sin cambios",
        message: "No se detectaron cambios en los datos del paciente.",
      });
      return;
    }

    setShowConfirmation(true);
  };

  const handleConfirmUpdate = async () => {
    setShowConfirmation(false);
    setIsSubmitting(true);

    try {
      // Prepare update request with only changed fields
      const updateRequest: UpdatePatientRequest = {};

      if (formData.firstName !== originalData.firstName) {
        updateRequest.first_name = formData.firstName;
      }
      if (formData.lastName !== originalData.lastName) {
        updateRequest.last_name = formData.lastName;
      }
      if (formData.phone !== originalData.phone) {
        updateRequest.phone = formData.phone;
      }
      if (formData.email !== originalData.email) {
        updateRequest.email = formData.email;
      }

      console.log("📝 Updating patient with changes:", updateRequest);

      const updatedPatient = await updatePatient(patient.id, updateRequest);

      // Show success modal
      setUniversalModal({
        isOpen: true,
        type: "success",
        title: "¡Paciente actualizado!",
        message: "Los datos del paciente se actualizaron correctamente.",
      });

      // Notify parent component
      onPatientUpdated(updatedPatient);
    } catch (error) {
      console.error("Failed to update patient:", error);
      setUniversalModal({
        isOpen: true,
        type: "error",
        title: "Error",
        message:
          "No se pudo actualizar el paciente. Por favor intenta de nuevo.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSuccessModal = () => {
    setUniversalModal({ ...universalModal, isOpen: false });
    if (universalModal.type === "success") {
      onClose();
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="modal-overlay"
        onClick={handleOverlayClick}
        style={{ zIndex: 1001 }}
      >
        <div
          className="modal-content"
          {...(showConfirmation || universalModal.isOpen
            ? { inert: true as any }
            : {})}
          style={{
            maxWidth: "500px",
            backgroundColor: "white",
            padding: "30px",
            borderRadius: "8px",
            position: "relative",
            maxHeight: "90vh",
            overflowY: "auto",
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "#666",
              padding: "5px 10px",
            }}
            aria-label="Cerrar"
          >
            ×
          </button>

          {/* Header */}
          <h2 style={{ marginBottom: "20px", fontSize: "24px", color: "#333" }}>
            Editar Paciente
          </h2>

          {/* Form */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            {/* First Name */}
            <div className="form-field">
              <label>
                Nombre <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                className="custom-text-input"
                placeholder="Nombre del paciente"
                disabled={isSubmitting}
              />
              {validationErrors.firstName && (
                <span style={{ color: "red", fontSize: "12px" }}>
                  {validationErrors.firstName}
                </span>
              )}
            </div>

            {/* Last Name */}
            <div className="form-field">
              <label>Apellidos</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                className="custom-text-input"
                placeholder="Apellidos del paciente"
                disabled={isSubmitting}
              />
            </div>

            {/* Phone */}
            <div className="form-field">
              <label>Teléfono</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className="custom-text-input"
                placeholder="Teléfono del paciente"
                disabled={isSubmitting}
              />
            </div>

            {/* Email */}
            <div className="form-field">
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="custom-text-input"
                placeholder="email@ejemplo.com"
                disabled={isSubmitting}
              />
              {validationErrors.email && (
                <span style={{ color: "red", fontSize: "12px" }}>
                  {validationErrors.email}
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "16px",
                }}
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "16px",
                  opacity: isSubmitting ? 0.6 : 1,
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirmation}
        title="Confirmar cambios"
        message="¿Estás seguro de que deseas actualizar los datos del paciente?"
        confirmText="Sí, actualizar"
        cancelText="Cancelar"
        onConfirm={handleConfirmUpdate}
        onCancel={() => setShowConfirmation(false)}
        confirmButtonStyle="primary"
      />

      {/* Success/Error Modal */}
      <UniversalModal
        isOpen={universalModal.isOpen}
        type={universalModal.type}
        title={universalModal.title}
        message={universalModal.message}
        confirmText="Aceptar"
        onConfirm={handleCloseSuccessModal}
        confirmButtonStyle={
          universalModal.type === "success" ? "success" : "primary"
        }
      />
    </>
  );
};

export default EditPatientModal;
