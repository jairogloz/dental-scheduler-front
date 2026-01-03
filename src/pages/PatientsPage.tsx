import "./PatientsPage.css";

interface PatientsPageProps {
  isMobile: boolean;
}

const PatientsPage = ({ isMobile }: PatientsPageProps) => (
  <div
    className="patients-page"
    style={{ padding: isMobile ? "10px" : "20px" }}
  >
    <div className="patients-card">
      <h1>PACIENTES</h1>
    </div>
  </div>
);

export default PatientsPage;
