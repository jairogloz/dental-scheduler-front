import { useState, useEffect } from "react";
import { useWindowSize } from "./hooks/useWindowSize";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import AppointmentsPage from "./pages/AppointmentsPage";
import PatientsPage from "./pages/PatientsPage.tsx";
import ReschedulingQueuePage from "./pages/ReschedulingQueuePage";

function App() {
  const { isMobile } = useWindowSize();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Initialize activeSection from localStorage, fallback to "appointments"
  const [activeSection, setActiveSection] = useState(() => {
    const saved = localStorage.getItem("activeSection");
    return saved || "appointments";
  });
  
  const isAppointmentsSection = activeSection === "appointments";

  // Save activeSection to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("activeSection", activeSection);
  }, [activeSection]);

  return (
    <>
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        isMobile={isMobile}
      />

      <div
        style={{
          marginLeft: isMobile ? "0" : sidebarCollapsed ? "60px" : "240px",
          transition: "margin-left 0.3s ease",
          minHeight: "100vh",
          backgroundColor: "#f8fafc",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Header />

        <div style={{ width: "100%" }}>
          {isAppointmentsSection ? (
            <AppointmentsPage isMobile={isMobile} />
          ) : activeSection === "patients" ? (
            <PatientsPage isMobile={isMobile} />
          ) : activeSection === "rescheduling-queue" ? (
            <ReschedulingQueuePage isMobile={isMobile} />
          ) : (
            <div style={{ padding: isMobile ? "10px" : "20px" }}>
              <div
                style={{
                  textAlign: "center",
                  padding: "60px 20px",
                  backgroundColor: "white",
                  borderRadius: "8px",
                  minHeight: "400px",
                }}
              >
                <h1 style={{ margin: 0 }}>Próximamente</h1>
                <p>Esta sección estará disponible pronto.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
