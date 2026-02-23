/*
  # Fix Stock Tally Delete Policy

  1. Changes
    - Add DELETE policy for stock_tally table to allow admins and managers to delete tallies
  
  2. Security
    - Only admins and managers can delete stock tallies
    - Maintains existing security model
*/

CREATE POLICY "Admins and managers can delete tallies"
  ON stock_tally
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'manager')
    )
  );
