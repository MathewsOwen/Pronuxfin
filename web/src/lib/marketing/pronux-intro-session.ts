/** Clears when all tabs for this origin are closed — ideal for “seen once per visit”. */
export const PRONUX_INTRO_SESSION_KEY = "pronux-intro-seen";

export function hasSeenPronuxIntroThisSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(PRONUX_INTRO_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function markPronuxIntroSeenThisSession(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(PRONUX_INTRO_SESSION_KEY, "1");
  } catch {
    /* private mode / quota */
  }
}

/** `?intro=0` skips for E2E; otherwise show only on first home visit per tab session. */
export function wantsPronuxIntro(): boolean {
  try {
    if (new URLSearchParams(window.location.search).get("intro") === "0") {
      return false;
    }
  } catch {
    /* ignore */
  }
  return !hasSeenPronuxIntroThisSession();
}
