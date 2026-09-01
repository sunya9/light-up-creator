import { useSyncExternalStore } from "react";

const MOBILE_BREAKPOINT = 768;
const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

export function useIsMobile() {
  return useSyncExternalStore(
    (onStoreChange) => {
      mql.addEventListener("change", onStoreChange);
      return () => mql.removeEventListener("change", onStoreChange);
    },
    () => mql.matches,
  );
}
