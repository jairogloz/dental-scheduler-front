import React from "react";
import "../../styles/Modal.css";

interface UniversalModalProps {
  isOpen: boolean;
  type: "confirmation" | "success" | "error";
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void; // Optional for success/error modals
  confirmButtonStyle?: "danger" | "primary" | "success";
}

const UniversalModal: React.FC<UniversalModalProps> = ({
  isOpen,
  type,
  title,
  message,
  confirmText = "Aceptar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
  confirmButtonStyle = "primary",
}) => {
  if (!isOpen) return null;

  // Determine button colors based on type and style
  const getConfirmButtonColor = () => {
    if (type === "success") return "#28a745";
    if (type === "error") return "#dc3545";
    if (confirmButtonStyle === "danger") return "#dc3545";
    if (confirmButtonStyle === "success") return "#28a745";
    return "#007bff"; // primary
  };

  // Determine icon based on type
  const getIcon = () => {
    switch (type) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "confirmation":
        return "❓";
      default:
        return "";
    }
  };

  const showCancelButton = type === "confirmation" && onCancel;

  return (
    <div className="modal-overlay" style={{ zIndex: 1001 }}>
      <div
        className="modal-content"
        style={{
          maxWidth: "400px",
          backgroundColor: "white",
          padding: "30px",
          borderRadius: "8px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: "15px" }}>
          {getIcon()}
        </div>

        <h3 style={{ marginBottom: "15px", color: "#333" }}>{title}</h3>
        <p style={{ marginBottom: "25px", color: "#666", lineHeight: "1.5" }}>
          {message}
        </p>

        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          {showCancelButton && (
            <button
              onClick={onCancel}
              style={{
                padding: "10px 20px",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              {cancelText}
            </button>
          )}

          <button
            onClick={onConfirm}
            style={{
              padding: "10px 20px",
              backgroundColor: getConfirmButtonColor(),
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              minWidth: showCancelButton ? "auto" : "120px",
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UniversalModal;
