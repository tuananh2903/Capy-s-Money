-- Migration: Account-wide Budget Jars and Category Budgets (v2)
-- Date: 2026-06-11

-- 1. Add total_budget column to public.profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS total_budget BIGINT NOT NULL DEFAULT 10000000;

-- 2. Modify public.jars table to use user_id instead of wallet_id
-- 2.1 Add user_id column
ALTER TABLE public.jars
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 2.2 Migrate existing jar user_ids
UPDATE public.jars j
SET user_id = (SELECT w.user_id FROM public.wallets w WHERE w.id = j.wallet_id);

-- 2.3 De-duplicate jars: keep only one jar per user per type (ranked by default wallet, then creation time)
WITH ranked_jars AS (
  SELECT j.id,
         ROW_NUMBER() OVER (
           PARTITION BY j.user_id, j.type
           ORDER BY w.is_default DESC, w.created_at ASC, j.updated_at DESC
         ) as rn
  FROM public.jars j
  JOIN public.wallets w ON j.wallet_id = w.id
)
DELETE FROM public.jars
WHERE id IN (
  SELECT id FROM ranked_jars WHERE rn > 1
);

-- 2.4 Clean up any jars with null user_id (e.g. if wallet was already deleted)
DELETE FROM public.jars WHERE user_id IS NULL;

-- 2.5 Drop dependent RLS policies first
DROP POLICY IF EXISTS "user_can_read_jars" ON public.jars;
DROP POLICY IF EXISTS "user_can_update_jars" ON public.jars;
DROP POLICY IF EXISTS "user_can_insert_jars" ON public.jars;

-- 2.6 Alter jars constraint and column
ALTER TABLE public.jars ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.jars DROP CONSTRAINT IF EXISTS jars_wallet_id_type_key;
ALTER TABLE public.jars DROP COLUMN IF EXISTS wallet_id;
ALTER TABLE public.jars ADD CONSTRAINT jars_user_id_type_key UNIQUE (user_id, type);

-- 2.7 Create new RLS policies for public.jars
CREATE POLICY "user_can_read_jars" ON public.jars
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_can_update_jars" ON public.jars
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "user_can_insert_jars" ON public.jars
  FOR INSERT WITH CHECK (user_id = auth.uid());


-- 3. Modify public.budgets table to use user_id instead of wallet_id
-- 3.1 Add user_id column
ALTER TABLE public.budgets
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 3.2 Migrate existing budgets user_ids
UPDATE public.budgets b
SET user_id = (SELECT w.user_id FROM public.wallets w WHERE w.id = b.wallet_id);

-- 3.3 De-duplicate budgets: keep only one budget per user per category (ranked by default wallet, then creation time)
WITH ranked_budgets AS (
  SELECT b.id,
         ROW_NUMBER() OVER (
           PARTITION BY b.user_id, b.category_id
           ORDER BY w.is_default DESC, w.created_at ASC, b.updated_at DESC
         ) as rn
  FROM public.budgets b
  JOIN public.wallets w ON b.wallet_id = w.id
)
DELETE FROM public.budgets
WHERE id IN (
  SELECT id FROM ranked_budgets WHERE rn > 1
);

-- 3.4 Clean up any budgets with null user_id
DELETE FROM public.budgets WHERE user_id IS NULL;

-- 3.5 Drop dependent RLS policies first
DROP POLICY IF EXISTS "budget_access" ON public.budgets;

-- 3.6 Alter budgets constraint and column
ALTER TABLE public.budgets ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.budgets DROP COLUMN IF EXISTS wallet_id;
ALTER TABLE public.budgets ADD CONSTRAINT budgets_user_id_category_id_key UNIQUE (user_id, category_id);

-- 3.7 Create new RLS policies for public.budgets
CREATE POLICY "budget_access" ON public.budgets
  USING (user_id = auth.uid());


-- 4. Update recalculate_jar_spent_amount trigger function
CREATE OR REPLACE FUNCTION public.recalculate_jar_spent_amount()
RETURNS TRIGGER AS $$
DECLARE
  v_wallet_id UUID;
  v_user_id UUID;
  v_jar_type TEXT;
  v_target_month DATE;
  v_total_spent BIGINT;
BEGIN
  -- 1. Determine affected wallet, jar type, and month
  IF TG_OP = 'DELETE' THEN
    v_wallet_id := OLD.wallet_id;
    v_jar_type := OLD.jar_type;
    v_target_month := date_trunc('month', OLD.occurred_at)::DATE;
  ELSE
    v_wallet_id := NEW.wallet_id;
    v_jar_type := NEW.jar_type;
    v_target_month := date_trunc('month', NEW.occurred_at)::DATE;
  END IF;

  -- Resolve user_id from the wallet
  SELECT user_id INTO v_user_id FROM public.wallets WHERE id = v_wallet_id;

  IF v_user_id IS NOT NULL AND v_jar_type IS NOT NULL THEN
    -- Sum expense transactions across ALL wallets of this user
    SELECT COALESCE(SUM(t.amount), 0)
    INTO v_total_spent
    FROM public.transactions t
    JOIN public.wallets w ON t.wallet_id = w.id
    WHERE w.user_id = v_user_id
      AND t.jar_type = v_jar_type
      AND t.type = 'expense'
      AND t.is_deleted = FALSE
      AND date_trunc('month', t.occurred_at)::DATE = v_target_month;

    -- Update/Insert in public.jars table
    INSERT INTO public.jars (user_id, type, spent_amount, budget_limit, allocation_percentage)
    VALUES (v_user_id, v_jar_type, v_total_spent, 0, 0)
    ON CONFLICT (user_id, type)
    DO UPDATE SET spent_amount = v_total_spent, updated_at = NOW();
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Update check_premium_alert_limit trigger function
CREATE OR REPLACE FUNCTION public.check_premium_alert_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_tier TEXT;
  v_user_id UUID;
  v_active_jar_alerts INT := 0;
  v_active_category_alerts INT := 0;
BEGIN
  v_user_id := NEW.user_id;
  
  SELECT tier INTO v_tier FROM public.profiles WHERE id = v_user_id;
  
  IF v_tier = 'free' THEN
    -- Count enabled alerts on Jars
    SELECT COUNT(*) INTO v_active_jar_alerts
    FROM public.jars
    WHERE user_id = v_user_id AND enable_alerts = TRUE;

    -- Count enabled alerts on Category Budgets
    SELECT COUNT(*) INTO v_active_category_alerts
    FROM public.budgets
    WHERE user_id = v_user_id AND enable_alerts = TRUE;

    -- Raise exception if user exceeds 3 active alerts
    IF (v_active_jar_alerts + v_active_category_alerts) > 3 THEN
      RAISE EXCEPTION 'Free tier users are limited to a maximum of 3 active budget alerts.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
