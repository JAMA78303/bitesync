-- Fix "column is_manual does not exist" when replace_grocery_items was applied
-- without running 2026-04-30_flexible_input_and_selective_grocery.sql first.
ALTER TABLE public.grocery_items
ADD COLUMN IF NOT EXISTS is_manual BOOLEAN DEFAULT FALSE;
