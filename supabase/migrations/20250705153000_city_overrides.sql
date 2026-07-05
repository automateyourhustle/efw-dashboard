/*
  # City overrides for admin-adjusted financials and upload dates

  1. New Tables
    - `city_overrides`
      - `city` (text, primary key)
      - `override_total_revenue` (numeric, nullable)
      - `override_last_updated` (timestamptz, nullable)
      - `updated_at` (timestamptz)

  2. Security
    - Public RLS (auth handled in app, same as order_data)
*/

CREATE TABLE IF NOT EXISTS city_overrides (
  city text PRIMARY KEY,
  override_total_revenue numeric,
  override_last_updated timestamptz,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE city_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to city overrides"
  ON city_overrides
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);
