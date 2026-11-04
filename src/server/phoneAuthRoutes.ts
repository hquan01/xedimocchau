import { Router, type Request, type Response } from 'express';
import { createHash } from 'node:crypto';
import { getApps, initializeApp, applicationDefault, cert, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

/**
 * Phone + password is an alias to ONE Firebase email/password identity.
 * A verified recovery email is mandatory. No SMS is sent, and a phone number
 * is NOT treated as verified ownership without a future OTP provider.
 *
 * Deployed server requires FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON or ADC. Never
 * put service-account credentials or mapping collections in client code.
 */
export const phoneAuthRouter = Router();
const INDEX = 'phone_login_aliases';
const LIMITS = 'phone_auth_rate_limits';
const GENERIC_LOGIN_ERROR = 'Số điện thoại hoặc mật khẩu không đúng.';
const GENERIC_RESET_NOTICE = 'Nếu tài khoản hợp lệ, hướng dẫn đặt lại mật khẩu sẽ được gửi tới email đã xác minh.';

function normalizePhone(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const digits = raw.replace(/[\s.\-()]/g, '');
  if (/^0[35789]\d{8}$/.test(digits)) return '+84' + digits.slice(1);
  if (/^84[35789]\d{8}$/.test(digits)) return '+' + digits;
  if (/^\+84[35789]\d{8}$/.test(digits)) return digits;
  return null;
}
function adminApp(): App {
  const found = getApps().find(app => app.name === 'mocchau-phone-auth');
  if (found) return found;
  const secret = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON?.trim();
  if (!secret && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error('Phone auth server credentials missing');
  }
  const credential = secret ? cert(JSON.parse(secret)) : applicationDefault();
  return initializeApp({ credential, projectId: firebaseConfig.projectId }, 'mocchau-phone-auth');
}
function services() {
  const app = adminApp();
  return { auth: getAuth(app), db: getFirestore(app, firebaseConfig.firestoreDatabaseId) };
}
function errorResponse(res: Response, error: unknown) {
  const message = String(error instanceof Error ? error.message : error);
  if (message === 'rate-limit') return res.status(429).json({ error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' });
  if (message === 'alias-in-use') return res.status(409).json({ error: 'Số điện thoại này đã được liên kết với một tài khoản khác. Vui lòng liên hệ hỗ trợ.' });
  if (message === 'unverified-email') return res.status(403).json({ error: 'Hãy xác minh email khôi phục trước khi bật đăng nhập bằng số điện thoại.' });
  if (message === 'missing-token') return res.status(401).json({ error: 'Vui lòng đăng nhập bằng email trước.' });
  if (message === 'invalid-phone') return res.status(400).json({ error: 'Số điện thoại Việt Nam không hợp lệ.' });
  // Do not leak service-account details or whether any identity exists.
  console.warn('[Phone auth] Request could not be completed:', message.replace(/-----BEGIN[\s\S]*?PRIVATE KEY-----/g, '[KEY REDACTED]').slice(0, 140));
  return res.status(503).json({ error: 'Đăng nhập số điện thoại chưa sẵn sàng. Vui lòng thử đăng nhập bằng email hoặc liên hệ hỗ trợ.' });
}
function hashKey(key: string) {
  const salt = process.env.PHONE_AUTH_RATE_LIMIT_SALT || firebaseConfig.projectId;
  return createHash('sha256').update(salt + '|' + key).digest('hex');
}
async function checkLimit(req: Request, type: string, phone: string, maximum: number, durationMs: number) {
  const { db } = services();
  const ip = (req.ip || 'unknown').slice(0, 64);
  const now = Date.now();
  const keys = [
    { key: hashKey(type + ':phone:' + phone), max: maximum },
    { key: hashKey(type + ':ip:' + ip), max: maximum * 8 },
  ];
  for (const { key, max } of keys) {
    const ref = db.collection(LIMITS).doc(key);
    await db.runTransaction(async tx => {
      const current = await tx.get(ref);
      const data = current.data();
      const valid = typeof data?.windowStart === 'number' && now - data.windowStart < durationMs;
      const count = valid ? Number(data?.count || 0) : 0;
      if (count >= max) throw new Error('rate-limit');
      tx.set(ref, { windowStart: valid ? data!.windowStart : now, count: count + 1, expiresAt: new Date(now + durationMs) });
    });
  }
}
async function verifyBearer(req: Request) {
  const bearer = req.header('authorization') || '';
  if (!bearer.startsWith('Bearer ')) throw new Error('missing-token');
  return services().auth.verifyIdToken(bearer.slice(7), true);
}
async function firebasePasswordIsValid(email: string, password: string, expectedUid: string) {
  const response = await fetch(
    'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + encodeURIComponent(firebaseConfig.apiKey),
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
      signal: AbortSignal.timeout(12000),
    }
  );
  if (!response.ok) return false;
  const result = await response.json() as { localId?: string };
  return result.localId === expectedUid;
}

phoneAuthRouter.post('/phone/register', async (req, res) => {
  try {
    const phone = normalizePhone(req.body?.phone);
    if (!phone) throw new Error('invalid-phone');
    const decoded = await verifyBearer(req);
    const { auth, db } = services();
    const user = await auth.getUser(decoded.uid);
    if (!user.email || !user.emailVerified || user.disabled) throw new Error('unverified-email');
    await checkLimit(req, 'register', phone, 6, 60 * 60 * 1000);
    const ref = db.collection(INDEX).doc(phone);
    await db.runTransaction(async tx => {
      const existing = await tx.get(ref);
      if (existing.exists && existing.data()?.uid !== user.uid) throw new Error('alias-in-use');
      tx.set(ref, {
        uid: user.uid,
        phoneUnverified: true,
        emailVerifiedAtRegistration: true,
        updatedAt: new Date(),
      });
    });
    return res.json({ ok: true, notice: 'Đã bật đăng nhập bằng SĐT và mật khẩu. Số điện thoại chưa được xác minh bằng SMS.' });
  } catch (e) { return errorResponse(res, e); }
});

phoneAuthRouter.post('/phone/login', async (req, res) => {
  try {
    const phone = normalizePhone(req.body?.phone);
    const password = req.body?.password;
    if (!phone || typeof password !== 'string' || password.length < 1 || password.length > 256) {
      return res.status(401).json({ error: GENERIC_LOGIN_ERROR });
    }
    await checkLimit(req, 'login', phone, 10, 15 * 60 * 1000);
    const { auth, db } = services();
    const alias = await db.collection(INDEX).doc(phone).get();
    const uid = alias.data()?.uid;
    if (typeof uid !== 'string') return res.status(401).json({ error: GENERIC_LOGIN_ERROR });
    const user = await auth.getUser(uid);
    if (!user.email || !user.emailVerified || user.disabled || !(await firebasePasswordIsValid(user.email, password, uid))) {
      return res.status(401).json({ error: GENERIC_LOGIN_ERROR });
    }
    const token = await auth.createCustomToken(uid);
    res.set('Cache-Control', 'no-store');
    return res.json({ token });
  } catch (e) { return errorResponse(res, e); }
});

phoneAuthRouter.post('/phone/reset', async (req, res) => {
  try {
    const phone = normalizePhone(req.body?.phone);
    if (!phone) throw new Error('invalid-phone');
    await checkLimit(req, 'reset', phone, 3, 60 * 60 * 1000);
    const { auth, db } = services();
    const alias = await db.collection(INDEX).doc(phone).get();
    const uid = alias.data()?.uid;
    if (typeof uid === 'string') {
      const user = await auth.getUser(uid);
      if (user.email && user.emailVerified && !user.disabled) {
        await fetch('https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=' + encodeURIComponent(firebaseConfig.apiKey), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Firebase-Locale': 'vi' },
          body: JSON.stringify({ requestType: 'PASSWORD_RESET', email: user.email }),
          signal: AbortSignal.timeout(12000),
        });
      }
    }
    res.set('Cache-Control', 'no-store');
    return res.json({ ok: true, message: GENERIC_RESET_NOTICE });
  } catch (e) { return errorResponse(res, e); }
});
