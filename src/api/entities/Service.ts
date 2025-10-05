/**
 * Service entity representing dental services offered by the organization
 */

export type Service = {
  id: string;
  name: string;
  base_price?: number;
};

export type ServiceResponse = {
  id: string;
  name: string;
  base_price?: number;
};
