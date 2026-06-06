-- Migration: Add tier column to profiles table
-- Date: 2026-06-06

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'premium'));
