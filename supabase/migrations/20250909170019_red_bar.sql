/*
  # Add file_name column to order_data table

  1. Changes
    - Add `file_name` column to store the original CSV filename
    - This will help track which file was uploaded and when
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_data' AND column_name = 'file_name'
  ) THEN
    ALTER TABLE order_data ADD COLUMN file_name text;
  END IF;
END $$;