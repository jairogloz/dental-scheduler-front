interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  activeSection: string;
  onSectionChange: (section: string) => void;
  isMobile?: boolean;
}

interface NavItem {
  id: string;
  label: string;
  icon: string;
  disabled?: boolean;
}

const navItems: NavItem[] = [
  { id: "appointments", label: "Citas", icon: "📅" },
  { id: "patients", label: "Pacientes", icon: "👥", disabled: true },
  { id: "doctors", label: "Doctores", icon: "👨‍⚕️", disabled: true },
  { id: "expenses", label: "Gastos", icon: "💰", disabled: true },
  { id: "reports", label: "Reportes", icon: "📊", disabled: true },
  { id: "settings", label: "Configuración", icon: "⚙️", disabled: true },
];

const Sidebar = ({
  isCollapsed,
  onToggle,
  activeSection,
  onSectionChange,
  isMobile = false,
}: SidebarProps) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && !isCollapsed && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 99,
          }}
          onClick={onToggle}
        />
      )}

      <div
        style={{
          width: isCollapsed ? "60px" : "240px",
          height: "100vh",
          backgroundColor: "#1f2937",
          color: "white",
          transition: "width 0.3s ease",
          position: "fixed",
          left: 0,
          top: 0,
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid #374151",
        }}
      >
        {/* Header with toggle button */}
        <div
          style={{
            padding: "16px",
            borderBottom: "1px solid #374151",
            display: "flex",
            alignItems: "center",
            justifyContent: isCollapsed ? "center" : "space-between",
            minHeight: "60px",
          }}
        >
          {!isCollapsed && (
            <h2
              style={{
                margin: 0,
                fontSize: "18px",
                fontWeight: "600",
                color: "#f9fafb",
              }}
            >
              Menú
            </h2>
          )}
          <button
            onClick={onToggle}
            style={{
              backgroundColor: "transparent",
              border: "none",
              color: "#9ca3af",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "4px",
              fontSize: "18px",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#f9fafb";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#9ca3af";
            }}
          >
            {isCollapsed ? "☰" : "←"}
          </button>
        </div>

        {/* Navigation items */}
        <nav style={{ flex: 1, padding: "8px 0", overflow: "hidden" }}>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => !item.disabled && onSectionChange(item.id)}
              disabled={item.disabled}
              style={{
                width: "calc(100% - 16px)",
                padding: isCollapsed ? "10px 0" : "10px 12px",
                backgroundColor:
                  activeSection === item.id ? "#374151" : "transparent",
                border: "none",
                color: item.disabled ? "#6b7280" : "#f9fafb",
                cursor: item.disabled ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: isCollapsed ? "0" : "10px",
                fontSize: "14px",
                fontWeight: activeSection === item.id ? "500" : "400",
                transition: "background-color 0.2s, color 0.2s",
                textAlign: "left",
                justifyContent: isCollapsed ? "center" : "flex-start",
                margin: "2px 8px",
                borderRadius: "6px",
                opacity: item.disabled ? 0.5 : 1,
                boxSizing: "border-box",
                overflow: "hidden",
                minHeight: "40px",
              }}
              onMouseEnter={(e) => {
                if (!item.disabled && activeSection !== item.id) {
                  e.currentTarget.style.backgroundColor = "#4b5563";
                }
              }}
              onMouseLeave={(e) => {
                if (!item.disabled && activeSection !== item.id) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              <span
                style={{
                  fontSize: "16px",
                  width: "20px",
                  height: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  lineHeight: 1,
                }}
              >
                {item.icon}
              </span>
              {!isCollapsed && (
                <span
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    flex: 1,
                  }}
                >
                  {item.label}
                  {item.disabled && (
                    <span
                      style={{
                        fontSize: "11px",
                        marginLeft: "6px",
                        opacity: 0.7,
                      }}
                    >
                      (Próximamente)
                    </span>
                  )}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div
            style={{
              padding: "16px",
              borderTop: "1px solid #374151",
              fontSize: "12px",
              color: "#9ca3af",
              textAlign: "center",
            }}
          >
            Dental Scheduler v1.0
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;
