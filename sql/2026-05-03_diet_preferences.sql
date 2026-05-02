-- User dietary preferences (used for planner / recipe hints)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS follows_vegetarian BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS follows_vegan BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS follows_gluten_free BOOLEAN NOT NULL DEFAULT FALSE;

-- Optional labels users set per recipe (NULL = not marked)
ALTER TABLE recipes
ADD COLUMN IF NOT EXISTS fits_vegetarian BOOLEAN DEFAULT NULL,
ADD COLUMN IF NOT EXISTS fits_vegan BOOLEAN DEFAULT NULL,
ADD COLUMN IF NOT EXISTS fits_gluten_free BOOLEAN DEFAULT NULL;

COMMENT ON COLUMN recipes.fits_vegetarian IS 'When true, recipe is marked suitable for vegetarians';
COMMENT ON COLUMN recipes.fits_vegan IS 'When true, recipe is marked suitable for vegans';
COMMENT ON COLUMN recipes.fits_gluten_free IS 'When true, recipe is marked gluten-free friendly';
