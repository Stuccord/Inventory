/*
  # Allow All Users to View Stock Alerts

  ## Changes
  1. Update RLS policy to allow all authenticated users to view stock alerts
  2. Keep acknowledgement restricted to admins/managers

  ## Security
  - All staff can see low stock warnings to prevent ordering unavailable items
  - Only admins and managers can acknowledge/dismiss alerts
*/

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Admins and managers can view stock alerts" ON stock_alerts;

-- Create new policy allowing all authenticated users to view alerts
CREATE POLICY "All authenticated users can view stock alerts"
  ON stock_alerts
  FOR SELECT
  TO authenticated
  USING (true);

-- Keep UPDATE policy restricted to admins/managers only
DROP POLICY IF EXISTS "Admins and managers can acknowledge alerts" ON stock_alerts;

CREATE POLICY "Admins and managers can acknowledge alerts"
  ON stock_alerts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );
