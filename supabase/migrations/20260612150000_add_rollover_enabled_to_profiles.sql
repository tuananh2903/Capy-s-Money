-- Migration: Add rollover_enabled column to public.profiles
-- Date: 2026-06-12

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS rollover_enabled BOOLEAN NOT NULL DEFAULT FALSE;
