-- ============================================
-- Add shipping columns to cases table
-- Run this in Supabase SQL Editor
-- ============================================

alter table cases add column if not exists shipping_carrier text default '';
alter table cases add column if not exists tracking_number text default '';
alter table cases add column if not exists shipped_at timestamp with time zone;
