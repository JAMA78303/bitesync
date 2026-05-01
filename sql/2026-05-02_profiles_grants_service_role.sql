-- Fix PostgREST error 42501: permission denied for table profiles
-- Hint from Postgres often suggests granting TO service_role when that role lacks table privileges.
-- Run once in Supabase → SQL Editor (same project as your app).

GRANT USAGE ON SCHEMA public TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO service_role;

-- If profiles uses serial/uuid defaults tied to sequences (uncommon for uuid), uncomment:
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
