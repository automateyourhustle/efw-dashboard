/*
  # Add city column to order_data table

  1. Changes
    - Add `city` column to `order_data` table to support multi-city data storage
    - Set default value to 'dc' for existing records
    - Add index for better query performance

  2. Security
    - No changes to existing RLS policies needed
*/

-- Add city column to order_data table
ALTER TABLE order_data ADD COLUMN IF NOT EXISTS city text DEFAULT 'dc';

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_order_data_city ON order_data (city);

-- Update existing records to have 'dc' as default city if they don't have one
UPDATE order_data SET city = 'dc' WHERE city IS NULL;