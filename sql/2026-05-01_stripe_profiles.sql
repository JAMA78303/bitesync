-- Stripe billing fields on profiles (required for webhooks + checkout)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

COMMENT ON COLUMN profiles.subscription_status IS 'free | pro | past_due | cancelled';
