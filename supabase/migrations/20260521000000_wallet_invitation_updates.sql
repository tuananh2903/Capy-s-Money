-- Migration: Update Wallet Invitations schema and add brute force columns to Profiles
-- Date: 2026-05-21

-- 1. Modify public.wallet_invitations table
ALTER TABLE public.wallet_invitations 
  ALTER COLUMN invited_email DROP NOT NULL,
  ALTER COLUMN expires_at SET DEFAULT (NOW() + INTERVAL '24 hours');

-- Add code column if not exists
ALTER TABLE public.wallet_invitations 
  ADD COLUMN IF NOT EXISTS code VARCHAR(12) UNIQUE;

-- 2. Modify public.profiles table to include brute-force tracking columns
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS failed_invite_attempts INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS invite_locked_until TIMESTAMPTZ DEFAULT NULL;

-- 3. Add index on code for faster lookups
CREATE INDEX IF NOT EXISTS idx_wallet_invitations_code ON public.wallet_invitations(code);
