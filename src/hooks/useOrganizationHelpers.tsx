// This file provides backward compatibility for old organization helpers
// New code should use the query hooks directly from ./queries/useOrganizationQuery

export {
  useDoctors,
  useClinics,
  useUnits,
  useOrganizationInfo,
  useOrganizationQuery,
} from "./queries/useOrganizationQuery";

// Keep OrganizationDataExample for backward compatibility but update it
import { useOrganizationQuery } from "./queries/useOrganizationQuery";
import { useAuth } from "../contexts/AuthContext";

export const OrganizationDataExample = () => {
  const { organizationId } = useAuth();
  const { data: organizationData, isLoading: organizationLoading } =
    useOrganizationQuery();

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
          <li key={unit.id}>
            {unit.name} (Clinic: {unit.clinic_id})
          </li>
        ))}
      </ul>

      <h4>Clinics ({organizationData.clinics.length})</h4>
      <ul>
        {organizationData.clinics.map((clinic) => (
          <li key={clinic.id}>{clinic.name}</li>
        ))}
      </ul>
    </div>
  );
};
