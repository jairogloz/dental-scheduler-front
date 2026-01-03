import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { searchPatients, type Patient } from "../api/entities/Patient";
import "./PatientsPage.css";
import EditPatientModal from "../components/Modal/Patient/EditPatientModal";
import AddPatientModal from "../components/Modal/Patient/AddPatientModal";

interface PatientsPageProps {
  isMobile: boolean;
}

const PAGE_SIZE = 50;

const PatientsPage = ({ isMobile }: PatientsPageProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [page, setPage] = useState(1);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTerm(searchTerm.trim());
      setPage(1);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data: patients = [], isLoading } = useQuery<
    Patient[],
    Error,
    Patient[]
  >({
    queryKey: ["patients-search", debouncedTerm],
    queryFn: () => searchPatients(debouncedTerm, 200),
    enabled: debouncedTerm.length >= 2,
    staleTime: 5 * 60 * 1000,
  });

  const filteredPatients = useMemo<Patient[]>(() => {
    if (debouncedTerm.length < 2) return [];
    return patients;
  }, [debouncedTerm, patients]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPatients.length / PAGE_SIZE)
  );
  const currentPage = Math.min(page, totalPages);

  const pageItems = useMemo<Patient[]>(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredPatients.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredPatients]);
  const paginationLabel = `Página ${currentPage} de ${totalPages}`;

  const handlePatientUpdated = (_updated: Patient) => {
    queryClient.invalidateQueries({
      queryKey: ["patients-search"],
      exact: false,
    });
    setEditingPatient(null);
  };

  const handleAddPatient = () => setShowAddPatientModal(true);

  const handlePatientCreated = (patient: Patient) => {
    queryClient.invalidateQueries({
      queryKey: ["patients-search"],
      exact: false,
    });
    const suggestedName =
      patient.name ||
      `${patient.first_name || ""} ${patient.last_name || ""}`.trim();
    setSearchTerm(suggestedName);
    setShowAddPatientModal(false);
  };

  const closeEditModal = () => setEditingPatient(null);

  return (
    <div
      className="patients-page"
      style={{ padding: isMobile ? "10px" : "20px" }}
    >
      <div className="patients-header">
        <div>
          <h1 className="section-title">Pacientes</h1>
          <p className="section-subtitle">
            Busca, filtra y abre fichas administrativas
          </p>
        </div>
        <div className="patients-actions">
          <button className="patients-add-button" onClick={handleAddPatient}>
            Agregar Paciente
          </button>
          <input
            type="text"
            className="patients-search-input"
            placeholder="Buscar por nombre, correo o teléfono (mínimo 2 caracteres)"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
      </div>

      <div className="patients-list-wrapper">
        <div className="patients-table">
          <div className="patients-table-header">
            <span>Nombre completo</span>
            <span>Email</span>
            <span>Teléfono</span>
            <span>Acciones</span>
          </div>
          <div className="patients-table-body">
            {debouncedTerm.length < 2 ? (
              <div className="patients-placeholder">
                Escribe al menos dos caracteres para iniciar la búsqueda.
              </div>
            ) : isLoading ? (
              <div className="patients-placeholder">Buscando pacientes...</div>
            ) : pageItems.length === 0 ? (
              <div className="patients-placeholder">
                No se encontraron resultados.
              </div>
            ) : (
              pageItems.map((patient) => (
                <div className="patients-table-row" key={patient.id}>
                  <span>
                    {patient.name ||
                      `${patient.first_name || ""} ${
                        patient.last_name || ""
                      }`.trim()}
                  </span>
                  <span>{patient.email || "-"}</span>
                  <span>{patient.phone || "-"}</span>
                  <span className="patients-row-actions">
                    <button
                      className="ghost-button"
                      onClick={() => setEditingPatient(patient)}
                    >
                      Editar
                    </button>
                    <button className="ghost-button" disabled>
                      Historial
                    </button>
                    <button className="ghost-button" disabled>
                      Nueva cita
                    </button>
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="patients-pagination">
        <button
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          disabled={currentPage === 1 || debouncedTerm.length < 2}
        >
          Anterior
        </button>
        <span>{paginationLabel}</span>
        <button
          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages || debouncedTerm.length < 2}
        >
          Siguiente
        </button>
      </div>
      {editingPatient && (
        <EditPatientModal
          isOpen={Boolean(editingPatient)}
          patient={editingPatient}
          onClose={closeEditModal}
          onPatientUpdated={handlePatientUpdated}
        />
      )}
      {showAddPatientModal && (
        <AddPatientModal
          isOpen={showAddPatientModal}
          onClose={() => setShowAddPatientModal(false)}
          onPatientCreated={handlePatientCreated}
          initialName={searchTerm.trim()}
        />
      )}
    </div>
  );
};

export default PatientsPage;
