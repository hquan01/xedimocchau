import React, {useState} from 'react';
import {GoogleAuthProvider, createUserWithEmailAndPassword, getIdTokenResult, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup, updateProfile} from 'firebase/auth';
import {doc, getDoc, setDoc} from 'firebase/firestore';
import {X, UserRound, TicketPercent, ShieldCheck} from 'lucide-react';
import {auth, db} from '../firebase';
import {User} from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  users?: User[];
}

type Mode = 'login'|'register'|'forgot';

/** Login must be authenticated by Firebase. Never accept a locally stored role/password. */
export default function AuthModal({isOpen,onClose,onLoginSuccess}:AuthModalProps) {
  const [mode,setMode]=useState<Mode>('login');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [name,setName]=useState('');
  const [phone,setPhone]=useState('');
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');

  if (!isOpen) return null;
  const finish=async (account: any, preferredName?: string, preferredPhone?: string) => {
    const token = await getIdTokenResult(account, true);
    const isAdmin = token.claims.admin === true || token.claims.operator === true;
    const ref = doc(db,'users',account.uid);
    const snapshot=await getDoc(ref);
    const old = snapshot.exists()?snapshot.data():{};
    const profile: User = {
      id:account.uid,
      email:account.email||'',
      name:preferredName||old.name||account.displayName||account.email||'Thành viên',
      phone:preferredPhone||old.phone||account.phoneNumber||'',
      points:typeof old.points==='number'?old.points:0,
      role:isAdmin?'operator':'customer'
    };
    // Unprivileged registrations never grant themselves operator rights or welcome points.
    if(!snapshot.exists()) await setDoc(ref,{...profile,role:'customer',points:0,createdAt:new Date().toISOString()});
    onLoginSuccess(profile);
    onClose();
  };
  const submit=async (e: React.FormEvent)=>{
    e.preventDefault();setLoading(true);setError('');setNotice('');
    try {
      if (mode==='forgot') {
        if (!email.trim()) throw new Error('Vui lòng nhập email.');
        await sendPasswordResetEmail(auth,email.trim());
        setNotice('Nếu email hợp lệ, hướng dẫn đặt lại mật khẩu đã được gửi.');
      } else if (mode==='register') {
        if(name.trim().length<2) throw new Error('Vui lòng nhập họ tên của bạn.');
        if(phone.trim()&&!/^(?:\+84|84|0)[35789]\d{8}$/.test(phone.replace(/[\s.\-]/g,''))) throw new Error('Số điện thoại không hợp lệ.');
        if(password.length<8) throw new Error('Mật khẩu tối thiểu 8 ký tự.');
        const r=await createUserWithEmailAndPassword(auth,email.trim(),password);
        await updateProfile(r.user,{displayName:name.trim()});
        await finish(r.user,name.trim(),phone.trim());
      } else {
        const r=await signInWithEmailAndPassword(auth,email.trim(),password);
        await finish(r.user);
      }
    } catch(e:any) {
      const code=e?.code||'';
      setError(code.includes('email-already-in-use')?'Email đã có tài khoản. Hãy đăng nhập.':code.includes('invalid-credential')?'Email hoặc mật khẩu không đúng.':code.includes('popup-closed')?'Cửa sổ đăng nhập đã đóng.':e?.message||'Không thể kết nối, vui lòng thử lại.');
    } finally {setLoading(false)}
  };
  const google=async()=>{setLoading(true);setError('');try{const r=await signInWithPopup(auth,new GoogleAuthProvider());await finish(r.user)}catch(e:any){setError(e?.message||'Không thể đăng nhập Google.')}finally{setLoading(false)}};
  return <div className="fixed inset-0 z-[150] bg-stone-950/70 p-3 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Tài khoản thành viên">
    <div className="bg-white w-full max-w-md max-h-[93dvh] overflow-auto rounded-3xl p-5 sm:p-7 shadow-2xl text-left relative">
      <button onClick={onClose} aria-label="Đóng" className="absolute top-4 right-4 text-stone-500 p-2 rounded-xl hover:bg-stone-100"><X className="w-5 h-5"/></button>
      <div className="flex gap-3 items-center mb-3"><div className="bg-emerald-50 rounded-2xl p-3"><UserRound className="w-7 h-7 text-emerald-700"/></div><div><h2 className="text-xl font-black text-[#1b4332]">{mode==='register'?'Đăng ký thành viên':mode==='forgot'?'Khôi phục mật khẩu':'Đăng nhập Mộc Châu Travel'}</h2><p className="text-xs text-stone-500">Đặt xe, lưu vé và quản lý ưu đãi của bạn</p></div></div>
      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 mb-4 flex gap-2 items-start"><TicketPercent className="w-5 h-5 text-emerald-700 shrink-0"/><p className="text-xs text-emerald-950">Thành viên có thể sử dụng voucher QT Limousine <strong>khi có chương trình đủ điều kiện</strong>. Ưu đãi không tự phát sinh khi đăng ký.</p></div>
      <form onSubmit={submit} className="space-y-3">
        {mode==='register'&&<><label className="block text-xs font-bold">Họ và tên *<input required maxLength={100} autoComplete="name" value={name} onChange={e=>setName(e.target.value)} className="mt-1 w-full p-3 border rounded-xl text-sm" placeholder="Tên của bạn"/></label><label className="block text-xs font-bold">Số điện thoại liên hệ<input inputMode="tel" autoComplete="tel" value={phone} onChange={e=>setPhone(e.target.value)} className="mt-1 w-full p-3 border rounded-xl text-sm" placeholder="09xxxxxxxx"/></label></>}
        <label className="block text-xs font-bold">Email *<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 w-full p-3 border rounded-xl text-sm" placeholder="email@example.com"/></label>
        {mode!=='forgot'&&<label className="block text-xs font-bold">Mật khẩu *<input required minLength={mode==='register'?8:1} type="password" autoComplete={mode==='register'?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 w-full p-3 border rounded-xl text-sm" placeholder="••••••••"/></label>}
        {error&&<p role="alert" className="bg-red-50 text-red-800 p-3 rounded-xl text-xs">{error}</p>}
        {notice&&<p role="status" className="bg-emerald-50 text-emerald-900 p-3 rounded-xl text-xs">{notice}</p>}
        <button disabled={loading} type="submit" className="w-full rounded-xl bg-[#1b4332] text-white p-3.5 font-extrabold text-sm disabled:opacity-50">{loading?'Đang xử lý...':mode==='register'?'Tạo tài khoản':mode==='forgot'?'Gửi email khôi phục':'Đăng nhập'}</button>
      </form>
      {mode!=='forgot'&&<button disabled={loading} onClick={google} className="w-full border rounded-xl p-3 text-sm font-bold mt-3 hover:bg-stone-50">Tiếp tục với Google</button>}
      <div className="flex flex-wrap gap-3 justify-center mt-4 text-xs font-bold text-emerald-700"><button onClick={()=>{setMode(mode==='register'?'login':'register');setError('');setNotice('')}}>{mode==='register'?'Đã có tài khoản? Đăng nhập':'Chưa có tài khoản? Đăng ký'}</button><button onClick={()=>{setMode(mode==='forgot'?'login':'forgot');setError('');setNotice('')}}>{mode==='forgot'?'Quay lại đăng nhập':'Quên mật khẩu?'}</button></div>
      <p className="mt-4 flex gap-2 text-[11px] text-stone-500"><ShieldCheck className="w-4 h-4 shrink-0"/>Đăng nhập qua Firebase Authentication, không lưu mật khẩu vào trình duyệt hoặc Firestore.</p>
    </div>
  </div>;
}
