-- Stop people giving themselves Pro.
--
-- The "Users access own profiles" policy lets a signed-in user update their
-- own profiles row, and the authenticated role has UPDATE on every column,
-- including the billing ones. So anyone could set subscription_status = 'pro'
-- from the browser with the public anon key (found 19 Nov 2026).
--
-- This trigger keeps the billing fields as they were whenever the write comes
-- from a signed-in user or an anonymous visitor, and starts a row they insert
-- on the free plan. Every other column still updates as before. Writes that
-- don't run as those roles are unaffected:
--  - the Stripe webhook and server actions (service role,
--    lib/supabase/admin.ts);
--  - direct database connections (the Supabase dashboard and table editor,
--    the pooler), so giving someone Pro by hand still works;
--  - handle_new_user, which only inserts the id.
-- It's a trigger rather than a column REVOKE because a table-level grant
-- would quietly override a column-level revoke.

CREATE OR REPLACE FUNCTION public.protect_profile_billing()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- current_user is the role PostgREST switched to for this request.
  IF current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.subscription_status := 'free';
    NEW.stripe_customer_id := NULL;
    NEW.stripe_subscription_id := NULL;
  ELSE
    NEW.subscription_status := OLD.subscription_status;
    NEW.stripe_customer_id := OLD.stripe_customer_id;
    NEW.stripe_subscription_id := OLD.stripe_subscription_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_billing ON public.profiles;

CREATE TRIGGER protect_profile_billing
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_billing();
