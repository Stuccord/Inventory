/*
  # Fix Severity Values in Stock Alert Function

  ## Issue
  The stock_alerts table has a check constraint requiring severity to be one of:
  'critical', 'high', 'medium', 'low'
  
  But the check_stock_alerts function was using 'warning' and 'info' instead.

  ## Changes
  1. Update check_stock_alerts function to use correct severity values
  2. Mapping: critical (0 stock), high (<50% reorder), medium (<=reorder level)

  ## Security
  - No security changes
  - Maintains existing SECURITY DEFINER with proper search_path
*/

CREATE OR REPLACE FUNCTION check_stock_alerts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  alert_severity text;
  alert_exists boolean;
BEGIN
  -- Only check if current_stock changed and is at or below reorder_level
  IF (TG_OP = 'INSERT' OR NEW.current_stock != OLD.current_stock) 
     AND NEW.current_stock <= NEW.reorder_level THEN
    
    -- Check if an active (unacknowledged) alert already exists
    SELECT EXISTS(
      SELECT 1 FROM stock_alerts
      WHERE product_id = NEW.id
      AND is_acknowledged = false
    ) INTO alert_exists;

    -- Only create alert if one doesn't exist
    IF NOT alert_exists THEN
      -- Calculate severity based on stock level
      -- Must match constraint: 'critical', 'high', 'medium', 'low'
      IF NEW.current_stock = 0 THEN
        alert_severity := 'critical';
      ELSIF NEW.current_stock <= (NEW.reorder_level * 0.5) THEN
        alert_severity := 'high';
      ELSE
        alert_severity := 'medium';
      END IF;

      -- Create the alert
      INSERT INTO stock_alerts (
        product_id,
        alert_type,
        severity,
        message,
        is_acknowledged,
        created_at
      ) VALUES (
        NEW.id,
        'low_stock',
        alert_severity,
        format('Product "%s" is running low. Current stock: %s, Reorder level: %s', 
          NEW.name, NEW.current_stock, NEW.reorder_level),
        false,
        now()
      );

      RAISE NOTICE 'Stock alert created for product: % with severity: %', NEW.name, alert_severity;
    END IF;
  END IF;

  -- Auto-acknowledge alerts when stock is replenished above reorder level
  IF (TG_OP = 'UPDATE' AND NEW.current_stock > NEW.reorder_level 
      AND OLD.current_stock <= OLD.reorder_level) THEN
    
    UPDATE stock_alerts
    SET 
      is_acknowledged = true,
      acknowledged_at = now(),
      acknowledged_by = COALESCE(auth.uid(), NEW.id)
    WHERE product_id = NEW.id
      AND is_acknowledged = false;

    RAISE NOTICE 'Stock alert auto-acknowledged for product: %', NEW.name;
  END IF;

  RETURN NEW;
END;
$$;
