import type { IdTokenResult } from 'firebase/auth';

/**
 * Temporary client-only phone alias. Only an email address (never password or
 * Firebase tokens) is stored on THIS device. Firebase Auth still verifies
 * every password; no password-based Firestore lookup or public user query.
 */
const STORAGE_KEY = 'mocchau_phone_email_device_v1';
const OWNER_EMAIL = 'hquansl001@gmail.com';
const OWNER_PHONE = '+84971050324';

export function normalizeVietnamPhone(input: string): string | null {
  const value = input.replace(/[\\s.\\-()]/g, '');
  if (/^0[35789]\\d{8}$/.test(value)) return '+84' + value.slice(1);
  if (/^84[35789]\\d{8}$/.test(value)) return '+' + value;
  if (/^\\+84[35789]\\d{8}$/.test(value)) return value;
  return null;
}

export function getEmailForPhone(phone: string): string | null {
  const normalized = normalizeVietnamPhone(phone);
  if (!normalized) return null;
  if (normalized === OWNER_PHONE) return OWNER_EMAIL;
  try {
    const saved: Record<string, string> = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const email = saved[normalized];
    return typeof email === 'string' && /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)
      ? email : null;
  } catch {
    return null;
  }
}

export function rememberPhoneEmail(phone: string, email: string): void {
  const normalized = normalizeVietnamPhone(phone);
  if (!normalized || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) return;
  if (normalized === OWNER_PHONE) return; // Never override owner's verified alias
  try {
    const saved: Record<string, string> = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    saved[normalized] = email.trim().toLowerCase();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch {
    // Some browsers disallow localStorage; email sign-in remains available.
  }
}

/** Admin fallback uses existing verified owner account, not an editable users.role. */
export function isVerifiedOwnerToken(token: IdTokenResult): boolean {
  const claims = token.claims;
  const email = String(claims.email || '').trim().toLowerCase();
  return email === OWNER_EMAIL && claims.email_verified === true;
}

export function hasOperatorAccess(token: IdTokenResult): boolean {
  return token.claims.admin === true ||
    token.claims.operator === true ||
    isVerifiedOwnerToken(token);
}

export function isOwnerEmail(email: string | null | undefined): boolean {
  return email?.trim().toLowerCase() === OWNER_EMAIL;
}
