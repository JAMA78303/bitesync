-- The CoFID table was originally seeded via the SQL editor, so service_role was never
-- granted write access. The import script (scripts/import-cofid.ts) upserts as service_role,
-- so grant it write privileges on the table and its identity sequence.

GRANT SELECT, INSERT, UPDATE ON public.cofid_foods TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.cofid_foods_id_seq TO service_role;
