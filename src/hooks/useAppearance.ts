import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  APPEARANCE_STORAGE_KEY,
  effectiveDayPart,
  getDayPart,
  nextAppearancePreference,
  parseAppearancePreference,
  type AppearancePreference,
  type DayPart
} from '../lib/appearanceTime';

function loadPreference(): AppearancePreference {
  try { return parseAppearancePreference(window.localStorage.getItem(APPEARANCE_STORAGE_KEY)); }
  catch { return 'auto'; }
}

/**
 * Appearance is presentation only: never touches bookings, user accounts or
 * external storage. Auto updates when the local time period changes.
 */
export function useAppearance(activeTab: string) {
  const [preference, setPreference] = useState<AppearancePreference>(loadPreference);
  const [dayPart, setDayPart] = useState<DayPart>(() => getDayPart());

  useEffect(() => {
    const refresh = () => setDayPart(getDayPart());
    const syncAcrossTabs = (event: StorageEvent) => {
      if (event.key === APPEARANCE_STORAGE_KEY) setPreference(parseAppearancePreference(event.newValue));
    };
    const onVisibility = () => { if (!document.hidden) refresh(); };
    const interval = window.setInterval(refresh, 60_000);
    window.addEventListener('storage', syncAcrossTabs);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('storage', syncAcrossTabs);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const effective = effectiveDayPart(preference, dayPart);
  useLayoutEffect(() => {
    const root = document.getElementById('app_root');
    if (!root) return;
    // Do not restyle the operational Admin pages; their contrast is safety-critical.
    const applied = activeTab === 'operator' ? 'morning' : effective;
    root.dataset.appearance = applied;
    document.documentElement.dataset.qtPrepaint = applied === 'night' ? 'night' : 'day';
    root.dataset.appearancePreference = preference;
    root.dataset.daypart = dayPart;
    const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (themeColor) themeColor.content = applied === 'night' ? '#0c1720' : applied === 'afternoon' ? '#eef3ed' : '#1b4332';
  }, [activeTab, effective, preference, dayPart]);

  const cyclePreference = useCallback(() => {
    setPreference(old => {
      const next = nextAppearancePreference(old);
      try { window.localStorage.setItem(APPEARANCE_STORAGE_KEY, next); } catch { /* Privacy mode */ }
      return next;
    });
  }, []);

  return { preference, dayPart, effective, cyclePreference };
}
