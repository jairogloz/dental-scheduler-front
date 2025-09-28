import { useAuth } from "../contexts/AuthContext";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const { user, signOut } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      // Close dropdown first
      setShowDropdown(false);

      // Navigate to login immediately to prevent race conditions
      navigate("/login", { replace: true });

      // Then call signOut to clean up auth state
      await signOut();
    } catch (error) {
      console.error("Error during logout:", error);
      // Even if signOut fails, make sure we go to login
      navigate("/login", { replace: true });
    }
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  return (
    <header
      style={{
        backgroundColor: "white",
        borderBottom: "1px solid #e2e8f0",
        padding: "0 20px",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          height: "60px",
          maxWidth: "1280px",
          margin: "0 auto",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "20px",
              fontWeight: "600",
              color: "#2c3e50",
            }}
          >
            Dental Scheduler
          </h1>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "15px",
          }}
        >
          <div ref={dropdownRef} style={{ position: "relative" }}>
            <div
              onClick={toggleDropdown}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "background-color 0.2s",
                backgroundColor: showDropdown ? "#f3f4f6" : "transparent",
              }}
              onMouseEnter={(e) => {
                if (!showDropdown) {
                  e.currentTarget.style.backgroundColor = "#f9fafb";
                }
              }}
              onMouseLeave={(e) => {
                if (!showDropdown) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  fontSize: "14px",
                }}
              >
                <span style={{ fontWeight: "500", color: "#374151" }}>
                  {user?.user_metadata?.full_name || user?.email}
                </span>
                <span
                  style={{
                    color: "#64748b",
                    fontSize: "12px",
                  }}
                >
                  Dental Staff
                </span>
              </div>

              {/* Dropdown arrow icon */}
              <svg
                style={{
                  width: "16px",
                  height: "16px",
                  color: "#6b7280",
                  transform: showDropdown ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>

            {/* Dropdown menu */}
            {showDropdown && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: "0",
                  marginTop: "4px",
                  backgroundColor: "white",
                  borderRadius: "8px",
                  boxShadow:
                    "0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)",
                  border: "1px solid #e5e7eb",
                  minWidth: "180px",
                  zIndex: 1000,
                }}
              >
                <div style={{ padding: "4px 0" }}>
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      // TODO: Implement account functionality
                      alert("Account functionality coming soon!");
                    }}
                    style={{
                      width: "100%",
                      padding: "8px 16px",
                      textAlign: "left",
                      border: "none",
                      backgroundColor: "transparent",
                      fontSize: "14px",
                      color: "#374151",
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f9fafb";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    Cuenta
                  </button>

                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      // TODO: Implement settings functionality
                      alert("Settings functionality coming soon!");
                    }}
                    style={{
                      width: "100%",
                      padding: "8px 16px",
                      textAlign: "left",
                      border: "none",
                      backgroundColor: "transparent",
                      fontSize: "14px",
                      color: "#374151",
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f9fafb";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    Configuración
                  </button>

                  <hr
                    style={{
                      margin: "4px 0",
                      border: "none",
                      borderTop: "1px solid #e5e7eb",
                    }}
                  />

                  <button
                    onClick={handleSignOut}
                    style={{
                      width: "100%",
                      padding: "8px 16px",
                      textAlign: "left",
                      border: "none",
                      backgroundColor: "transparent",
                      fontSize: "14px",
                      color: "#dc2626",
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#fef2f2";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
