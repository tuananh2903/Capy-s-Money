-- Migration: Add Jars, Wallet Members, Invitations, and Triggers for Capy's Money Dashboard
-- Date: 2026-05-20

-- 1. Drop legacy tables if they exist (they are empty and use old schemas)
DROP TRIGGER IF EXISTS trg_recalculate_jar_spent ON public.transactions;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.budgets CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.families CASCADE;

-- 2. Create public.wallet_members table if not exists (supporting shared wallets)
CREATE TABLE IF NOT EXISTS public.wallet_members (
  wallet_id  UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  joined_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (wallet_id, user_id)
);

-- Enable RLS for wallet_members
ALTER TABLE public.wallet_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for wallet_members
DROP POLICY IF EXISTS "member_access" ON public.wallet_members;
CREATE POLICY "member_access" ON public.wallet_members
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.wallets w
      WHERE w.id = wallet_members.wallet_id AND w.user_id = auth.uid()
    )
  );

-- 3. Create public.wallet_invitations table if not exists
CREATE TABLE IF NOT EXISTS public.wallet_invitations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id   UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  invited_by  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  token       TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::TEXT,
  role        TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'editor', 'viewer')),
  status      TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at  TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for wallet_invitations
ALTER TABLE public.wallet_invitations ENABLE ROW LEVEL SECURITY;

-- RLS policies for wallet_invitations
DROP POLICY IF EXISTS "invite_access" ON public.wallet_invitations;
CREATE POLICY "invite_access" ON public.wallet_invitations
  USING (
    invited_by = auth.uid()
    OR invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- 4. Create public.categories table
CREATE TABLE public.categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- NULL = system category
  name       TEXT NOT NULL,
  icon       TEXT,
  color      TEXT,
  type       TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  jar_type   TEXT NOT NULL CHECK (jar_type IN ('NEC', 'FFA', 'EDU', 'PLAY', 'LTSS', 'GIVE')),
  is_system  BOOLEAN DEFAULT FALSE,
  parent_id  UUID REFERENCES public.categories(id)
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "category_access" ON public.categories
  USING (
    user_id IS NULL OR user_id = auth.uid()
  );

-- 5. Create public.transactions table
CREATE TABLE public.transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id       UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  category_id     UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  jar_type        TEXT NOT NULL CHECK (jar_type IN ('NEC', 'FFA', 'EDU', 'PLAY', 'LTSS', 'GIVE')),
  amount          BIGINT NOT NULL CHECK (amount > 0),
  type            TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  note            TEXT,
  occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  is_deleted      BOOLEAN DEFAULT FALSE,
  client_id       UUID UNIQUE,
  source          TEXT DEFAULT 'manual'
);

CREATE INDEX idx_transactions_wallet_date ON public.transactions(wallet_id, occurred_at DESC);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transaction_access" ON public.transactions
  USING (
    wallet_id IN (
      SELECT id FROM public.wallets WHERE user_id = auth.uid()
      UNION
      SELECT wallet_id FROM public.wallet_members WHERE user_id = auth.uid()
    )
  );

-- 6. Create public.jars table
CREATE TABLE IF NOT EXISTS public.jars (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id             UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  type                  TEXT NOT NULL CHECK (type IN ('NEC', 'FFA', 'EDU', 'PLAY', 'LTSS', 'GIVE')),
  budget_limit          BIGINT NOT NULL DEFAULT 0 CHECK (budget_limit >= 0),
  spent_amount          BIGINT NOT NULL DEFAULT 0 CHECK (spent_amount >= 0),
  allocation_percentage INT NOT NULL DEFAULT 0 CHECK (allocation_percentage BETWEEN 0 AND 100),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wallet_id, type)
);

