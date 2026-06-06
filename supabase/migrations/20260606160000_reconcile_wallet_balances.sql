-- Migration: Reconcile wallet balances based on active transactions
-- Date: 2026-06-06

UPDATE public.wallets w
SET balance = COALESCE(
  (
    SELECT SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END)
    FROM public.transactions t
    WHERE t.wallet_id = w.id AND COALESCE(t.is_deleted, false) = false
  ),
  0
);

UPDATE public.jars j
SET spent_amount = COALESCE(
  (
    SELECT SUM(amount)
    FROM public.transactions t
    WHERE t.wallet_id = j.wallet_id
      AND t.jar_type = j.type
      AND t.type = 'expense'
      AND COALESCE(t.is_deleted, false) = false
      AND date_trunc('month', t.occurred_at)::DATE = date_trunc('month', CURRENT_DATE)::DATE
  ),
  0
);
