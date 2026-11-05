import type { IdTokenResult } from 'firebase/auth';

/**
 * Temporary client-only phone alias. Only an email address (never password or
 * Firebase tokens) is stored on THIS device. Firebase Auth still verifies
 * every password; no password-based Firestore lookup or public user query.
 */
const STORAGE_KEY = 'mocchau_phone_email_device_v1';
const OWNER_EMAIL = 'hquansl001@gmail.com';

export function normalizeVietnamPhone(input: string): string | null {
  const value = input.replace(/[\s.\-()]/g, '');
  if (/^0[35789]\d{8}$/.test(value)) return '+84' + value.slice(1);
  if (/^84[35789]\d{8}$/.test(value)) return '+' + value;
  if (/^\+84[35789]\d{8}$/.test(value)) return value;
  return null;
}

export function getEmailForPhone(phone: string): string | null {
  const normalized = normalizeVietnamPhone(phone);
  if (!normalized) return null;
  try {
    const saved: Record<string, string> = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const email = saved[normalized];
    return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? email : null;
  } catch {
    return null;
  }
}

export function rememberPhoneEmail(phone: string, email: string): void {
  const normalized = normalizeVietnamPhone(phone);
  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
  try {
    const saved: Record<string, string> = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    saved[normalized] = email.trim().toLowerCase();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch {
    // Some browsers disallow localStorage; email sign-in remains available.
  }
}

export const OWNER_EMAILS = ['hquansl001@gmail.com', 'nhaxe@mocchau.vn'];

export function isOwnerEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return OWNER_EMAILS.includes(normalized);
}

/** Admin fallback uses owner email identity (Google OAuth, password, or custom claim). */
export function isVerifiedOwnerToken(token?: IdTokenResult | null, directEmail?: string | null): boolean {
  if (!token && !directEmail) return false;
  const tokenEmail = String(token?.claims?.email || '').trim().toLowerCase();
  const rawEmail = String(directEmail || '').trim().toLowerCase();
  return isOwnerEmail(tokenEmail) || isOwnerEmail(rawEmail);
}

export function hasOperatorAccess(token?: IdTokenResult | null, directEmail?: string | null): boolean {
  if (token?.claims?.admin === true || token?.claims?.operator === true) return true;
  const tokenEmail = String(token?.claims?.email || '').trim().toLowerCase();
  const rawEmail = String(directEmail || '').trim().toLowerCase();
  return isOwnerEmail(tokenEmail) || isOwnerEmail(rawEmail);
}