CREATE INDEX IF NOT EXISTS idx_jars_wallet_type ON public.jars(wallet_id, type);
ALTER TABLE public.jars ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for public.jars
DROP POLICY IF EXISTS "user_can_read_jars" ON public.jars;
CREATE POLICY "user_can_read_jars" ON public.jars
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.wallets w
      WHERE w.id = jars.wallet_id AND w.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.wallet_members wm
      WHERE wm.wallet_id = jars.wallet_id AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "user_can_update_jars" ON public.jars;
CREATE POLICY "user_can_update_jars" ON public.jars
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.wallets w
      WHERE w.id = jars.wallet_id AND w.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.wallet_members wm
      WHERE wm.wallet_id = jars.wallet_id AND wm.user_id = auth.uid() AND wm.role IN ('owner', 'editor')
    )
  );

DROP POLICY IF EXISTS "user_can_insert_jars" ON public.jars;
CREATE POLICY "user_can_insert_jars" ON public.jars
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.wallets w
      WHERE w.id = jars.wallet_id AND w.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.wallet_members wm
      WHERE wm.wallet_id = jars.wallet_id AND wm.user_id = auth.uid() AND wm.role IN ('owner', 'editor')
    )
  );

-- 8. Create Trigger function to automatically recalculate jar spent_amount
CREATE OR REPLACE FUNCTION public.recalculate_jar_spent_amount()
RETURNS TRIGGER AS $$
DECLARE
  v_wallet_id UUID;
  v_jar_type TEXT;
  v_target_month DATE;
  v_total_spent BIGINT;
BEGIN
  -- Recalculate for OLD record (on UPDATE or DELETE)
  IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    v_wallet_id := OLD.wallet_id;
    v_jar_type := OLD.jar_type;
    v_target_month := date_trunc('month', OLD.occurred_at)::DATE;

    IF v_jar_type IS NOT NULL THEN
      SELECT COALESCE(SUM(amount), 0)
      INTO v_total_spent
      FROM public.transactions
      WHERE wallet_id = v_wallet_id
        AND jar_type = v_jar_type
        AND type = 'expense'
        AND is_deleted = FALSE
        AND date_trunc('month', occurred_at)::DATE = v_target_month;

      INSERT INTO public.jars (wallet_id, type, spent_amount, budget_limit, allocation_percentage)
      VALUES (v_wallet_id, v_jar_type, v_total_spent, 0, 0)
      ON CONFLICT (wallet_id, type)
      DO UPDATE SET spent_amount = v_total_spent, updated_at = NOW();
    END IF;
  END IF;

  -- Recalculate for NEW record (on INSERT or UPDATE)
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    v_wallet_id := NEW.wallet_id;
    v_jar_type := NEW.jar_type;
    v_target_month := date_trunc('month', NEW.occurred_at)::DATE;

    -- Avoid double calculation if wallet/jar/month didn't change
    IF NOT (TG_OP = 'UPDATE' AND 
            OLD.wallet_id = NEW.wallet_id AND 
            OLD.jar_type = NEW.jar_type AND 
            date_trunc('month', OLD.occurred_at)::DATE = v_target_month) THEN
      
      IF v_jar_type IS NOT NULL THEN
        SELECT COALESCE(SUM(amount), 0)
        INTO v_total_spent
        FROM public.transactions
        WHERE wallet_id = v_wallet_id
          AND jar_type = v_jar_type
          AND type = 'expense'
          AND is_deleted = FALSE
          AND date_trunc('month', occurred_at)::DATE = v_target_month;

        INSERT INTO public.jars (wallet_id, type, spent_amount, budget_limit, allocation_percentage)
        VALUES (v_wallet_id, v_jar_type, v_total_spent, 0, 0)
        ON CONFLICT (wallet_id, type)
        DO UPDATE SET spent_amount = v_total_spent, updated_at = NOW();
      END IF;
    END IF;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Attach trigger to public.transactions
DROP TRIGGER IF EXISTS trg_recalculate_jar_spent ON public.transactions;
CREATE TRIGGER trg_recalculate_jar_spent
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_jar_spent_amount();
