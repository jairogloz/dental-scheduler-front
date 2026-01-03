import { useState } from "react";
import { useWindowSize } from "./hooks/useWindowSize";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import AppointmentsPage from "./pages/AppointmentsPage";
import PatientsPage from "./pages/PatientsPage.tsx";

function App() {
  const { isMobile } = useWindowSize();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState("appointments");
  const isAppointmentsSection = activeSection === "appointments";

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
