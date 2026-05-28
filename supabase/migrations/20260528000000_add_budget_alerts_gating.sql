-- Add enable_alerts to public.jars
ALTER TABLE public.jars 
ADD COLUMN IF NOT EXISTS enable_alerts BOOLEAN NOT NULL DEFAULT FALSE;

-- Create public.budgets table if not exists
CREATE TABLE IF NOT EXISTS public.budgets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id     UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  category_id   UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  amount_limit  BIGINT NOT NULL CHECK (amount_limit >= 0),
  period        TEXT NOT NULL DEFAULT 'monthly' CHECK (period = 'monthly'),
  start_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  enable_alerts BOOLEAN NOT NULL DEFAULT FALSE,
  created_by    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for public.budgets
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- RLS Policy for public.budgets: users can access budgets for wallets they own or are members of
DROP POLICY IF EXISTS "budget_access" ON public.budgets;
CREATE POLICY "budget_access" ON public.budgets
  USING (
    created_by = auth.uid()
    OR wallet_id IN (
      SELECT id FROM public.wallets WHERE user_id = auth.uid()
      UNION
      SELECT wallet_id FROM public.wallet_members WHERE user_id = auth.uid()
    )
  );

-- Trigger to enforce maximum 3 active alerts for free users
CREATE OR REPLACE FUNCTION public.check_premium_alert_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_tier TEXT;
  v_user_id UUID;
  v_active_jar_alerts INT := 0;
  v_active_category_alerts INT := 0;
BEGIN
  -- Resolve the user ID invoking the database action
  v_user_id := auth.uid();
  
  -- Resolve user subscription tier
  SELECT tier INTO v_tier FROM public.profiles WHERE id = v_user_id;
  
  IF v_tier = 'free' THEN
    -- Count enabled alerts on Jars
    SELECT COUNT(*) INTO v_active_jar_alerts
    FROM public.jars j
    JOIN public.wallets w ON j.wallet_id = w.id
    WHERE w.created_by = v_user_id AND j.enable_alerts = TRUE;

    -- Count enabled alerts on Category Budgets
    SELECT COUNT(*) INTO v_active_category_alerts
    FROM public.budgets b
    WHERE b.created_by = v_user_id AND b.enable_alerts = TRUE;

    -- Raise exception if user exceeds 3 active alerts
    IF (v_active_jar_alerts + v_active_category_alerts) > 3 THEN
      RAISE EXCEPTION 'Free tier users are limited to a maximum of 3 active budget alerts.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to jars table
DROP TRIGGER IF EXISTS trg_check_jars_alert_limit ON public.jars;
CREATE TRIGGER trg_check_jars_alert_limit
  AFTER INSERT OR UPDATE OF enable_alerts ON public.jars
  FOR EACH ROW
  WHEN (NEW.enable_alerts = TRUE)
  EXECUTE FUNCTION public.check_premium_alert_limit();

-- Bind trigger to budgets table
DROP TRIGGER IF EXISTS trg_check_budgets_alert_limit ON public.budgets;
CREATE TRIGGER trg_check_budgets_alert_limit
  AFTER INSERT OR UPDATE OF enable_alerts ON public.budgets
  FOR EACH ROW
  WHEN (NEW.enable_alerts = TRUE)
  EXECUTE FUNCTION public.check_premium_alert_limit();
