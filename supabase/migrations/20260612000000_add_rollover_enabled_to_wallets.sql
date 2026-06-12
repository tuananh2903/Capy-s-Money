-- Migration: Add rollover_enabled column to public.wallets
-- Date: 2026-06-12

ALTER TABLE public.wallets 
ADD COLUMN IF NOT EXISTS rollover_enabled BOOLEAN NOT NULL DEFAULT FALSE;
