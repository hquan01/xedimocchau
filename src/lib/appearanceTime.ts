/** The customer-facing site follows each visitor's local morning, afternoon and night. */
export type DayPart = 'morning' | 'afternoon' | 'night';
export type AppearancePreference = 'auto' | 'light' | 'dark';

export const APPEARANCE_STORAGE_KEY = 'qt_limousine_appearance_v1';

export function getDayPart(date: Date = new Date()): DayPart {
  const hour = date.getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'night';
}

export function effectiveDayPart(preference: AppearancePreference, part: DayPart): DayPart {
  if (preference === 'light') return 'morning';
  if (preference === 'dark') return 'night';
  return part;
}

export function parseAppearancePreference(input: unknown): AppearancePreference {
  return input === 'light' || input === 'dark' ? input : 'auto';
}

export function nextAppearancePreference(current: AppearancePreference): AppearancePreference {
  // First tap from Auto offers immediate relief from glare.
  return current === 'auto' ? 'dark' : current === 'dark' ? 'light' : 'auto';
}
