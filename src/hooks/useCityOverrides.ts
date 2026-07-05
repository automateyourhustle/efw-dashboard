import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { City } from '../types/auth';
import type { CityOverride, CityOverrideInput } from '../types/overrides';

function mapRow(row: {
  city: string;
  override_total_revenue: number | null;
  override_last_updated: string | null;
  updated_at: string;
}): CityOverride {
  return {
    city: row.city as City,
    overrideTotalRevenue: row.override_total_revenue,
    overrideLastUpdated: row.override_last_updated,
    updatedAt: row.updated_at
  };
}

export function useCityOverrides(city?: City) {
  const [overrides, setOverrides] = useState<CityOverride | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOverrides = useCallback(async () => {
    if (!city) {
      setOverrides(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('city_overrides')
        .select('*')
        .eq('city', city)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      setOverrides(data ? mapRow(data) : null);
    } catch (err) {
      console.error('Error loading city overrides:', err);
      setError(err instanceof Error ? err.message : 'Failed to load overrides');
      setOverrides(null);
    } finally {
      setIsLoading(false);
    }
  }, [city]);

  useEffect(() => {
    loadOverrides();
  }, [loadOverrides]);

  const saveOverrides = async (input: CityOverrideInput) => {
    if (!city) {
      return { success: false, error: 'No city selected' };
    }

    try {
      setError(null);

      const hasRevenueOverride = input.overrideTotalRevenue != null;
      const hasDateOverride = input.overrideLastUpdated != null;

      if (!hasRevenueOverride && !hasDateOverride) {
        const { error: deleteError } = await supabase
          .from('city_overrides')
          .delete()
          .eq('city', city);

        if (deleteError) {
          throw deleteError;
        }

        setOverrides(null);
        return { success: true };
      }

      const { data, error: upsertError } = await supabase
        .from('city_overrides')
        .upsert({
          city,
          override_total_revenue: input.overrideTotalRevenue,
          override_last_updated: input.overrideLastUpdated,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (upsertError) {
        throw upsertError;
      }

      setOverrides(mapRow(data));
      return { success: true };
    } catch (err) {
      console.error('Error saving city overrides:', err);
      const message = err instanceof Error ? err.message : 'Failed to save overrides';
      setError(message);
      return { success: false, error: message };
    }
  };

  const clearOverrides = async () => {
    return saveOverrides({
      overrideTotalRevenue: null,
      overrideLastUpdated: null
    });
  };

  return {
    overrides,
    isLoading,
    error,
    saveOverrides,
    clearOverrides,
    reloadOverrides: loadOverrides
  };
}
