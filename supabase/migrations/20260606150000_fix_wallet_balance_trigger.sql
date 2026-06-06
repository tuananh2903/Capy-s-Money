-- Migration: Fix update_wallet_balance trigger function to ignore soft-deleted transactions
-- Date: 2026-06-06

CREATE OR REPLACE FUNCTION public.update_wallet_balance()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
DECLARE
  v_wallet_id UUID;
  v_amount_diff BIGINT;
BEGIN
  -- 1. If UPDATE, we subtract the OLD transaction's effect if it was active (is_deleted = FALSE)
  IF TG_OP = 'UPDATE' THEN
    v_wallet_id := OLD.wallet_id;
    IF COALESCE(OLD.is_deleted, FALSE) = FALSE THEN
      IF OLD.type = 'income' THEN
        v_amount_diff := -OLD.amount;
      ELSE
        v_amount_diff := OLD.amount;
      END IF;
      
      UPDATE public.wallets 
      SET balance = balance + v_amount_diff, updated_at = NOW() 
      WHERE id = v_wallet_id;
    END IF;
  END IF;

  -- 2. If DELETE, we subtract the OLD transaction's effect if it was active
  IF TG_OP = 'DELETE' THEN
    v_wallet_id := OLD.wallet_id;
    IF COALESCE(OLD.is_deleted, FALSE) = FALSE THEN
      IF OLD.type = 'income' THEN
        v_amount_diff := -OLD.amount;
      ELSE
        v_amount_diff := OLD.amount;
      END IF;
      
      UPDATE public.wallets 
      SET balance = balance + v_amount_diff, updated_at = NOW() 
      WHERE id = v_wallet_id;
    END IF;
  END IF;

  -- 3. If INSERT or UPDATE, we add the NEW transaction's effect if it is active (is_deleted = FALSE)
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    v_wallet_id := NEW.wallet_id;
    IF COALESCE(NEW.is_deleted, FALSE) = FALSE THEN
      IF NEW.type = 'income' THEN
        v_amount_diff := NEW.amount;
      ELSE
        v_amount_diff := -NEW.amount;
      END IF;
      
      UPDATE public.wallets 
      SET balance = balance + v_amount_diff, updated_at = NOW() 
      WHERE id = v_wallet_id;
    END IF;
  END IF;

  RETURN NULL;
END;
$$;
