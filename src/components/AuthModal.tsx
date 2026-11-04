import React, { useEffect, useState } from 'react';
import {
  GoogleAuthProvider, createUserWithEmailAndPassword, getIdTokenResult,
  reload, sendEmailVerification, sendPasswordResetEmail, signInWithCustomToken,
  signInWithEmailAndPassword, signInWithPopup, updateProfile,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { X, UserRound, TicketPercent, ShieldCheck, Mail, Smartphone, ArrowLeft } from 'lucide-react';
import { auth, db } from '../firebase';
import {getEmailForPhone,hasOperatorAccess,normalizeVietnamPhone,rememberPhoneEmail} from '../lib/simpleAuth';
import { User } from '../types';
import { ensureMemberWelcomeBonus } from '../lib/memberWelcomeBonus';

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
  const phoneReady = true; // Device-local SĐT alias; Firebase verifies all passwords.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  // Stop browsers from placing a saved phone number in the Email field or
  // filling a password before the visitor deliberately focuses its input.
  const [emailEditable,setEmailEditable] = useState(false);
  const [phoneEditable,setPhoneEditable] = useState(false);
  const [passwordEditable,setPasswordEditable] = useState(false);
  const clearInputs = () => {
    setEmail('');setPhone('');setPassword('');setName('');
    setEmailEditable(false);setPhoneEditable(false);setPasswordEditable(false);
  };

  useEffect(() => {
    if (!isOpen) {
      clearInputs();
      setMode('login');
      setMethod('email');
      setPendingVerification(false);
      setError('');
      setNotice('');
    }
  }, [isOpen]);
  if (!isOpen) return null;

  const changeMethod = (value: LoginMethod) => {
    if (value === 'phone' && !phoneReady) return;
    clearInputs();
    setMethod(value);
    setError('');
    setNotice('');
    setPendingVerification(false);
  };
  const errorMessage = (e: any) => {
    const code = String(e?.code || '');
    if (code.includes('invalid-email')) return 'Vui lòng nhập địa chỉ email hợp lệ, không nhập số điện thoại vào ô Email.';
    if (code.includes('operation-not-allowed')) return 'Email/Password chưa được bật trong Firebase Authentication.';
    if (code.includes('invalid-credential') || code.includes('wrong-password')) return 'Email hoặc mật khẩu không đúng. Nếu đây là tài khoản cũ, hãy dùng Khôi phục mật khẩu.';
    if (code.includes('email-already-in-use')) return 'Email này đã có tài khoản. Hãy đăng nhập.';
    if (code.includes('weak-password')) return 'Mật khẩu cần đủ mạnh, tối thiểu 8 ký tự.';
    if (code.includes('too-many-requests')) return 'Đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.';

    if (code.includes('popup-closed-by-user')) return 'Bạn đã đóng cửa sổ Google. Vui lòng thử lại.';
    return e?.message || 'Không thể đăng nhập. Vui lòng thử lại.';
  };
  const finish = async (account: any, preferredName?: string, preferredPhone?: string) => {
    const token = await getIdTokenResult(account, true);
    const isAdmin = hasOperatorAccess(token, account.email);
    // The initial +10 must be committed together with the new member profile,
    // not added to a stale UI counter or rewritten at every Google login.
    const { profile } = await ensureMemberWelcomeBonus(account, {
      preferredName, preferredPhone, isAdmin
    });
    onLoginSuccess({ ...profile, role: isAdmin ? 'operator' : 'customer' });
    onClose();
  };
  const linkPhone = async (account: any, rawPhone: string) => {
    const number = normalizeVietnamPhone(rawPhone);
    if (!number) throw new Error('Số điện thoại Việt Nam không hợp lệ.');
    if (!account.emailVerified || !account.email) throw new Error('Hãy xác minh email trước để dùng SĐT đăng nhập trên thiết bị này.');
    rememberPhoneEmail(number,account.email);
  };
  const verifyEmail = async () => {
    setLoading(true); setError(''); setNotice('');
    try {
      const account = auth.currentUser;
      if (!account) throw new Error('Phiên đăng ký đã hết. Vui lòng đăng nhập bằng email.');
      await reload(account);
      if (!account.emailVerified) {
        setNotice('Email chưa được xác minh. Hãy bấm liên kết trong email khôi phục rồi quay lại đây.');
        return;
      }
      await linkPhone(account, phone);
      setPendingVerification(false);
      await finish(account, name.trim(), phone.trim());
    } catch(e) { setError(errorMessage(e)); } finally { setLoading(false); }
  };
  const submitEmail = async (event: React.FormEvent) => {
    event.preventDefault(); setLoading(true); setError(''); setNotice('');
    try {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        throw new Error('Ô Email phải là địa chỉ email hợp lệ; số điện thoại nhập ở tab Số điện thoại.');
      }
      if (mode === 'forgot') {
        if (!email.trim()) throw new Error('Vui lòng nhập email đã đăng ký.');
        await sendPasswordResetEmail(auth, email.trim());
        setNotice('Nếu email có tài khoản, hướng dẫn đặt lại mật khẩu đã được gửi.');
      } else if (mode === 'register') {
        if (name.trim().length < 2) throw new Error('Vui lòng nhập họ tên.');
        if (!normalizePhone(phone)) throw new Error('Vui lòng nhập số điện thoại Việt Nam hợp lệ.');
        if (password.length < 8) throw new Error('Mật khẩu cần ít nhất 8 ký tự.');
        const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(result.user, {displayName: name.trim()});
        // Also award the one-time welcome bonus for email + password members.
        // Google users enter through finish(), both paths share one transaction.
        await ensureMemberWelcomeBonus(result.user, {
          preferredName: name.trim(), preferredPhone: phone.trim(), isAdmin: false
        });
        await sendEmailVerification(result.user);
        if (phoneReady) {
          setPendingVerification(true);
          setNotice('Tài khoản đã được tạo. Hãy mở email khôi phục, bấm liên kết xác minh, rồi quay lại nhấn "Tôi đã xác minh email" để bật đăng nhập bằng số điện thoại.');
        } else {
          // Never block email accounts just because the optional server-only phone API is unavailable.
          await finish(result.user, name.trim(), phone.trim());
        }
      } else {
        const result = await signInWithEmailAndPassword(auth, email.trim(), password);
        if (result.user.emailVerified) {
          try {
            const snap = await getDoc(doc(db,'users',result.user.uid));
            const savedPhone = snap.data()?.phone;
            if (typeof savedPhone === 'string' && normalizePhone(savedPhone)) await linkPhone(result.user, savedPhone);
          } catch (e) {
            // Phone-alias API may not yet be configured. Email login must remain usable.
            console.warn('[Auth] Phone alias not activated; email login is still available.');
          }
        }
        await finish(result.user);
      }
    } catch (e) { setError(errorMessage(e)); } finally { setLoading(false); }
  };
  const submitPhone = async (event: React.FormEvent) => {
    event.preventDefault();
    if (mode === 'register') { await submitEmail(event); return; }
    setLoading(true); setError(''); setNotice('');
    try {
      const number = normalizeVietnamPhone(phone);
      if (!number) throw new Error('Vui lòng nhập số điện thoại Việt Nam hợp lệ.');
      const associatedEmail = getEmailForPhone(number);
      if (!associatedEmail) {
        throw new Error('Thiết bị này chưa liên kết SĐT với email. Vui lòng đăng nhập bằng email một lần, sau đó sử dụng SĐT + mật khẩu.');
      }
      if (mode === 'forgot') {
        await sendPasswordResetEmail(auth, associatedEmail);
        setNotice('Nếu tài khoản tồn tại, Firebase đã gửi hướng dẫn đặt lại mật khẩu qua email đã đăng ký.');
      } else {
        if (!password) throw new Error('Vui lòng nhập mật khẩu.');
        const account = await signInWithEmailAndPassword(auth, associatedEmail, password);
        await finish(account.user);
      }
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
          <p className="text-xs text-stone-500 mt-1">Đăng ký hội viên mới nhận 10 điểm chào mừng. Giảm giá áp dụng từ đơn thứ hai.</p></div>
      </div>
      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 mb-4 flex gap-2 items-start">
        <TicketPercent className="w-5 h-5 text-emerald-700 shrink-0"/>
        <p className="text-xs text-emerald-950">Thành viên có thể sử dụng voucher <strong>khi có chương trình đủ điều kiện.</strong></p>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-4" role="group" aria-label="Chọn cách đăng nhập">
        <button type="button" disabled={!phoneReady} title={!phoneReady?'Chức năng SĐT sẽ mở khi máy chủ xác thực được cấu hình. Hiện có thể đăng nhập bằng email hoặc Google.':undefined} onClick={()=>changeMethod('phone')} className={"rounded-xl border p-3 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed " + (method==='phone'?'border-emerald-700 bg-emerald-50 text-emerald-900':'text-stone-600')}><Smartphone className="w-4 h-4"/> Số điện thoại{!phoneReady && <span className="text-[9px] font-semibold">(sắp có)</span>}</button>
        <button type="button" onClick={()=>changeMethod('email')} className={"rounded-xl border p-3 text-sm font-bold flex items-center justify-center gap-2 " + (method==='email'?'border-emerald-700 bg-emerald-50 text-emerald-900':'text-stone-600')}><Mail className="w-4 h-4"/> Email</button>
      </div>
      <form key={mode+':'+method} autoComplete="off" onSubmit={method==='phone' ? submitPhone : submitEmail} className="space-y-3">
        {mode==='register'&&<label className="block text-xs font-bold">Họ và tên *<input required value={name} onChange={e=>setName(e.target.value)} maxLength={100} autoComplete="name" className="mt-1 w-full p-3 border rounded-xl text-sm" placeholder="Tên của bạn"/></label>}
        {(method==='phone'||mode==='register')&&<label className="block text-xs font-bold">Số điện thoại {mode==='register'?'đăng nhập':''} *<input type="tel" name={mode==='register'?'new_member_phone':'member_phone'} required inputMode="tel" autoComplete="off" readOnly={!phoneEditable} onFocus={()=>setPhoneEditable(true)} value={phone} onChange={e=>setPhone(e.target.value)} className="mt-1 w-full p-3 border rounded-xl text-sm" placeholder="09xxxxxxxx"/></label>}
        {(method==='email'||mode==='register')&&<label className="block text-xs font-bold">{mode==='register'?'Email để xác minh và lấy lại mật khẩu':'Email'} *<input required type="email" inputMode="email" name={mode==='register'?'new_member_contact_email':mode==='forgot'?'member_recovery_email':'member_login_email'} autoComplete="off" readOnly={!emailEditable} onFocus={()=>setEmailEditable(true)} value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 w-full p-3 border rounded-xl text-sm" placeholder="email@example.com"/></label>}
        {mode!=='forgot'&&<label className="block text-xs font-bold">Mật khẩu *<input required minLength={mode==='register'?8:1} type="password" name={mode==='register'?'new_member_password':'member_password'} autoComplete="new-password" readOnly={!passwordEditable} onFocus={()=>setPasswordEditable(true)} value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 w-full p-3 border rounded-xl text-sm" placeholder="Ít nhất 8 ký tự khi đăng ký"/></label>}
        <button type="submit" disabled={loading||(mode==='register'&&pendingVerification)} className="w-full bg-[#1b4332] text-white rounded-xl p-3.5 text-sm font-bold disabled:opacity-50">{loading?'Đang xử lý...':mode==='register'?(pendingVerification?'Đã gửi email xác minh':'Tạo tài khoản'):mode==='forgot'?'Gửi hướng dẫn đặt lại mật khẩu':'Đăng nhập'}</button>
      </form>
      {mode==='register'&&pendingVerification&&<button type="button" onClick={verifyEmail} disabled={loading} className="w-full mt-3 border-2 border-emerald-700 text-emerald-900 p-3 rounded-xl text-sm font-bold disabled:opacity-50">Tôi đã xác minh email</button>}
      <p className="mt-2 text-xs text-stone-500">{mode==='forgot'?'Nhập SĐT đã liên kết hoặc email đã đăng ký. Hệ thống gửi liên kết đặt lại mật khẩu qua email, không dùng SMS.':mode==='register'?'Bạn cần xác minh email một lần để liên kết SĐT với thiết bị này. Đổi thiết bị, đăng nhập email một lần.':phoneReady?'Đăng nhập SĐT + mật khẩu trên thiết bị đã liên kết email; đổi thiết bị cần đăng nhập email một lần. Không dùng SMS.':'Hiện hỗ trợ đăng nhập bằng email hoặc Google. Đăng nhập SĐT sẽ được mở khi máy chủ xác thực sẵn sàng.'}</p>
      {error&&<p role="alert" className="mt-3 bg-red-50 text-red-800 p-3 rounded-xl text-xs">{error}</p>}
      {notice&&<p role="status" className="mt-3 bg-emerald-50 text-emerald-900 p-3 rounded-xl text-xs">{notice}</p>}
      {mode!=='forgot'&&<button disabled={loading} onClick={signInGoogle} className="w-full border rounded-xl p-3 text-sm font-bold mt-3 hover:bg-stone-50">Tiếp tục với Google</button>}
      <div className="flex flex-wrap gap-3 justify-center mt-4 text-xs font-bold text-emerald-700">
        <button onClick={()=>{clearInputs();setMode(mode==='register'?'login':'register');setPendingVerification(false);setError('');setNotice('')}}>{mode==='register'?'Đã có tài khoản? Đăng nhập':'Chưa có tài khoản? Đăng ký'}</button>
        <button onClick={()=>{clearInputs();setMode(mode==='forgot'?'login':'forgot');setPendingVerification(false);setError('');setNotice('')}}>{mode==='forgot'?'Quay lại đăng nhập':'Quên mật khẩu?'}</button>
      </div>
      <p className="mt-3 text-[11px] text-stone-600">Firebase xác thực mật khẩu thật. SĐT chỉ là tên đăng nhập ghi nhớ trên thiết bị này; dùng email một lần khi đổi thiết bị. Không dùng mật khẩu cố định trong mã nguồn.</p>
      <p className="mt-2 flex items-start gap-2 text-[11px] text-stone-500"><ShieldCheck className="w-4 h-4 shrink-0"/> Quyền quản trị xác minh bằng tài khoản chủ sở hữu đã xác thực hoặc quyền Firebase được cấp hợp lệ. Không lưu mật khẩu Admin trong giao diện.</p>
    </div>
  </div>;
}
