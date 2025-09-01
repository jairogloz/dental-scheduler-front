// Example usage of organizationId in components

import { useAuth } from "../contexts/AuthContext";

const ExampleComponent = () => {
  const { organizationId, user, loading } = useAuth();

  useEffect(() => {
    if (organizationId && !loading) {
      // Use organizationId for API calls
      console.log("User belongs to organization:", organizationId);

      // Example API calls with organization context
      fetchOrganizationData(organizationId);
      fetchAppointments(organizationId);
    }
  }, [organizationId, loading]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!organizationId) {
    return <div>No organization found</div>;
  }

  return (
    <div>
      <p>Organization: {organizationId}</p>
      <p>User: {user?.email}</p>
    </div>
  );
};

export default ExampleComponent;
