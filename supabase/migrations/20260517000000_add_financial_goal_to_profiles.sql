-- Migration: Add financial_goal to public.profiles table
-- Created at: 2026-05-17

-- 1. Thêm cột financial_goal kiểu TEXT vào bảng profiles (nếu chưa tồn tại)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS financial_goal TEXT;

-- 2. Thêm mô tả cho cột để dễ quản lý
COMMENT ON COLUMN public.profiles.financial_goal IS 'Mục tiêu tài chính cá nhân hóa được chọn từ luồng Onboarding phong cách chill.';
