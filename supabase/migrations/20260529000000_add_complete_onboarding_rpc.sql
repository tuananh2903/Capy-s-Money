-- Migration: Add complete_onboarding RPC for atomic transaction setup
-- Created at: 2026-05-29

CREATE OR REPLACE FUNCTION public.complete_onboarding(
  p_user_id UUID,
  p_goal TEXT,
  p_balance NUMERIC,
  p_wallet_name TEXT,
  p_jars_ratios JSONB
)
RETURNS VOID AS $$
DECLARE
  v_onboarding_completed BOOLEAN;
  v_wallet_id UUID;
BEGIN
  -- 1. Check if onboarding is already completed
  SELECT onboarding_completed INTO v_onboarding_completed
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_onboarding_completed = TRUE THEN
    RETURN;
  END IF;

  -- 2. Update profiles table
  UPDATE public.profiles
  SET 
    onboarding_completed = TRUE,
    financial_goal = p_goal,
    jars_ratios = p_jars_ratios,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- 3. Create initial cash wallet
  INSERT INTO public.wallets (user_id, name, balance, is_default, type, created_at, updated_at)
  VALUES (p_user_id, p_wallet_name, p_balance, TRUE, 'cash', NOW(), NOW())
  RETURNING id INTO v_wallet_id;

  -- 4. Create 6 financial jars
  INSERT INTO public.jars (wallet_id, type, allocation_percentage, budget_limit, spent_amount, created_at, updated_at)
  VALUES
    (v_wallet_id, 'NEC', COALESCE((p_jars_ratios->>'nec')::INT, 55), 0, 0, NOW(), NOW()),
    (v_wallet_id, 'FFA', COALESCE((p_jars_ratios->>'ffa')::INT, 10), 0, 0, NOW(), NOW()),
    (v_wallet_id, 'EDU', COALESCE((p_jars_ratios->>'edu')::INT, 10), 0, 0, NOW(), NOW()),
    (v_wallet_id, 'PLAY', COALESCE((p_jars_ratios->>'play')::INT, 10), 0, 0, NOW(), NOW()),
    (v_wallet_id, 'LTSS', COALESCE((p_jars_ratios->>'lt')::INT, 10), 0, 0, NOW(), NOW()),
    (v_wallet_id, 'GIVE', COALESCE((p_jars_ratios->>'give')::INT, 5), 0, 0, NOW(), NOW());

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
