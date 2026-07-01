import {
  LANDING_FEATURE_PREVIEW_DEFAULT_ID,
  LANDING_FEATURE_SHOT_IDS,
  LANDING_FEATURE_SHOTS,
  landingFeatureShot,
} from "@/lib/landing/featurePreviewShots";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const lightPaths = LANDING_FEATURE_SHOT_IDS.map((id) => landingFeatureShot(id).light);
assert(
  new Set(lightPaths).size === LANDING_FEATURE_SHOT_IDS.length,
  "each feature id must map to a distinct light screenshot path",
);

for (const id of LANDING_FEATURE_SHOT_IDS) {
  const shot = landingFeatureShot(id);
  assert(shot.id === id, `shot id matches key for ${id}`);
  assert(shot.light === `/landing/feature-${id}.png`, `light path for ${id}`);
  assert(shot.dark === `/landing/feature-${id}-dark.png`, `dark path for ${id}`);
  assert(Boolean(shot.light), `light path for ${id}`);
}

assert(
  LANDING_FEATURE_SHOT_IDS.length === Object.keys(LANDING_FEATURE_SHOTS).length,
  "shot ids cover all entries",
);

const defaultShot = landingFeatureShot(LANDING_FEATURE_PREVIEW_DEFAULT_ID);
assert(defaultShot.id === LANDING_FEATURE_PREVIEW_DEFAULT_ID, "default preview id has a shot");
assert(
  defaultShot.light === `/landing/feature-${LANDING_FEATURE_PREVIEW_DEFAULT_ID}.png`,
  "default preview uses matching screenshot asset",
);

console.log("featurePreviewShots: ok");
