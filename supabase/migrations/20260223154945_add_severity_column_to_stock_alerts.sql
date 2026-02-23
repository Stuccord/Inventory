/*
  # Add Severity Column to Stock Alerts

  ## Changes
  1. Add severity column to stock_alerts table (critical, high, medium, low)
  2. Update existing alerts to have default severity based on alert type
  3. Update the check_stock_alerts trigger function to set severity

  ## Security
  - No RLS changes needed as policies already exist
*/

-- Add severity column
ALTER TABLE stock_alerts 
ADD COLUMN IF NOT EXISTS severity text DEFAULT 'medium' CHECK (severity IN ('critical', 'high', 'medium', 'low'));

-- Update existing alerts to have appropriate severity
UPDATE stock_alerts
SET severity = 'critical'
WHERE alert_type = 'out_of_stock' OR message ILIKE '%out of stock%';

UPDATE stock_alerts
SET severity = 'high'
WHERE alert_type = 'low_stock' AND severity = 'medium';

-- Update the check_stock_alerts function to include severity
CREATE OR REPLACE FUNCTION check_stock_alerts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.current_stock <= NEW.reorder_level AND NEW.is_active = true THEN
    INSERT INTO stock_alerts (product_id, alert_type, message, severity)
    SELECT 
      NEW.id,
      'low_stock',
      'Product ' || NEW.name || ' is below reorder level',
      CASE 
        WHEN NEW.current_stock = 0 THEN 'critical'
        WHEN NEW.current_stock <= NEW.reorder_level / 2 THEN 'high'
        ELSE 'medium'
      END
    WHERE NOT EXISTS (
      SELECT 1 FROM stock_alerts
      WHERE product_id = NEW.id
        AND alert_type = 'low_stock'
        AND acknowledged_at IS NULL
    );
  END IF;
  
  RETURN NEW;
END;
$$;
