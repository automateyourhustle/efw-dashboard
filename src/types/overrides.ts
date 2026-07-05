import type { City } from './auth';

export interface CityOverride {
  city: City;
  overrideTotalRevenue: number | null;
  overrideLastUpdated: string | null;
  updatedAt: string;
}

export interface CityOverrideInput {
  overrideTotalRevenue: number | null;
  overrideLastUpdated: string | null;
}
