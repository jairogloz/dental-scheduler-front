import { useAuth } from "../contexts/AuthContext";

/**
 * Example component showing how to use organization data from AuthContext
 * This replaces individual API calls for doctors, units, clinics
 */
export const OrganizationDataExample = () => {
  const { organizationData, organizationLoading, organizationId } = useAuth();

  if (!organizationId) {
    return <div>No organization access</div>;
  }

  if (organizationLoading) {
    return <div>Loading organization data...</div>;
  }

  if (!organizationData) {
    return <div>Organization data not available</div>;
  }

  return (
    <div>
      <h3>Organization: {organizationData.organization.name}</h3>

      <h4>Doctors ({organizationData.doctors.length})</h4>
      <ul>
        {organizationData.doctors.map((doctor) => (
          <li key={doctor.id}>
            {doctor.name} - {doctor.specialty}
          </li>
        ))}
      </ul>

      <h4>Units ({organizationData.units.length})</h4>
      <ul>
        {organizationData.units.map((unit) => (
          <li key={unit.id}>{unit.name}</li>
        ))}
      </ul>

      <h4>
        Appointments This Week ({organizationData.appointments?.length || 0})
      </h4>
      <ul>
        {organizationData.appointments?.slice(0, 5).map((appointment) => (
          <li key={appointment.id}>
            {appointment.patient_name} - {appointment.doctor_name} -{" "}
            {appointment.treatment_type}
          </li>
        )) || <li>No appointments found</li>}
      </ul>
    </div>
  );
};

/**
 * Helper hooks for easy access to specific data
 */
export const useDoctors = () => {
  const { organizationData, organizationLoading } = useAuth();
  return {
    doctors: organizationData?.doctors || [],
    loading: organizationLoading,
  };
};

export const useUnits = () => {
  const { organizationData, organizationLoading } = useAuth();
  return {
    units: organizationData?.units || [],
    loading: organizationLoading,
  };
};

export const useClinics = () => {
  const { organizationData, organizationLoading } = useAuth();
  return {
    clinics: organizationData?.clinics || [],
    loading: organizationLoading,
  };
};

export const useOrganizationAppointments = () => {
  const { organizationData, organizationLoading } = useAuth();
  return {
    appointments: organizationData?.appointments || [],
    loading: organizationLoading,
  };
};
