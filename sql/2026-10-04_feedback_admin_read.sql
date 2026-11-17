-- Let /admin/feedback read the in-app feedback.
--
-- feedback_submissions only granted INSERT to signed-in users (each writes
-- their own row). Nothing could read it except the Supabase dashboard, so
-- feedback was never seen in the app. The admin page reads with the service
-- role, which this project does not grant table access by default.
GRANT SELECT ON public.feedback_submissions TO service_role;
