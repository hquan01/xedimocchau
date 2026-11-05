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
import { gh } from '../client/githubApi';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  users?: User[];
  onGithubAdminSuccess?: (user: User) => void;
}

type Mode = 'login' | 'register' | 'forgot' | 'admin';
type LoginMethod = 'email' | 'phone';
const githubDataPreview=(import.meta as ImportMeta & {env?:Record<string,string>}).env?.VITE_DATA_PROVIDER==='github';
const normalizePhone = (s: string) => {
  const value = s.replace(/[\s.\-()]/g, '');
  if (/^0[35789]\d{8}$/.test(value)) return '+84' + value.slice(1);
  if (/^84[35789]\d{8}$/.test(value)) return '+' + value;
  if (/^\+84[35789]\d{8}$/.test(value)) return value;
  return null;
};

/** Only Firebase Auth verifies identities; Admin permissions must come from server-issued claims. */

export default function AuthModal({ isOpen, onClose, onLoginSuccess, onGithubAdminSuccess, users }: AuthModalProps) {
  const [mode, setMode] = useState<Mode>('login');
  const [method, setMethod] = useState<LoginMethod>('email');
  const phoneReady = true; // Device-local SĐT alias; Firebase verifies all passwords.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const clearInputs = () => {
    setEmail(''); setPhone(''); setPassword(''); setName('');
  };

  useEffect(() => {
    if (!isOpen) {
      clearInputs();
      setAdminPassword('');
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
    const code = String(e?.code || e?.message || '');
    if (code.includes('invalid-email')) return 'Vui lòng nhập địa chỉ email hợp lệ, không nhập số điện thoại vào ô Email.';
    if (code.includes('operation-not-allowed')) return 'Email/Password chưa được bật trong Firebase Authentication.';
    if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) return 'Email/SĐT hoặc mật khẩu không đúng. Nếu đây là tài khoản mới hoặc quên mật khẩu, hãy chọn Đăng ký hoặc Quên mật khẩu.';
    if (code.includes('email-already-in-use')) return 'Email này đã có tài khoản. Vui lòng chuyển sang tab Đăng nhập.';
    if (code.includes('weak-password')) return 'Mật khẩu cần tối thiểu 8 ký tự.';
    if (code.includes('too-many-requests')) return 'Đã thử quá nhiều lần. Vui lòng chờ ít phút rồi thử lại.';
    if (code.includes('popup-closed-by-user') || code.includes('cancelled-popup-request')) return 'Đã đóng cửa sổ đăng nhập Google. Vui lòng thử lại.';
    return e?.message || 'Không thể đăng nhập. Vui lòng kiểm tra lại thông tin.';
  };

  const finish = async (account: any, preferredName?: string, preferredPhone?: string) => {
    let isAdmin = false;
    try {
      const token = await getIdTokenResult(account, true);
      isAdmin = hasOperatorAccess(token, account.email);
    } catch {
      isAdmin = hasOperatorAccess(undefined, account.email);
    }

    let profile: User;
    try {
      const { profile: resProfile } = await ensureMemberWelcomeBonus(account, {
        preferredName, preferredPhone, isAdmin
      });
      profile = resProfile;
    } catch (e) {
      console.warn('[Auth] Firestore profile sync skipped (quota/offline fallback used):', e);
      profile = {
        id: account.uid,
        email: account.email || '',
        name: preferredName || account.displayName || account.email || 'Thành viên',
        phone: preferredPhone || account.phoneNumber || '',
        points: 10,
        welcomeBonusGranted: true,
        role: isAdmin ? 'operator' : 'customer'
      };
    }

    onLoginSuccess({ ...profile, role: isAdmin ? 'operator' : 'customer' });
    onClose();
  };

  const linkPhone = async (account: any, rawPhone: string) => {
    const number = normalizeVietnamPhone(rawPhone);
    if (!number) throw new Error('Số điện thoại Việt Nam không hợp lệ.');
    if (account.email) {
      rememberPhoneEmail(number, account.email);
    }
  };

  const verifyEmail = async () => {
    setLoading(true); setError(''); setNotice('');
    try {
      const account = auth.currentUser;
      if (!account) throw new Error('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại bằng email.');
      await reload(account);
      if (!account.emailVerified) {
        setNotice('Email chưa được xác minh. Vui lòng bấm liên kết trong email được gửi rồi nhấn lại nút bên dưới.');
        return;
      }
      await linkPhone(account, phone);
      setPendingVerification(false);
      await finish(account, name.trim(), phone.trim());
    } catch(e) { setError(errorMessage(e)); } finally { setLoading(false); }
  };

  const submitEmail = async (event: React.FormEvent) => {
    event.preventDefault(); setLoading(true); setError(''); setNotice('');
    const cleanEmail = email.trim().toLowerCase();
    try {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        throw new Error('Địa chỉ email không hợp lệ (ví dụ: member@gmail.com). Số điện thoại vui lòng nhập ở mục Số điện thoại.');
      }
      if(githubDataPreview){
        if(mode==='forgot'){
          setNotice('Để lấy lại mật khẩu tài khoản GitHub mới, vui lòng liên hệ nhà xe để xác minh và đặt lại. Không gửi mật khẩu qua tin nhắn.');
          return;
        }
        if(mode==='register'){
          if(name.trim().length<2)throw new Error('Vui lòng nhập họ tên.');
          const number=normalizePhone(phone);
          if(!number)throw new Error('Số điện thoại Việt Nam không hợp lệ.');
          if(password.length<8)throw new Error('Mật khẩu ít nhất 8 ký tự.');
          const result=await gh.register(cleanEmail,password,name.trim(),number);
          rememberPhoneEmail(number,cleanEmail);
          onLoginSuccess({...result.user,phone:number} as User);
          onClose();return;
        }
        const result=await gh.login(cleanEmail,password);
        onLoginSuccess(result.user as User);
        onClose();return;
      }
      if (mode === 'forgot') {
        await sendPasswordResetEmail(auth, cleanEmail);
        setNotice('Hướng dẫn đặt lại mật khẩu đã được gửi đến email ' + cleanEmail);
      } else if (mode === 'register') {
        if (name.trim().length < 2) throw new Error('Vui lòng nhập họ và tên của bạn.');
        if (!normalizePhone(phone)) throw new Error('Số điện thoại Việt Nam không hợp lệ (ví dụ: 0987654321).');
        if (password.length < 8) throw new Error('Mật khẩu cần ít nhất 8 ký tự.');
        
        const result = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        await updateProfile(result.user, { displayName: name.trim() });
        rememberPhoneEmail(phone.trim(), cleanEmail);

        try {
          await sendEmailVerification(result.user);
        } catch (verr) {
          console.warn('[Auth] Email verification dispatch error:', verr);
        }

        await finish(result.user, name.trim(), phone.trim());
      } else {
        const result = await signInWithEmailAndPassword(auth, cleanEmail, password);
        try {
          const snap = await getDoc(doc(db, 'users', result.user.uid));
          const savedPhone = snap.data()?.phone;
          if (typeof savedPhone === 'string' && normalizePhone(savedPhone)) {
            rememberPhoneEmail(savedPhone, cleanEmail);
          }
        } catch {
          // Fallback if Firestore read fails
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
      if (!number) throw new Error('Số điện thoại Việt Nam không hợp lệ (ví dụ: 0987654321).');
      
      let associatedEmail = getEmailForPhone(number);
      if (!associatedEmail && users && users.length > 0) {
        const match = users.find(u => u.phone && normalizeVietnamPhone(u.phone) === number);
        if (match?.email) {
          associatedEmail = match.email;
          rememberPhoneEmail(number, associatedEmail);
        }
      }

      if (!associatedEmail) {
        throw new Error('Số điện thoại này chưa được liên kết với email trên thiết bị. Vui lòng chuyển sang tab Email để đăng nhập một lần, hoặc chọn Đăng ký.');
      }

      if (mode === 'forgot') {
        await sendPasswordResetEmail(auth, associatedEmail);
        setNotice('Hướng dẫn đặt lại mật khẩu đã được gửi đến email đăng ký: ' + associatedEmail);
      } else {
        if (!password) throw new Error('Vui lòng nhập mật khẩu.');
        if(githubDataPreview) {
          const result=await gh.login(associatedEmail,password);
          onLoginSuccess(result.user as User);
          onClose();
        }else {
          const account = await signInWithEmailAndPassword(auth, associatedEmail, password);
          await finish(account.user);
        }
      }
    } catch (e) { setError(errorMessage(e)); } finally { setLoading(false); }
  };

  const signInGithubAdmin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (adminPassword.length < 8) throw new Error('Mật khẩu Admin cần ít nhất 8 ký tự.');
      const result = await gh.admin(adminPassword);
      if (result.user?.role !== 'operator') throw new Error('Máy chủ không xác nhận quyền Quản trị.');
      setAdminPassword('');
      onGithubAdminSuccess?.({ ...result.user, phone: '' } as User);
      onClose();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const signInGoogle = async () => {
    setLoading(true);setError('');
    try {
      if(githubDataPreview){
        // GitHub mode must never create accounts in Firebase.
        const clientId=(import.meta as ImportMeta & {env?:Record<string,string>}).env?.VITE_GOOGLE_CLIENT_ID;
        if(!clientId)throw new Error('Đăng nhập Google chưa được cấu hình cho hệ thống mới. Vui lòng dùng Email để đăng ký hoặc đăng nhập.');
        const credential=await new Promise<string>((resolve,reject)=>{
          const begin=()=>{
            const google=(window as any).google;
            if(!google?.accounts?.id)return reject(new Error('Không tải được đăng nhập Google.'));
            google.accounts.id.initialize({client_id:clientId,callback:(response:any)=>{
              if(response?.credential)resolve(String(response.credential));
              else reject(new Error('Google chưa trả thông tin xác minh.'));
            }});
            google.accounts.id.prompt((notice:any)=>{
              if(notice.isNotDisplayed?.()||notice.isSkippedMoment?.())reject(new Error('Trình duyệt chặn cửa sổ Google. Vui lòng dùng Email hoặc cho phép đăng nhập Google.'));
            });
          };
          if((window as any).google?.accounts?.id)return begin();
          const script=document.createElement('script');
          script.src='https://accounts.google.com/gsi/client';
          script.async=true;script.defer=true;
          script.onload=begin;script.onerror=()=>reject(new Error('Không tải được dịch vụ Google.'));
          document.head.appendChild(script);
        });
        const result=await gh.google(credential);
        onLoginSuccess(result.user as User);onClose();
      }else {
        const result=await signInWithPopup(auth,new GoogleAuthProvider());
        await finish(result.user);
      }
    }catch(e){setError(errorMessage(e));}
    finally{setLoading(false);}
  };

  return (
    <div className="fixed inset-0 z-[150] bg-stone-950/70 p-3 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Tài khoản Mộc Châu Travel">
      <div className="bg-white w-full max-w-md max-h-[93dvh] overflow-y-auto rounded-3xl p-5 sm:p-7 shadow-2xl text-left relative">
        <button onClick={onClose} aria-label="Đóng" className="absolute top-3 right-3 text-stone-600 p-2 rounded-xl hover:bg-stone-100"><X className="w-5 h-5"/></button>
        
        <div className="grid grid-cols-2 gap-2 mb-5 pr-8" role="group" aria-label="Chọn loại tài khoản">
          <button type="button" onClick={()=>{setMode('login');setError('');setNotice('');setAdminPassword('')}} aria-pressed={mode!=='admin'} className={`rounded-xl border p-2.5 text-sm font-bold ${mode!=='admin'?'bg-emerald-800 border-emerald-800 text-white':'border-stone-200 text-stone-700'}`}>Khách hàng</button>
          <button type="button" onClick={()=>{setMode('admin');setError('');setNotice('');clearInputs()}} aria-pressed={mode==='admin'} className={`rounded-xl border p-2.5 text-sm font-bold ${mode==='admin'?'bg-emerald-800 border-emerald-800 text-white':'border-stone-200 text-stone-700'}`}>Chủ xe / Quản trị</button>
        </div>
        {mode === 'admin' ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 pr-8"><ShieldCheck className="w-9 h-9 text-emerald-800"/><div><h2 className="text-xl font-black text-emerald-950">Đăng nhập Quản trị QT Limousine</h2><p className="text-xs text-stone-500 mt-1">Quản lý trực tiếp ngay trên trang chủ</p></div></div>
            <form onSubmit={signInGithubAdmin} className="space-y-3">
              <label className="block text-sm font-semibold text-stone-700">Mật khẩu Admin
                <input required type="password" minLength={8} autoComplete="current-password" value={adminPassword} onChange={e=>setAdminPassword(e.target.value)} placeholder="Tối thiểu 8 ký tự" className="mt-2 w-full rounded-xl border border-stone-300 p-3 focus:ring-2 focus:ring-emerald-600"/>
              </label>
              <button type="submit" disabled={loading} className="w-full bg-[#1b4332] text-white font-bold rounded-xl p-3 disabled:opacity-50">{loading?'Đang xác thực…':'Đăng nhập Quản trị'}</button>
            </form>
            {error&&<p role="alert" className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-sm">{error}</p>}
            <p className="text-xs text-stone-500">Xác thực an toàn qua máy chủ GitHub. Không dùng mã PIN công khai hoặc mật khẩu Firebase cũ.</p>
            <button type="button" onClick={()=>{setMode('login');setError('');setAdminPassword('')}} className="text-sm font-semibold text-emerald-800 underline">← Đăng nhập hội viên</button>
          </div>
        ) : (<>
        <div className="flex gap-3 items-center mb-3 pr-9">
          <div className="bg-emerald-50 rounded-2xl p-3 shrink-0"><UserRound className="w-7 h-7 text-emerald-700"/></div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-[#1b4332] leading-tight">
              {mode === 'register' ? 'Đăng ký thành viên' : mode === 'forgot' ? 'Khôi phục mật khẩu' : 'Đăng nhập Mộc Châu Travel'}
            </h2>
            <p className="text-xs text-stone-500 mt-1">Hội viên mới nhận ngay 10 điểm tích lũy chào mừng.</p>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 mb-4 flex gap-2 items-start">
          <TicketPercent className="w-5 h-5 text-emerald-700 shrink-0"/>
          <p className="text-xs text-emerald-950">Thành viên đăng nhập được ưu đãi tích điểm và giảm giá vé xe, phòng nghỉ.</p>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4" role="group" aria-label="Chọn cách đăng nhập">
          <button 
            type="button" 
            onClick={() => changeMethod('phone')} 
            className={"rounded-xl border p-3 text-sm font-bold flex items-center justify-center gap-2 " + (method === 'phone' ? 'border-emerald-700 bg-emerald-50 text-emerald-900' : 'text-stone-600 hover:bg-stone-50')}
          >
            <Smartphone className="w-4 h-4"/> Số điện thoại
          </button>
          <button 
            type="button" 
            onClick={() => changeMethod('email')} 
            className={"rounded-xl border p-3 text-sm font-bold flex items-center justify-center gap-2 " + (method === 'email' ? 'border-emerald-700 bg-emerald-50 text-emerald-900' : 'text-stone-600 hover:bg-stone-50')}
          >
            <Mail className="w-4 h-4"/> Email
          </button>
        </div>

        <form key={mode + ':' + method} onSubmit={method === 'phone' ? submitPhone : submitEmail} className="space-y-3">
          {mode === 'register' && (
            <label className="block text-xs font-bold text-stone-700">
              Họ và tên *
              <input 
                required 
                type="text"
                value={name} 
                onChange={e => setName(e.target.value)} 
                maxLength={100} 
                className="mt-1 w-full p-3 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600" 
                placeholder="Nguyễn Văn A"
              />
            </label>
          )}

          {(method === 'phone' || mode === 'register') && (
            <label className="block text-xs font-bold text-stone-700">
              Số điện thoại {mode === 'register' ? 'đăng ký' : ''} *
              <input 
                type="tel" 
                required 
                inputMode="tel" 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
                className="mt-1 w-full p-3 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600" 
                placeholder="0987654321"
              />
            </label>
          )}

          {(method === 'email' || mode === 'register') && (
            <label className="block text-xs font-bold text-stone-700">
              {mode === 'register' ? 'Email tài khoản' : mode === 'forgot' ? 'Email khôi phục' : 'Email'} *
              <input 
                required 
                type="email" 
                inputMode="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="mt-1 w-full p-3 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600" 
                placeholder="example@gmail.com"
              />
            </label>
          )}

          {mode !== 'forgot' && (
            <label className="block text-xs font-bold text-stone-700">
              Mật khẩu *
              <input 
                required 
                minLength={mode === 'register' ? 8 : 1} 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="mt-1 w-full p-3 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600" 
                placeholder={mode === 'register' ? 'Tối thiểu 8 ký tự' : 'Nhập mật khẩu'}
              />
            </label>
          )}

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-[#1b4332] hover:bg-[#143326] text-white rounded-xl p-3.5 text-sm font-bold shadow-sm transition disabled:opacity-50"
          >
            {loading ? 'Đang xử lý...' : mode === 'register' ? 'Tạo tài khoản' : mode === 'forgot' ? 'Gửi hướng dẫn đặt lại mật khẩu' : 'Đăng nhập'}
          </button>
        </form>

        {error && <p role="alert" className="mt-3 bg-red-50 text-red-800 p-3 rounded-xl text-xs font-medium border border-red-100">{error}</p>}
        {notice && <p role="status" className="mt-3 bg-emerald-50 text-emerald-900 p-3 rounded-xl text-xs font-medium border border-emerald-100">{notice}</p>}

        {mode !== 'forgot' && (
          <button 
            disabled={loading} 
            onClick={signInGoogle} 
            className="w-full border border-stone-300 rounded-xl p-3 text-sm font-bold mt-3 hover:bg-stone-50 transition flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            Tiếp tục với Google
          </button>
        )}

        <div className="flex flex-wrap gap-3 justify-center mt-4 text-xs font-bold text-emerald-700">
          <button onClick={() => { clearInputs(); setMode(mode === 'register' ? 'login' : 'register'); setPendingVerification(false); setError(''); setNotice(''); }}>
            {mode === 'register' ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'}
          </button>
          <button onClick={() => { clearInputs(); setMode(mode === 'forgot' ? 'login' : 'forgot'); setPendingVerification(false); setError(''); setNotice(''); }}>
            {mode === 'forgot' ? 'Quay lại đăng nhập' : 'Quên mật khẩu?'}
          </button>
        </div>

        <p className="mt-3 text-[11px] text-stone-500 leading-relaxed text-center">
          <ShieldCheck className="w-3.5 h-3.5 inline mr-1 text-emerald-700"/>
          Xác thực an toàn qua Firebase Auth. Hỗ trợ Đăng nhập Google, Email và SĐT.
        </p>
        </>)}
      </div>
    </div>
  );
}
