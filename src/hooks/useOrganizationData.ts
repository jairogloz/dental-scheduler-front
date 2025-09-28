import { useState, useEffect } from 'react';
import { getOrganizationData, type OrganizationData, type GetOrganizationDataParams } from '../api/entities/Organization';
import { useAuth } from '../contexts/AuthContext';

export const useOrganizationData = (params: GetOrganizationDataParams = {}) => {
  const [data, setData] = useState<OrganizationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!session?.access_token) {
        throw new Error("No access token available");
      }
      
      const organizationData = await getOrganizationData(params, session.access_token);
      setData(organizationData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch organization data';
      setError(errorMessage);
      console.error('❌ Failed to fetch organization data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.access_token) {
      fetchData();
    }
  }, [JSON.stringify(params), session?.access_token]); // Re-fetch when params or session change

  return { data, loading, error, refetch: fetchData };
};
