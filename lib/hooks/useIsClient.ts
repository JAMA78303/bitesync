import { useSyncExternalStore } from "react";

/** True after client hydration — avoids setState-in-effect for theme/modal guards. */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
