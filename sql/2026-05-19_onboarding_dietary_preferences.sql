-- Onboarding flag and multi-select dietary preferences for AI meal planning
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS dietary_preferences TEXT[] NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN profiles.dietary_preferences IS 'User-selected diet keys (vegetarian, vegan, gluten_free, etc.)';
COMMENT ON COLUMN profiles.has_completed_onboarding IS 'When false, user is sent to /onboarding after sign-in';

-- Existing users skip onboarding
UPDATE profiles
SET has_completed_onboarding = TRUE
WHERE has_completed_onboarding = FALSE;
