import React, {useEffect, useState} from 'react';
import {EmailAuthProvider, getIdTokenResult, linkWithCredential, reload} from 'firebase/auth';
import {ShieldCheck, LockKeyhole} from 'lucide-react';
import {auth} from '../firebase';
import {isVerifiedOwnerToken} from '../lib/simpleAuth';

/**
 * Owner signs in through existing Google account once, then optionally links
 * a password to the SAME Firebase UID. Never embed any password in source.
 */
export default function AdminPasswordSetup() {
  const [ownerVerified,setOwnerVerified] = useState(false);
  const [hasPassword,setHasPassword] = useState(false);
  const [password,setPassword] = useState('');
  const [confirm,setConfirm] = useState('');
  const [busy,setBusy] = useState(false);
  const [notice,setNotice] = useState('');
  const [error,setError] = useState('');

  useEffect(()=>{
    let valid = true;
    const user = auth.currentUser;
    if(!user) return;
    getIdTokenResult(user,true).then(token=>{
      if(!valid) return;
      setOwnerVerified(isVerifiedOwnerToken(token));
      setHasPassword(user.providerData.some(p=>p.providerId==='password'));
    }).catch(()=>setOwnerVerified(false));
    return ()=>{valid=false};
  },[]);

  if(!ownerVerified) return null;
  const setup = async (event:React.FormEvent) => {
    event.preventDefault();setError('');setNotice('');
    if(password.length<8){setError('Mật khẩu phải có ít nhất 8 ký tự.');return}
    if(password!==confirm){setError('Hai lần nhập mật khẩu không giống nhau.');return}
    setBusy(true);
    try {
      const user = auth.currentUser;
      if(!user?.email) throw new Error('Hãy đăng nhập với Google của chủ website trước.');
      const token = await getIdTokenResult(user,true);
      if(!isVerifiedOwnerToken(token))throw new Error('Không đúng tài khoản chủ website đã xác minh.');
      await linkWithCredential(user,EmailAuthProvider.credential(user.email,password));
      await reload(user);
      setHasPassword(true);
      setPassword('');setConfirm('');
      setNotice('Đã thiết lập mật khẩu cho chính tài khoản quản lý hiện tại. Lần tới có thể dùng SĐT quản lý và mật khẩu vừa thiết lập.');
    } catch(e:any) {
      const code=String(e?.code||'');
      if(code.includes('provider-already-linked'))setError('Tài khoản đã có mật khẩu; bạn có thể đăng nhập bằng số quản lý và mật khẩu hiện có.');
      else if(code.includes('requires-recent-login'))setError('Vui lòng đăng xuất và đăng nhập lại bằng Google rồi thực hiện ngay.');
      else if(code.includes('email-already-in-use')||code.includes('credential-already-in-use'))setError('Địa chỉ email đã có tài khoản mật khẩu riêng. Không tự tạo tài khoản trùng; hãy liên hệ hỗ trợ để kiểm tra.');
      else setError(e?.message||'Chưa thể liên kết mật khẩu. Hãy thử đăng nhập Google lại.');
    } finally {setBusy(false)}
  };
  return <section className="mx-auto max-w-6xl px-3 sm:px-6 my-4">
    <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-4 sm:p-5 text-[#17382b]">
      <div className="flex items-center gap-2 font-black text-base"><ShieldCheck className="w-5 h-5 text-emerald-700"/> Đăng nhập quản lý không cần SMS</div>
      {hasPassword ? <p className="text-sm mt-2">Tài khoản quản lý đã liên kết mật khẩu. Bạn có thể đăng nhập bằng SĐT quản lý và mật khẩu đã thiết lập, hoặc tiếp tục dùng Google.</p> :
      <>
        <p className="text-sm mt-2">Bạn đang xác minh chủ website bằng tài khoản Google đã có. Nhập mật khẩu bạn muốn sử dụng để kích hoạt đăng nhập bằng SĐT quản lý. Mật khẩu sẽ được Firebase lưu an toàn, không đưa vào mã nguồn GitHub.</p>
        <form onSubmit={setup} className="mt-3 grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end">
          <label className="text-xs font-bold">Mật khẩu quản lý<input type="password" autoComplete="new-password" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)} className="block w-full mt-1 p-3 rounded-xl border border-stone-300"/></label>
          <label className="text-xs font-bold">Nhập lại mật khẩu<input type="password" autoComplete="new-password" required minLength={8} value={confirm} onChange={e=>setConfirm(e.target.value)} className="block w-full mt-1 p-3 rounded-xl border border-stone-300"/></label>
          <button type="submit" disabled={busy} className="px-5 py-3 rounded-xl bg-[#1b4332] text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2"><LockKeyhole className="w-4 h-4"/>{busy?'Đang lưu...':'Kích hoạt'}</button>
        </form>
      </>}
      {notice&&<p role="status" className="mt-2 text-sm text-emerald-800">{notice}</p>}
      {error&&<p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  </section>;
}
