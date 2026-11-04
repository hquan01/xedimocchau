import React, { useEffect, useRef, useState } from 'react';
import {
  GoogleAuthProvider, RecaptchaVerifier, ConfirmationResult,
  createUserWithEmailAndPassword, getIdTokenResult, sendPasswordResetEmail,
  signInWithEmailAndPassword, signInWithPhoneNumber, signInWithPopup, updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { X, UserRound, TicketPercent, ShieldCheck, Mail, Smartphone, ArrowLeft } from 'lucide-react';
import { auth, db } from '../firebase';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  users?: User[];
}

type Mode = 'login' | 'register' | 'forgot';
type LoginMethod = 'email' | 'phone';
const normalizePhone = (s: string) => {
  const value = s.replace(/[\s.\-()]/g, '');
  if (/^0[35789]\d{8}$/.test(value)) return '+84' + value.slice(1);
  if (/^84[35789]\d{8}$/.test(value)) return '+' + value;
  if (/^\+84[35789]\d{8}$/.test(value)) return value;
  return null;
};

/** Only Firebase Auth verifies identities; Admin permissions must come from server-issued claims. */
export default function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<Mode>('login');
  const [method, setMethod] = useState<LoginMethod>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    if (!isOpen) {
      recaptchaRef.current?.clear();
      recaptchaRef.current = null;
      setConfirmation(null);
      setOtp('');
      setError('');
    }
  }, [isOpen]);
  if (!isOpen) return null;

  const changeMethod = (value: LoginMethod) => {
    setMethod(value);
    setError('');
    setNotice('');
    setConfirmation(null);
    setOtp('');
  };
  const errorMessage = (e: any) => {
    const code = String(e?.code || '');
    if (code.includes('operation-not-allowed')) return 'Phương thức này chưa được bật trong Firebase Authentication. Hãy bật Email/Password hoặc Phone trong Firebase Console.';
    if (code.includes('invalid-credential') || code.includes('wrong-password')) return 'Email hoặc mật khẩu không đúng. Nếu đây là tài khoản cũ, hãy dùng Khôi phục mật khẩu.';
    if (code.includes('email-already-in-use')) return 'Email này đã có tài khoản. Hãy đăng nhập.';
    if (code.includes('invalid-verification-code')) return 'Mã xác thực SMS không đúng hoặc đã hết hạn.';
    if (code.includes('too-many-requests')) return 'Đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.';
    if (code.includes('unauthorized-domain') || code.includes('captcha-check-failed') || code.includes('invalid-app-credential')) return 'Không thể xác minh reCAPTCHA. Kiểm tra tên miền cho phép và cấu hình đăng nhập bằng số điện thoại trong Firebase.';
    if (code.includes('popup-closed-by-user')) return 'Bạn đã đóng cửa sổ Google. Vui lòng thử lại.';
    return e?.message || 'Không thể đăng nhập. Vui lòng thử lại.';
  };
  const finish = async (account: any, preferredName?: string, preferredPhone?: string) => {
    const token = await getIdTokenResult(account, true);
    const isAdmin = token.claims.admin === true || token.claims.operator === true;
    const ref = doc(db, 'users', account.uid);
    const snapshot = await getDoc(ref);
    const old = snapshot.exists() ? snapshot.data() : {};
    const profile: User = {
      id: account.uid,
      email: account.email || old.email || '',
      name: preferredName || old.name || account.displayName || account.email || 'Thành viên',
      phone: preferredPhone || old.phone || account.phoneNumber || '',
      points: typeof old.points === 'number' ? old.points : 0,
      role: isAdmin ? 'operator' : 'customer',
    };
    if (!snapshot.exists()) {
      // Never allow a newly registered user to create an Admin role or award points.
      await setDoc(ref, { ...profile, role: 'customer', points: 0, createdAt: new Date().toISOString() });
    }
    onLoginSuccess(profile);
    onClose();
  };
  const submitEmail = async (event: React.FormEvent) => {
    event.preventDefault(); setLoading(true); setError(''); setNotice('');
    try {
      if (mode === 'forgot') {
        if (!email.trim()) throw new Error('Vui lòng nhập email đã đăng ký.');
        await sendPasswordResetEmail(auth, email.trim());
        setNotice('Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi.');
      } else if (mode === 'register') {
        if (name.trim().length < 2) throw new Error('Vui lòng nhập họ tên.');
        if (phone.trim() && !normalizePhone(phone)) throw new Error('Số điện thoại Việt Nam không hợp lệ.');
        if (password.length < 8) throw new Error('Mật khẩu cần ít nhất 8 ký tự.');
        const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(result.user, { displayName: name.trim() });
        await finish(result.user, name.trim(), phone.trim());
      } else {
        const result = await signInWithEmailAndPassword(auth, email.trim(), password);
        await finish(result.user);
      }
    } catch (e) { setError(errorMessage(e)); } finally { setLoading(false); }
  };
  const sendCode = async (event: React.FormEvent) => {
    event.preventDefault(); setLoading(true); setError(''); setNotice('');
    try {
      const number = normalizePhone(phone);
      if (!number) throw new Error('Vui lòng nhập số điện thoại Việt Nam hợp lệ.');
      if (mode === 'register' && name.trim().length < 2) throw new Error('Vui lòng nhập họ tên.');
      // Firebase Authentication phone sign-in uses SMS plus a real reCAPTCHA, not a client-side bypass.
      if (!recaptchaRef.current) {
        recaptchaRef.current = new RecaptchaVerifier(auth, 'mocchau-phone-recaptcha', { size: 'invisible' });
      }
      const result = await signInWithPhoneNumber(auth, number, recaptchaRef.current);
      setConfirmation(result);
      setNotice('Mã xác thực đã được yêu cầu gửi tới điện thoại. Hãy nhập mã SMS để tiếp tục.');
    } catch (e) {
      setError(errorMessage(e));
      recaptchaRef.current?.clear();
      recaptchaRef.current = null;
    } finally { setLoading(false); }
  };
  const verifyCode = async (event: React.FormEvent) => {
    event.preventDefault(); setLoading(true); setError(''); setNotice('');
    try {
      if (!confirmation || !/^\d{6}$/.test(otp.trim())) throw new Error('Vui lòng nhập mã SMS gồm 6 chữ số.');
      const result = await confirmation.confirm(otp.trim());
      if (mode === 'register' && name.trim()) await updateProfile(result.user, { displayName: name.trim() });
      await finish(result.user, mode === 'register' ? name.trim() : undefined, result.user.phoneNumber || phone.trim());
    } catch (e) { setError(errorMessage(e)); } finally { setLoading(false); }
  };
  const signInGoogle = async () => {
    setLoading(true); setError('');
    try { const result = await signInWithPopup(auth, new GoogleAuthProvider()); await finish(result.user); }
    catch (e) { setError(errorMessage(e)); } finally { setLoading(false); }
  };
  return <div className="fixed inset-0 z-[150] bg-stone-950/70 p-3 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Tài khoản Mộc Châu Travel">
    <div className="bg-white w-full max-w-md max-h-[93dvh] overflow-y-auto rounded-3xl p-5 sm:p-7 shadow-2xl text-left relative">
      <button onClick={onClose} aria-label="Đóng" className="absolute top-3 right-3 text-stone-600 p-2 rounded-xl hover:bg-stone-100"><X className="w-5 h-5"/></button>
      <div className="flex gap-3 items-center mb-3 pr-9">
        <div className="bg-emerald-50 rounded-2xl p-3 shrink-0"><UserRound className="w-7 h-7 text-emerald-700"/></div>
        <div><h2 className="text-lg sm:text-xl font-black text-[#1b4332] leading-tight">{mode === 'register' ? 'Đăng ký thành viên' : mode === 'forgot' ? 'Khôi phục mật khẩu' : 'Đăng nhập Mộc Châu Travel'}</h2>
          <p className="text-xs text-stone-500 mt-1">Đặt xe, lưu vé và quản lý ưu đãi của bạn</p></div>
      </div>
      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 mb-4 flex gap-2 items-start">
        <TicketPercent className="w-5 h-5 text-emerald-700 shrink-0"/>
        <p className="text-xs text-emerald-950">Thành viên có thể sử dụng voucher <strong>khi có chương trình đủ điều kiện.</strong></p>
      </div>
      {mode !== 'forgot' && <div className="grid grid-cols-2 gap-2 mb-4" role="group" aria-label="Chọn cách đăng nhập">
        <button type="button" onClick={()=>changeMethod('phone')} className={`rounded-xl border p-3 text-sm font-bold flex items-center justify-center gap-2 ${method==='phone'?'border-emerald-700 bg-emerald-50 text-emerald-900':'text-stone-600'}`}><Smartphone className="w-4 h-4"/> Số điện thoại</button>
        <button type="button" onClick={()=>changeMethod('email')} className={`rounded-xl border p-3 text-sm font-bold flex items-center justify-center gap-2 ${method==='email'?'border-emerald-700 bg-emerald-50 text-emerald-900':'text-stone-600'}`}><Mail className="w-4 h-4"/> Email</button>
      </div>}
      {method === 'phone' && mode !== 'forgot' ? <>
        {!confirmation ? <form onSubmit={sendCode} className="space-y-3">
          {mode==='register'&&<label className="block text-xs font-bold">Họ và tên *<input required value={name} onChange={e=>setName(e.target.value)} maxLength={100} autoComplete="name" className="mt-1 w-full p-3 border rounded-xl text-sm" placeholder="Tên của bạn"/></label>}
          <label className="block text-xs font-bold">Số điện thoại *<input type="tel" required inputMode="tel" autoComplete="tel" value={phone} onChange={e=>setPhone(e.target.value)} className="mt-1 w-full p-3 border rounded-xl text-sm" placeholder="09xxxxxxxx"/></label>
          <button type="submit" disabled={loading} className="w-full bg-[#1b4332] text-white rounded-xl p-3.5 text-sm font-bold disabled:opacity-50">{loading?'Đang gửi...':'Nhận mã SMS'}</button>
        </form> : <form onSubmit={verifyCode} className="space-y-3">
          <p className="text-xs text-stone-600">Đã yêu cầu SMS tới {phone}. Nhập mã xác nhận 6 chữ số:</p>
          <input aria-label="Mã xác thực SMS" inputMode="numeric" maxLength={6} pattern="[0-9]{6}" value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,''))} autoComplete="one-time-code" className="w-full p-3 border rounded-xl tracking-[0.3em] text-center text-xl" placeholder="000000" required/>
          <button type="submit" disabled={loading||otp.length!==6} className="w-full bg-[#1b4332] text-white rounded-xl p-3.5 text-sm font-bold disabled:opacity-50">{loading?'Đang xác minh...':'Xác nhận và đăng nhập'}</button>
          <button type="button" className="text-xs text-emerald-800 font-bold flex items-center gap-1" onClick={()=>{setConfirmation(null);setOtp('');setNotice('')}}><ArrowLeft className="w-4 h-4"/> Đổi số điện thoại</button>
        </form>}
        <div id="mocchau-phone-recaptcha"/>
        <p className="mt-3 text-xs text-stone-500">Xác thực bằng OTP của Firebase. Cần bật Phone Authentication, cấu hình reCAPTCHA và tên miền được phép.</p>
      </> : <form onSubmit={submitEmail} className="space-y-3">
        {mode==='register'&&<><label className="block text-xs font-bold">Họ và tên *<input required maxLength={100} autoComplete="name" value={name} onChange={e=>setName(e.target.value)} className="mt-1 w-full p-3 border rounded-xl text-sm"/></label>
        <label className="block text-xs font-bold">Số điện thoại liên hệ (không dùng để đăng nhập email)<input inputMode="tel" autoComplete="tel" value={phone} onChange={e=>setPhone(e.target.value)} className="mt-1 w-full p-3 border rounded-xl text-sm" placeholder="09xxxxxxxx"/></label></>}
        <label className="block text-xs font-bold">Email *<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 w-full p-3 border rounded-xl text-sm" placeholder="email@example.com"/></label>
        {mode!=='forgot'&&<label className="block text-xs font-bold">Mật khẩu *<input required minLength={mode==='register'?8:1} type="password" autoComplete={mode==='register'?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 w-full p-3 border rounded-xl text-sm" placeholder="••••••••"/></label>}
        <button type="submit" disabled={loading} className="w-full bg-[#1b4332] text-white rounded-xl p-3.5 text-sm font-bold disabled:opacity-50">{loading?'Đang xử lý...':mode==='register'?'Tạo tài khoản':mode==='forgot'?'Gửi email đặt lại mật khẩu':'Đăng nhập'}</button>
      </form>}
      {error&&<p role="alert" className="mt-3 bg-red-50 text-red-800 p-3 rounded-xl text-xs">{error}</p>}
      {notice&&<p role="status" className="mt-3 bg-emerald-50 text-emerald-900 p-3 rounded-xl text-xs">{notice}</p>}
      {mode!=='forgot'&&<button disabled={loading} onClick={signInGoogle} className="w-full border rounded-xl p-3 text-sm font-bold mt-3 hover:bg-stone-50">Tiếp tục với Google</button>}
      <div className="flex flex-wrap gap-3 justify-center mt-4 text-xs font-bold text-emerald-700">
        <button onClick={()=>{setMode(mode==='register'?'login':'register');setConfirmation(null);setError('');setNotice('')}}>{mode==='register'?'Đã có tài khoản? Đăng nhập':'Chưa có tài khoản? Đăng ký'}</button>
        <button onClick={()=>{setMode(mode==='forgot'?'login':'forgot');setMethod('email');setError('');setNotice('')}}>{mode==='forgot'?'Quay lại đăng nhập':'Quên mật khẩu?'}</button>
      </div>
      <p className="mt-3 text-[11px] text-stone-600">Nếu đã có tài khoản bằng email, hãy đăng nhập bằng email để giữ lịch sử và voucher. Đăng nhập số điện thoại chưa tự liên kết với tài khoản email trước đó.</p>
      <p className="mt-2 flex items-start gap-2 text-[11px] text-stone-500"><ShieldCheck className="w-4 h-4 shrink-0"/> Quyền quản trị cần được cấp bằng Firebase custom claims. Không dùng mật khẩu Admin cố định trên giao diện.</p>
    </div>
  </div>;
}
