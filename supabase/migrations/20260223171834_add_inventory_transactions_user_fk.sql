/*
  # Add Foreign Key for Inventory Transactions User

  1. Changes
    - Add foreign key constraint from inventory_transactions.created_by to user_profiles.id
    - This enables Supabase to join user_profiles when querying inventory_transactions
  
  2. Security
    - No changes to RLS policies
    - Maintains referential integrity
*/

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'inventory_transactions_created_by_fkey'
    AND table_name = 'inventory_transactions'
  ) THEN
    ALTER TABLE inventory_transactions
    ADD CONSTRAINT inventory_transactions_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES user_profiles(id);
  END IF;
END $$;
