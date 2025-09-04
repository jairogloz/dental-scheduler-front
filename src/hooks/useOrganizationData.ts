import { useState, useEffect } from 'react';
import { getOrganizationData, type OrganizationData, type GetOrganizationDataParams } from '../api/entities/Organization';

export const useOrganizationData = (params: GetOrganizationDataParams = {}) => {
  const [data, setData] = useState<OrganizationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const organizationData = await getOrganizationData(params);
      setData(organizationData);
      console.log('✅ Organization data loaded successfully:', organizationData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch organization data';
      setError(errorMessage);
      console.error('❌ Failed to fetch organization data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [JSON.stringify(params)]); // Re-fetch when params change

  return { data, loading, error, refetch: fetchData };
};
