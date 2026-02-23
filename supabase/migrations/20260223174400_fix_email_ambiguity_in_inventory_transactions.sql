/*
  # Fix Email Ambiguity Error in Inventory Transactions

  ## Issue
  When inserting into inventory_transactions via trigger, the RLS policy checks
  `created_by = auth.uid()`. Due to the foreign key relationship with user_profiles,
  both inventory_transactions and user_profiles have context, and if any query
  references "email" without a table qualifier, PostgreSQL throws an ambiguity error.

  ## Changes
  1. Modify INSERT policy to use explicit table qualification
  2. Ensure the policy works correctly with SECURITY DEFINER functions

  ## Security
  - Maintains existing security model
  - Only allows users to create transactions with their own user_id
*/

-- Drop and recreate the INSERT policy with better structure
DROP POLICY IF EXISTS "All authenticated users can create transactions" ON inventory_transactions;

CREATE POLICY "All authenticated users can create transactions"
  ON inventory_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    inventory_transactions.created_by = auth.uid()
  );
