const STORAGE_KEY = "pronuxfin_onboarding_v3";

export function onboardingStorageKey(userId: string): string {
  return `${STORAGE_KEY}:${userId}`;
}

export function isOnboardingDismissed(userId: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(onboardingStorageKey(userId)) === "1";
  } catch {
    return true;
  }
}

export function dismissOnboarding(userId: string): void {
  try {
    localStorage.setItem(onboardingStorageKey(userId), "1");
  } catch {
    /* ignore quota / private mode */
  }
}
