/*
  # Create order data storage table

  1. New Tables
    - `order_data`
      - `id` (uuid, primary key)
      - `csv_content` (text, stores the raw CSV data)
      - `order_count` (integer, number of orders in the upload)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `order_data` table
    - Add policy for public access (since we're using password-based auth in the app)
*/

CREATE TABLE IF NOT EXISTS order_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  csv_content text NOT NULL,
  order_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE order_data ENABLE ROW LEVEL SECURITY;

-- Allow public access since we handle auth in the application
CREATE POLICY "Allow public access to order data"
  ON order_data
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create an index for faster queries
CREATE INDEX IF NOT EXISTS idx_order_data_created_at ON order_data(created_at DESC);