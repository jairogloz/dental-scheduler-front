import { useState, useEffect } from "react";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  activeSection: string;
  onSectionChange: (section: string) => void;
  isMobile?: boolean;
}

interface NavSubItem {
  id: string;
  label: string;
  icon: string;
  disabled?: boolean;
}

interface NavItem {
  id: string;
  label: string;
  icon: string;
  disabled?: boolean;
  subItems?: NavSubItem[];
}

const navItems: NavItem[] = [
  { id: "appointments", label: "Citas", icon: "📅" },
  { id: "patients", label: "Pacientes", icon: "👥" },
  {
    id: "pending",
    label: "Pendientes",
    icon: "⏰",
    subItems: [
      { id: "rescheduling-queue", label: "Cola de Reagendado", icon: "🔄" },
    ],
  },
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
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );

  // Auto-expand parent sections when child subsection is active
  useEffect(() => {
    navItems.forEach((item) => {
      if (item.subItems) {
        const hasActiveSubItem = item.subItems.some(
          (subItem) => subItem.id === activeSection
        );
        if (hasActiveSubItem) {
          setExpandedSections((prev) => new Set([...prev, item.id]));
        }
      }
    });
  }, [activeSection]);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleItemClick = (item: NavItem) => {
    if (item.disabled) return;

    if (item.subItems) {
      toggleSection(item.id);
    } else {
      onSectionChange(item.id);
    }
  };

  const handleSubItemClick = (subItem: NavSubItem) => {
    if (subItem.disabled) return;
    onSectionChange(subItem.id);
  };
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
          {navItems.map((item) => {
            const isExpanded = expandedSections.has(item.id);
            const hasActiveSubItem = item.subItems?.some(
              (subItem) => subItem.id === activeSection
            );
            const isItemActive = activeSection === item.id || hasActiveSubItem;

            return (
              <div key={item.id}>
                {/* Main navigation item */}
                <button
                  onClick={() => handleItemClick(item)}
                  disabled={item.disabled}
                  style={{
                    width: "calc(100% - 16px)",
                    padding: isCollapsed ? "10px 0" : "10px 12px",
                    backgroundColor: isItemActive ? "#374151" : "transparent",
                    border: "none",
                    color: item.disabled ? "#6b7280" : "#f9fafb",
                    cursor: item.disabled ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: isCollapsed ? "0" : "10px",
                    fontSize: "14px",
                    fontWeight: isItemActive ? "500" : "400",
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
                    if (!item.disabled && !isItemActive) {
                      e.currentTarget.style.backgroundColor = "#4b5563";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!item.disabled && !isItemActive) {
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
                    <>
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
                      {item.subItems && (
                        <span
                          style={{
                            fontSize: "12px",
                            color: "#9ca3af",
                            transform: isExpanded
                              ? "rotate(90deg)"
                              : "rotate(0deg)",
                            transition: "transform 0.2s ease",
                          }}
                        >
                          ▶
                        </span>
                      )}
                    </>
                  )}
                </button>

                {/* Sub-items */}
                {!isCollapsed && item.subItems && isExpanded && (
                  <div style={{ marginLeft: "8px", marginTop: "2px" }}>
                    {item.subItems.map((subItem) => (
                      <button
                        key={subItem.id}
                        onClick={() => handleSubItemClick(subItem)}
                        disabled={subItem.disabled}
                        style={{
                          width: "calc(100% - 16px)",
                          padding: "8px 12px 8px 32px",
                          backgroundColor:
                            activeSection === subItem.id
                              ? "#4b5563"
                              : "transparent",
                          border: "none",
                          color: subItem.disabled ? "#6b7280" : "#e5e7eb",
                          cursor: subItem.disabled ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "13px",
                          fontWeight:
                            activeSection === subItem.id ? "500" : "400",
                          transition: "background-color 0.2s, color 0.2s",
                          textAlign: "left",
                          justifyContent: "flex-start",
                          margin: "1px 8px",
                          borderRadius: "4px",
                          opacity: subItem.disabled ? 0.5 : 1,
                          boxSizing: "border-box",
                          overflow: "hidden",
                          minHeight: "32px",
                        }}
                        onMouseEnter={(e) => {
                          if (
                            !subItem.disabled &&
                            activeSection !== subItem.id
                          ) {
                            e.currentTarget.style.backgroundColor = "#374151";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (
                            !subItem.disabled &&
                            activeSection !== subItem.id
                          ) {
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                          }
                        }}
                      >
                        <span
                          style={{
                            fontSize: "14px",
                            width: "16px",
                            height: "16px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            lineHeight: 1,
                          }}
                        >
                          {subItem.icon}
                        </span>
                        <span
                          style={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            flex: 1,
                          }}
                        >
                          {subItem.label}
                          {subItem.disabled && (
                            <span
                              style={{
                                fontSize: "10px",
                                marginLeft: "6px",
                                opacity: 0.7,
                              }}
                            >
                              (Próximamente)
                            </span>
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
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
