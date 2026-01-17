import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { parseCSVData, type ParsedOrder } from '../utils/csvParser';

export function useOrderData(city?: 'dc' | 'atlanta') {
  const [data, setData] = useState<ParsedOrder[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (city) {
      loadData();
    } else {
      setIsLoading(false);
      setData([]);
      setLastUpdated(null);
      setFileName(null);
    }
  }, [city]);

  const loadData = async () => {
    if (!city) return;
    
    try {
      setIsLoading(true);
      setError(null);

      const { data: orderData, error: fetchError } = await supabase
        .from('order_data')
        .select('*')
        .eq('city', city)
        .order('created_at', { ascending: false })
        .limit(1);

      if (fetchError) {
        throw fetchError;
      }

      if (orderData && orderData.length > 0) {
        const csvText = orderData[0].csv_content;
        const createdAt = orderData[0].created_at;
        const fileName = orderData[0].file_name || null;
        const parsedData = parseCSVData(csvText, city);
        setData(parsedData);
        setLastUpdated(createdAt);
        setFileName(fileName);
      } else {
        // No data found for this city
        setData([]);
        setLastUpdated(null);
        setFileName(null);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError(`Failed to load data from database: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setData([]);
      setLastUpdated(null);
      setFileName(null);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadData = async (csvText: string, fileName?: string) => {
    if (!city) {
      return { success: false, error: 'No city selected' };
    }
    
    try {
      setError(null);
      
      // Parse the CSV to validate it
      const parsedData = parseCSVData(csvText, city);
      
      console.log(`Parsed ${parsedData.length} orders for city: ${city}`);
      
      // Validate that the CSV contains data for the selected city
      const expectedSource = `Ebony Fit Weekend - ${city === 'dc' ? 'DC' : 'Atlanta'}`;
      const hasValidData = parsedData.some(order => order.sourceName === expectedSource);
      
      console.log(`Expected source: "${expectedSource}"`);
      console.log(`Has valid data: ${hasValidData}`);
      console.log('Unique sources in data:', [...new Set(parsedData.map(o => o.sourceName))]);
      
      if (!hasValidData) {
        throw new Error(`No data found for ${city.toUpperCase()} in this CSV file. Please check that you've uploaded the correct file.`);
      }
      
      // Delete existing data for this city before inserting new data
      const { error: deleteError } = await supabase
        .from('order_data')
        .delete()
        .eq('city', city);

      if (deleteError) {
        console.warn('Warning: Could not delete existing data:', deleteError);
        // Continue anyway - this might be the first upload
      }

      // Save to database
      const { error: insertError } = await supabase
        .from('order_data')
        .insert({
          csv_content: csvText,
          order_count: parsedData.length,
          file_name: fileName || null,
          city: city
        });

      if (insertError) {
        throw insertError;
      }

      // Update local state
      setData(parsedData);
      setLastUpdated(new Date().toISOString());
      setFileName(fileName || null);
      
      return { success: true };
    } catch (err) {
      console.error('Error uploading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload data');
      return { success: false, error: err instanceof Error ? err.message : 'Failed to upload data' };
    }
  };

  return {
    data,
    lastUpdated,
    fileName,
    isLoading,
    error,
    uploadData,
    reloadData: loadData
  };
}