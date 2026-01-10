import React, { useState, useEffect, useMemo } from "react";
import {
  useReschedulingQueueQuery,
  useCancelFromQueue,
  useRescheduleFromQueue,
  useSnoozeFromQueue,
} from "../hooks/queries/useReschedulingQueueQuery";
import { useOrganizationQuery } from "../hooks/queries/useOrganizationQuery";
import AppointmentModal from "../components/Modal/Appointment/AppointmentModal";
import { SnoozeModal } from "../components/Modal/SnoozeModal";
import type { ReschedulingQueueItem } from "../api/entities/Appointment";

interface ReschedulingQueuePageProps {
  isMobile?: boolean;
}

const ReschedulingQueuePage: React.FC<ReschedulingQueuePageProps> = ({
  isMobile = false,
}) => {
  const [page, setPage] = useState(1);
  const [clinicFilter, setClinicFilter] = useState<string>("");
  const [doctorFilter, setDoctorFilter] = useState<string>("");
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [sortFilter, setSortFilter] = useState<"oldest" | "newest">("oldest");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  // Modal states for actions
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showSnoozeModal, setShowSnoozeModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<ReschedulingQueueItem | null>(null);

  // Cancel form state
  const [cancelReason, setCancelReason] = useState("");

  // Appointment form for the reschedule modal
  const [appointmentForm, setAppointmentForm] = useState<any>(null);

  // Get organization data for filter options
  const { data: organizationData, isLoading: isLoadingOrg } =
    useOrganizationQuery();

  // Mutation hooks for actions
  const cancelMutation = useCancelFromQueue();
  const rescheduleMutation = useRescheduleFromQueue();
  const snoozeMutation = useSnoozeFromQueue();

  // Extract data for AppointmentModal props
  const doctors = organizationData?.doctors || [];
  const clinics = organizationData?.clinics || [];
  const units = organizationData?.units || [];
  const services = organizationData?.services || [];

  // Helper function to format time periods more granularly
  const formatTimePending = (movedToQueueAt: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - movedToQueueAt.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) {
      return "< 1h";
    } else if (diffHours < 24) {
      return `${diffHours}h`;
    } else if (diffDays === 1) {
      return "1 día";
    } else {
      return `${diffDays} días`;
    }
  };

  // Helper function to find service_id from service_name
  const findServiceIdByName = (serviceName: string): string => {
    const service = services.find((s) => s.name === serviceName);
    return service?.id || "";
  };

  // Debounce search input to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchFilter);
      setPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchFilter]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [clinicFilter, doctorFilter]);

  // Prepare filter options
  const clinicOptions = useMemo(() => {
    if (!organizationData?.clinics) return [];
    return organizationData.clinics.map((clinic) => ({
      value: clinic.id,
      label: clinic.name,
    }));
  }, [organizationData?.clinics]);

  const doctorOptions = useMemo(() => {
    if (!organizationData?.doctors || !organizationData?.units) return [];
    return organizationData.doctors
      .filter((doctor) => {
        if (!clinicFilter) return true;
        const doctorUnit = organizationData.units.find(
          (unit) => unit.id === doctor.default_unit_id
        );
        return doctorUnit?.clinic_id === clinicFilter;
      })
      .map((doctor) => ({
        value: doctor.id,
        label: doctor.name,
      }));
  }, [organizationData?.doctors, organizationData?.units, clinicFilter]);

  const {
    data: queueData,
    isLoading,
    error,
  } = useReschedulingQueueQuery({
    page,
    limit: 20,
    clinic_id: clinicFilter || undefined,
    doctor_id: doctorFilter || undefined,
    search: debouncedSearch || undefined,
    sort: sortFilter,
  });

  // Action handlers
  const handleCancelClick = (item: ReschedulingQueueItem) => {
    setSelectedAppointment(item);
    setCancelReason("");
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedAppointment || !cancelReason.trim()) return;

    try {
      await cancelMutation.mutateAsync({
        appointmentId: selectedAppointment.id,
        reason: cancelReason,
      });
      setShowCancelModal(false);
      setSelectedAppointment(null);
      setCancelReason("");
      alert("Cita cancelada exitosamente");
    } catch (error) {
      console.error("Error canceling appointment:", error);
      alert(
        "Error al cancelar la cita: " +
          (error instanceof Error ? error.message : "Error desconocido")
      );
    }
  };

  const handleRescheduleClick = (item: ReschedulingQueueItem) => {
    setSelectedAppointment(item);

    // Pre-populate the appointment form with existing data (except times)
    const now = new Date();
    setAppointmentForm({
      appointmentId: item.id, // Keep reference to original appointment
      patientId: item.patient?.id || "",
      patient_name: item.patient
        ? `${item.patient.first_name} ${item.patient.last_name || ""}`.trim()
        : "Paciente no disponible",
      doctorId: item.doctor_id,
      unitId: item.unit_id || "",
      resourceId: item.unit_id || "", // AppointmentModal uses resourceId for unit
      serviceId: findServiceIdByName(item.service_name),
      serviceName: item.service_name,
      notes: item.notes,
      status: "scheduled", // New appointment will be scheduled
      // Times left empty for user to select
      start: now,
      end: new Date(now.getTime() + 60 * 60 * 1000), // Default 1 hour
    });

    setShowRescheduleModal(true);
  };

  const handleSnoozeClick = (item: ReschedulingQueueItem) => {
    setSelectedAppointment(item);
    setShowSnoozeModal(true);
  };

  const handleSnoozeSubmit = async (number: number, time_unit: string) => {
    if (!selectedAppointment) return;

    try {
      await snoozeMutation.mutateAsync({
        appointmentId: selectedAppointment.id,
        number,
        time_unit: time_unit as "days" | "weeks" | "months",
      });

      alert(`Cita pospuesta por ${number} ${time_unit}`);
      handleCloseModals();
    } catch (error) {
      console.error("Error snoozing appointment:", error);
      alert(
        "Error al posponer la cita: " +
          (error instanceof Error ? error.message : "Error desconocido")
      );
    }
  };

  const handleCloseModals = () => {
    setShowCancelModal(false);
    setShowRescheduleModal(false);
    setShowSnoozeModal(false);
    setSelectedAppointment(null);
    setCancelReason("");
    setAppointmentForm(null);
  };

  const handleRescheduleSubmit = async (formData: any) => {
    if (!selectedAppointment) return;

    // Convert Date to local time string with Z suffix (same format as appointment creation)
    const toLocalTimeWithZ = (date: Date): string => {
      const pad = (num: number) => String(num).padStart(2, "0");
      return (
        date.getFullYear() +
        "-" +
        pad(date.getMonth() + 1) +
        "-" +
        pad(date.getDate()) +
        "T" +
        pad(date.getHours()) +
        ":" +
        pad(date.getMinutes()) +
        ":" +
        pad(date.getSeconds()) +
        "Z"
      );
    };

    try {
      // Convert to the format expected by the reschedule API
      const rescheduleData = {
        doctor_id: formData.doctorId,
        unit_id: formData.resourceId || formData.unitId,
        start_time: toLocalTimeWithZ(formData.start),
        end_time: toLocalTimeWithZ(formData.end),
        service_id: formData.serviceId,
        notes: formData.notes || undefined,
      };

      await rescheduleMutation.mutateAsync({
        appointmentId: selectedAppointment.id,
        rescheduleData,
      });

      alert("Cita reagendada exitosamente");
      handleCloseModals();
    } catch (error) {
      console.error("Error rescheduling appointment:", error);
      alert(
        "Error al reagendar la cita: " +
          (error instanceof Error ? error.message : "Error desconocido")
      );
    }
  };

  return (
    <div style={{ padding: isMobile ? "10px" : "20px" }}>
      {/* Header */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "20px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h1
          style={{
            margin: "0 0 10px 0",
            fontSize: "24px",
            color: "#333",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          ⏰ Cola de Reagendado
        </h1>
        <p
          style={{
            margin: 0,
            color: "#666",
            fontSize: "14px",
          }}
        >
          Gestione las citas que necesitan ser reagendadas
        </p>

        {queueData && (
          <div
            style={{
              marginTop: "15px",
              padding: "10px",
              backgroundColor: "#f8fafc",
              borderRadius: "6px",
              fontSize: "14px",
              color: "#374151",
            }}
          >
            <strong>{queueData.total}</strong> citas en cola • Página{" "}
            {queueData.page} de {queueData.total_pages}
          </div>
        )}
      </div>

      {/* Filters Section */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "20px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "15px",
          }}
        >
          <h3
            style={{
              margin: "0",
              fontSize: "16px",
              color: "#333",
            }}
          >
            Filtros
            {(searchFilter ||
              clinicFilter ||
              doctorFilter ||
              sortFilter !== "oldest") && (
              <span
                style={{
                  fontSize: "12px",
                  color: "#3b82f6",
                  marginLeft: "8px",
                  backgroundColor: "#eff6ff",
                  padding: "2px 6px",
                  borderRadius: "4px",
                }}
              >
                Activos
              </span>
            )}
          </h3>

          {(searchFilter ||
            clinicFilter ||
            doctorFilter ||
            sortFilter !== "oldest") && (
            <button
              type="button"
              onClick={() => {
                setSearchFilter("");
                setClinicFilter("");
                setDoctorFilter("");
                setSortFilter("oldest");
              }}
              style={{
                padding: "4px 8px",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                backgroundColor: "white",
                color: "#6b7280",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              Limpiar filtros
            </button>
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "1fr"
              : window.innerWidth < 1200
              ? "1fr 1fr"
              : "1.8fr 1fr 1fr 1fr",
            gap: "32px",
            gridRowGap: "20px",
          }}
        >
          {/* Patient Search */}
          <div style={{ boxSizing: "border-box" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontSize: "14px",
                fontWeight: "500",
                color: "#374151",
              }}
            >
              Buscar paciente
              {searchFilter !== debouncedSearch && (
                <span
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    marginLeft: "5px",
                  }}
                >
                  🔍 Buscando...
                </span>
              )}
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Nombre, teléfono, email..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  paddingRight: searchFilter ? "35px" : "12px",
                  border: `1px solid ${
                    searchFilter !== debouncedSearch ? "#3b82f6" : "#d1d5db"
                  }`,
                  borderRadius: "6px",
                  fontSize: "14px",
                  transition: "border-color 0.2s ease",
                }}
              />
              {searchFilter && (
                <button
                  type="button"
                  onClick={() => setSearchFilter("")}
                  style={{
                    position: "absolute",
                    right: "8px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#6b7280",
                    cursor: "pointer",
                    fontSize: "14px",
                    padding: "2px",
                    zIndex: 1,
                  }}
                  title="Limpiar búsqueda"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Clinic Filter */}
          <div style={{ boxSizing: "border-box" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontSize: "14px",
                fontWeight: "500",
                color: "#374151",
              }}
            >
              Clínica
            </label>
            <select
              value={clinicFilter}
              onChange={(e) => {
                setClinicFilter(e.target.value);
                // Clear doctor filter if clinic changes
                if (doctorFilter && e.target.value) {
                  const selectedDoctor = organizationData?.doctors?.find(
                    (d) => d.id === doctorFilter
                  );
                  if (selectedDoctor && organizationData?.units) {
                    const doctorUnit = organizationData.units.find(
                      (unit) => unit.id === selectedDoctor.default_unit_id
                    );
                    if (doctorUnit && doctorUnit.clinic_id !== e.target.value) {
                      setDoctorFilter("");
                    }
                  }
                }
              }}
              disabled={isLoadingOrg || !organizationData?.clinics?.length}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                backgroundColor: "white",
                opacity: isLoadingOrg ? 0.6 : 1,
              }}
            >
              <option value="">
                {isLoadingOrg ? "Cargando..." : "Todas las clínicas"}
              </option>
              {clinicOptions.map((clinic) => (
                <option key={clinic.value} value={clinic.value}>
                  {clinic.label}
                </option>
              ))}
            </select>
          </div>

          {/* Doctor Filter */}
          <div style={{ boxSizing: "border-box" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontSize: "14px",
                fontWeight: "500",
                color: "#374151",
              }}
            >
              Doctor
            </label>
            <select
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              disabled={isLoadingOrg || !organizationData?.doctors?.length}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                backgroundColor: "white",
                opacity: isLoadingOrg ? 0.6 : 1,
              }}
            >
              <option value="">
                {isLoadingOrg ? "Cargando..." : "Todos los doctores"}
              </option>
              {doctorOptions.map((doctor) => (
                <option key={doctor.value} value={doctor.value}>
                  {doctor.label}
                </option>
              ))}
            </select>
            {clinicFilter && doctorOptions.length === 0 && !isLoadingOrg && (
              <div
                style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}
              >
                No hay doctores en esta clínica
              </div>
            )}
          </div>

          {/* Sort Filter */}
          <div style={{ boxSizing: "border-box" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontSize: "14px",
                fontWeight: "500",
                color: "#374151",
              }}
            >
              Ordenar por
            </label>
            <select
              value={sortFilter}
              onChange={(e) =>
                setSortFilter(e.target.value as "oldest" | "newest")
              }
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                backgroundColor: "white",
              }}
            >
              <option value="oldest">Más antiguos primero</option>
              <option value="newest">Más recientes primero</option>
            </select>
          </div>
        </div>
      </div>

      {/* Queue Content */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "20px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          minHeight: "400px",
        }}
      >
        {isLoading && (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "#666",
            }}
          >
            <div style={{ fontSize: "24px", marginBottom: "10px" }}>⏳</div>
            <p>Cargando cola de reagendado...</p>
          </div>
        )}

        {error && (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "#dc2626",
            }}
          >
            <div style={{ fontSize: "24px", marginBottom: "10px" }}>❌</div>
            <p>Error al cargar la cola de reagendado</p>
            <p style={{ fontSize: "14px", color: "#6b7280" }}>
              {error.message}
            </p>
          </div>
        )}

        {queueData && queueData.items.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "#6b7280",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "15px" }}>🎉</div>
            <h3 style={{ margin: "0 0 10px 0", color: "#374151" }}>
              ¡Cola vacía!
            </h3>
            <p>No hay citas pendientes de reagendar en este momento.</p>
          </div>
        )}

        {queueData && queueData.items.length > 0 && (
          <div>
            <h3
              style={{
                margin: "0 0 20px 0",
                fontSize: "16px",
                color: "#333",
              }}
            >
              Citas pendientes de reagendar ({queueData.items.length})
            </h3>

            {/* TODO: Replace with proper QueueList component */}
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                overflow: "hidden",
              }}
            >
              {/* Table Headers */}
              {!isMobile && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "minmax(200px, 2fr) minmax(120px, 1fr) minmax(120px, 1fr) minmax(100px, 1fr) minmax(240px, auto)",
                    gap: "15px",
                    alignItems: "center",
                    padding: "15px",
                    backgroundColor: "#f8fafc",
                    borderBottom: "1px solid #e5e7eb",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#374151",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    boxSizing: "border-box",
                  }}
                >
                  <div>Paciente</div>
                  <div>Fecha Original</div>
                  <div>Doctor</div>
                  <div>Pendiente por</div>
                  <div style={{ textAlign: "center" }}>Acciones</div>
                </div>
              )}

              {queueData.items.map((item, index) => (
                <div
                  key={item.id}
                  style={{
                    padding: "15px",
                    borderBottom:
                      index < queueData.items.length - 1
                        ? "1px solid #f3f4f6"
                        : "none",
                    display: "grid",
                    gridTemplateColumns: isMobile
                      ? "1fr"
                      : "minmax(200px, 2fr) minmax(120px, 1fr) minmax(120px, 1fr) minmax(100px, 1fr) minmax(240px, auto)",
                    gap: "15px",
                    alignItems: "center",
                    boxSizing: "border-box",
                  }}
                >
                  <div>
                    <strong style={{ color: "#374151" }}>
                      {item.patient
                        ? `${item.patient.first_name} ${
                            item.patient.last_name || ""
                          }`.trim()
                        : "Paciente no disponible"}
                    </strong>
                    <div style={{ fontSize: "14px", color: "#6b7280" }}>
                      {item.patient?.phone || "Sin teléfono"}
                    </div>
                  </div>

                  <div style={{ fontSize: "14px", color: "#6b7280" }}>
                    {item.original_start.toLocaleDateString()}
                    <br />
                    {item.original_start.toLocaleTimeString()}
                  </div>

                  <div style={{ fontSize: "14px", color: "#6b7280" }}>
                    {item.doctor_name}
                  </div>

                  <div style={{ fontSize: "14px", color: "#6b7280" }}>
                    {formatTimePending(item.moved_to_needs_rescheduling_at)}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      justifyContent: "center",
                      flexWrap: "wrap",
                      minWidth: "240px",
                    }}
                  >
                    <button
                      onClick={() => handleRescheduleClick(item)}
                      disabled={rescheduleMutation.isPending}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#3b82f6",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        fontSize: "12px",
                        cursor: "pointer",
                        opacity: rescheduleMutation.isPending ? 0.5 : 1,
                      }}
                    >
                      Reagendar
                    </button>
                    <button
                      onClick={() => handleSnoozeClick(item)}
                      disabled={snoozeMutation.isPending}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#f59e0b",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        fontSize: "12px",
                        cursor: "pointer",
                        opacity: snoozeMutation.isPending ? 0.5 : 1,
                      }}
                    >
                      Posponer
                    </button>
                    <button
                      onClick={() => handleCancelClick(item)}
                      disabled={cancelMutation.isPending}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#6b7280",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        fontSize: "12px",
                        cursor: "pointer",
                        opacity: cancelMutation.isPending ? 0.5 : 1,
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {queueData.total_pages > 1 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "10px",
                  marginTop: "20px",
                }}
              >
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  style={{
                    padding: "8px 16px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    backgroundColor: page === 1 ? "#f9fafb" : "white",
                    color: page === 1 ? "#9ca3af" : "#374151",
                    cursor: page === 1 ? "not-allowed" : "pointer",
                  }}
                >
                  Anterior
                </button>

                <span
                  style={{
                    padding: "8px 16px",
                    fontSize: "14px",
                    color: "#6b7280",
                  }}
                >
                  {page} de {queueData.total_pages}
                </span>

                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === queueData.total_pages}
                  style={{
                    padding: "8px 16px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    backgroundColor:
                      page === queueData.total_pages ? "#f9fafb" : "white",
                    color:
                      page === queueData.total_pages ? "#9ca3af" : "#374151",
                    cursor:
                      page === queueData.total_pages
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      {showCancelModal && selectedAppointment && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={handleCloseModals}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              padding: "24px",
              minWidth: "400px",
              maxWidth: "500px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: "0 0 16px 0", color: "#374151" }}>
              Cancelar Cita
            </h2>
            <div style={{ marginBottom: "16px", color: "#6b7280" }}>
              <strong>Paciente:</strong>{" "}
              {selectedAppointment.patient
                ? `${selectedAppointment.patient.first_name} ${
                    selectedAppointment.patient.last_name || ""
                  }`.trim()
                : "Paciente no disponible"}
              <br />
              <strong>Fecha:</strong>{" "}
              {selectedAppointment.original_start.toLocaleDateString()}{" "}
              {selectedAppointment.original_start.toLocaleTimeString()}
              <br />
              <strong>Doctor:</strong> {selectedAppointment.doctor_name}
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label
                htmlFor="cancelReason"
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "500",
                  color: "#374151",
                }}
              >
                Razón de cancelación *
              </label>
              <select
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
                required
              >
                <option value="">Seleccionar razón...</option>
                <option value="patient_request">Solicitud del paciente</option>
                <option value="doctor_unavailable">Doctor no disponible</option>
                <option value="clinic_closed">Clínica cerrada</option>
                <option value="emergency">Emergencia</option>
                <option value="no_show">Paciente no se presentó</option>
                <option value="other">Otro</option>
              </select>
            </div>

            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={handleCloseModals}
                style={{
                  padding: "8px 16px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  backgroundColor: "white",
                  color: "#374151",
                  cursor: "pointer",
                }}
              >
                Atrás
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={!cancelReason.trim() || cancelMutation.isPending}
                style={{
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: "4px",
                  backgroundColor:
                    !cancelReason.trim() || cancelMutation.isPending
                      ? "#9ca3af"
                      : "#dc2626",
                  color: "white",
                  cursor:
                    !cancelReason.trim() || cancelMutation.isPending
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {cancelMutation.isPending
                  ? "Cancelando..."
                  : "Confirmar Cancelación"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && appointmentForm && (
        <AppointmentModal
          showModal={showRescheduleModal}
          mode="reschedule"
          appointmentForm={appointmentForm}
          doctors={doctors}
          clinics={clinics}
          units={units}
          services={services}
          handleCloseModal={handleCloseModals}
          handleAddAppointment={handleRescheduleSubmit}
          setAppointmentForm={setAppointmentForm}
          appointments={[]} // Empty array since we don't need conflict checking here
        />
      )}

      {/* Snooze Modal */}
      <SnoozeModal
        isOpen={showSnoozeModal}
        onClose={handleCloseModals}
        onSubmit={handleSnoozeSubmit}
        appointmentTitle={
          selectedAppointment
            ? `${selectedAppointment.patient?.first_name || ""} ${
                selectedAppointment.patient?.last_name || ""
              } - ${selectedAppointment.service_name}`.trim()
            : undefined
        }
        isLoading={snoozeMutation.isPending}
      />
    </div>
  );
};

export default ReschedulingQueuePage;
