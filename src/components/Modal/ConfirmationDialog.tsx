import React, { useEffect, useRef } from "react";
import "../../styles/Modal.css";

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmButtonStyle?: "danger" | "primary";
  hideCancelButton?: boolean;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
  confirmButtonStyle = "primary",
  hideCancelButton = false,
}) => {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Focus on appropriate button when dialog opens
      // Destructive actions (danger) -> focus Cancel
      // Creative actions (primary) -> focus Confirm
      if (confirmButtonStyle === "danger" && !hideCancelButton) {
        cancelButtonRef.current?.focus();
      } else {
        confirmButtonRef.current?.focus();
      }
    }
  }, [isOpen, confirmButtonStyle, hideCancelButton]);

  if (!isOpen) return null;

  const confirmButtonColor =
    confirmButtonStyle === "danger" ? "#dc3545" : "#007bff";

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
        <h3 style={{ marginBottom: "15px", color: "#333" }}>{title}</h3>
        <p style={{ marginBottom: "25px", color: "#666", lineHeight: "1.5" }}>
          {message}
        </p>

        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          {!hideCancelButton && (
            <button
              ref={cancelButtonRef}
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
            ref={confirmButtonRef}
            onClick={onConfirm}
            style={{
              padding: "10px 20px",
              backgroundColor: confirmButtonColor,
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;
