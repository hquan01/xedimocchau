/**
 * Isolated end-to-end data/API preview. It intentionally does NOT substitute
 * for all legacy customer-facing screens, which still use Firebase.
 * Never point this to real customer records without reviewing security rules.
 */
import GithubOperatorPanel from './GithubOperatorPanel';
import {useEffect,useState} from 'react';
import {gh} from '../client/githubApi';
import {ShieldCheck,Database,LogOut,Plus,Trash2,RefreshCw,Save,AlertTriangle,CheckCircle,Lock,Users,ExternalLink} from 'lucide-react';

const collections=[
  ['tour_combos','Combo'],['accommodations','Lưu trú'],['guide_articles','Bài viết'],
  ['destinations','Địa điểm'],['restaurants','Nhà hàng'],['flower_seasons','Mùa hoa'],
  ['partners','Đối tác'],['taxi_fleet','Taxi'],['motorbike_fleet','Xe máy'],
  ['ai_faqs','Kiến thức AI'],['site_content','Giao diện trang chủ'],
  ['coupons','Voucher'],['bookings','Đặt vé'],['service_requests','Yêu cầu dịch vụ'],
  ['users','Hội viên'],['notifications','Thông báo'],['zalo_groups','Nhóm Zalo']
] as const;
export default function GithubBackendPreview(){
  const [ready,setReady]=useState<boolean|null>(null),[account,setAccount]=useState<any>(null);
  const [adminPassword,setAdminPassword]=useState(''),[loginEmail,setLoginEmail]=useState(''),[loginPassword,setLoginPassword]=useState('');
  const [regName,setRegName]=useState(''),[regPhone,setRegPhone]=useState('');
  const [mode,setMode]=useState<'admin'|'member'|'register'>('admin');
  const [collection,setCollection]=useState('tour_combos'),[items,setItems]=useState<any[]>([]),[selected,setSelected]=useState<string>(''),[editor,setEditor]=useState('{}');
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const isAdmin=account?.role==='operator';
  useEffect(()=>{
    gh.status().then(x=>setReady(x.configured)).catch(e=>{setReady(false);setError(e.message)});
    gh.me().then(x=>setAccount(x.user)).catch(e=>setError(e.message));
  },[]);
  const execute=async(fn:()=>Promise<any>,message:string)=>{
    setBusy(true);setError('');setNotice('');
    try{const result=await fn();setNotice(message);return result;}catch(e:any){setError(e.message||String(e));return null;}finally{setBusy(false);}
  };
  const refresh=()=>execute(async()=>{
    const result=await gh.list(collection);setItems(result.items||[]);setSelected('');setEditor('{}');
  },'Đã tải dữ liệu thực từ GitHub.');
  useEffect(()=>{if(account){setItems([]);gh.list(collection).then(x=>setItems(x.items||[])).catch(e=>setError(e.message));}},[collection,account?.id]);
  const save=async()=>{
    let parsed:any;
    try{parsed=JSON.parse(editor);if(!parsed||Array.isArray(parsed)||typeof parsed!=='object')throw new Error();}
    catch{setError('JSON không hợp lệ.');return;}
    const result=await execute(async()=>{
      if(selected)return gh.patch(collection,selected,parsed);
      if(!parsed.id)parsed.id='id_'+crypto.randomUUID().replace(/-/g,'');
      return gh.create(collection,parsed);
    },selected?'Đã lưu thay đổi lên GitHub.':'Đã thêm dữ liệu lên GitHub.');
    if(result)refresh();
  };
  const remove=async(id:string)=>{
    if(!confirm(`Bạn chắc chắn muốn xóa mục ${id}? Dữ liệu đã xóa có thể còn trong lịch sử Git.`))return;
    const result=await execute(()=>gh.remove(collection,id),'Đã xóa trên GitHub.');
    if(result)refresh();
  };
  const login=async()=>{
    const result=await execute(()=>mode==='admin'?gh.admin(adminPassword):mode==='member'?gh.login(loginEmail,loginPassword):gh.register(loginEmail,loginPassword,regName,regPhone),'Đăng nhập thành công.');
    if(result){setAccount(result.user);setAdminPassword('');setLoginPassword('');}
  };
  const logout=async()=>{await execute(()=>gh.logout(),'Đã đăng xuất.');setAccount(null);setItems([]);};
  if(isAdmin) return <GithubOperatorPanel account={account} onLogout={logout}/>;
  return <main className="min-h-screen bg-stone-50 text-stone-900 pb-16 font-sans">
    <header className="bg-[#1b4332] text-white p-4 sm:p-6"><div className="max-w-6xl mx-auto flex gap-3 items-center justify-between">
      <div className="flex items-center gap-3"><Database className="w-8 h-8"/><div><h1 className="text-lg sm:text-2xl font-black">QT Limousine · GitHub Data Preview</h1><p className="text-xs opacity-80">Môi trường thử nghiệm dữ liệu · Chưa thay thế website chính thức</p></div></div>
      <a href="/" className="flex items-center gap-1 text-sm underline"><ExternalLink className="w-4 h-4"/>Trang chủ</a>
    </div></header>
    <div className="max-w-6xl mx-auto px-4 pt-5 space-y-4">
      <div className="rounded-xl p-3 border border-amber-200 bg-amber-50 text-amber-950 text-sm flex gap-2"><AlertTriangle className="w-5 h-5 shrink-0"/><p>Đây là bản kiểm tra độc lập cho backend GitHub, <strong>không phải xác nhận toàn bộ màn hình cũ đã bỏ Firebase</strong>. Không nhập dữ liệu khách thật vào môi trường chưa được cấu hình và kiểm thử.</p></div>
      <div className={`p-3 rounded-xl text-sm border ${ready?'bg-emerald-50 border-emerald-200':'bg-rose-50 border-rose-200'}`}>
        {ready===null?'Đang kiểm tra kết nối GitHub…':ready?'✓ Máy chủ có cấu hình GitHub và mã hóa dữ liệu. Chưa xác nhận token có quyền ghi.':'⚠ Chưa cấu hình biến môi trường GitHub đầy đủ. Các thao tác sẽ bị từ chối an toàn.'}
      </div>
      {error&&<div className="rounded-xl border border-rose-300 bg-rose-50 text-rose-800 p-3 text-sm">{error}</div>}
      {notice&&<div className="rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 p-3 text-sm flex gap-2"><CheckCircle className="w-4 h-4 shrink-0"/>{notice}</div>}
      {!account?<section className="bg-white rounded-2xl shadow p-5 max-w-xl mx-auto space-y-4">
        <div className="flex gap-2 flex-wrap">{(['admin','member','register'] as const).map(x=><button key={x} onClick={()=>{setMode(x);setError('')}} className={`p-2 text-sm rounded-lg border font-semibold ${mode===x?'bg-emerald-900 text-white':'bg-white text-stone-700'}`}>{x==='admin'?'Admin':x==='member'?'Hội viên':'Đăng ký'}</button>)}</div>
        <h2 className="font-bold flex items-center gap-2"><Lock className="w-4 h-4"/>{mode==='admin'?'Đăng nhập quản trị GitHub':mode==='member'?'Đăng nhập hội viên':'Tạo hội viên (+10 điểm)'}</h2>
        {mode!=='admin'&&<input className="w-full border rounded-xl p-3" placeholder="Email" autoComplete="email" type="email" value={loginEmail} onChange={e=>setLoginEmail(e.target.value)}/>}
        {mode==='register'&&<><input className="w-full border rounded-xl p-3" placeholder="Họ tên" value={regName} onChange={e=>setRegName(e.target.value)}/><input className="w-full border rounded-xl p-3" placeholder="Số điện thoại" value={regPhone} onChange={e=>setRegPhone(e.target.value)}/></>}
        <input className="w-full border rounded-xl p-3" placeholder="Mật khẩu" type="password" autoComplete={mode==='register'?'new-password':'current-password'} value={mode==='admin'?adminPassword:loginPassword} onChange={e=>mode==='admin'?setAdminPassword(e.target.value):setLoginPassword(e.target.value)}/>
        <button disabled={busy||!ready} onClick={login} className="w-full bg-[#1b4332] text-white rounded-xl p-3 font-bold disabled:opacity-40">{busy?'Đang kiểm tra…':mode==='register'?'Đăng ký':'Đăng nhập'}</button>
        <p className="text-xs text-stone-500">Admin xác thực bằng mật khẩu máy chủ; hội viên dùng tài khoản mới lưu trên GitHub. Tài khoản Firebase cũ chưa được chuyển dữ liệu.</p>
      </section>:<>
        <section className="bg-white border rounded-2xl p-4 flex flex-wrap gap-3 justify-between items-center"><div className="flex gap-2 items-center"><ShieldCheck className="w-5 h-5 text-emerald-700"/><div className="text-sm font-bold">{account.name||account.email} <span className="text-stone-500 font-normal">({isAdmin?'Admin GitHub':'Hội viên'}{typeof account.points==='number'?` · ${account.points} điểm`:''})</span></div></div><button onClick={logout} className="border rounded-xl px-3 py-2 flex items-center gap-2"><LogOut className="w-4 h-4"/>Đăng xuất</button></section>
        <section className="bg-white border rounded-2xl p-4 space-y-3">
          <div className="flex gap-2 items-center"><Users className="w-5 h-5 text-emerald-800"/><h2 className="font-black">Kiểm tra đọc / thêm / sửa / xóa</h2></div>
          <div className="flex gap-2 flex-wrap"><select className="border rounded-xl p-3 flex-1 min-w-36" value={collection} onChange={e=>setCollection(e.target.value)}>{collections.map(([value,label])=><option key={value} value={value}>{label} ({value})</option>)}</select><button disabled={busy} onClick={refresh} className="border rounded-xl p-3 font-bold flex items-center gap-2"><RefreshCw className="w-4 h-4"/>Tải lại</button>{isAdmin&&<button onClick={()=>{setSelected('');setEditor(JSON.stringify({id:'id_'+crypto.randomUUID().replace(/-/g,''),name:'Mục mới'},null,2))}} className="rounded-xl p-3 bg-emerald-700 text-white font-bold flex items-center gap-2"><Plus className="w-4 h-4"/>Thêm</button>}</div>
          <p className="text-sm text-stone-500">{items.length} bản ghi đọc từ GitHub. Mỗi thao tác chỉ báo thành công khi API xác nhận.</p>
          <div className="grid md:grid-cols-2 gap-4"><div className="max-h-[400px] overflow-y-auto space-y-2">{items.map((item,i)=><div key={String(item.id||i)} className="border rounded-xl p-3 flex justify-between items-start gap-3"><button className="text-left flex-1 min-w-0" onClick={()=>{setSelected(String(item.id));setEditor(JSON.stringify(item,null,2))}}><div className="font-bold truncate">{String(item.name||item.title||item.passengerName||item.id||'Bản ghi')}</div><div className="font-mono text-xs text-stone-500 truncate">{String(item.id||'')}</div></button>{isAdmin&&<button title="Xóa" onClick={()=>remove(String(item.id))} className="text-rose-700 p-1"><Trash2 className="w-4 h-4"/></button>}</div>)}{!items.length&&<div className="rounded-xl border border-dashed p-6 text-sm text-stone-500">Danh mục chưa có dữ liệu hoặc bạn chưa có quyền xem.</div>}</div><div className="space-y-3"><label className="text-sm font-bold block">Dữ liệu JSON {selected?`· ${selected}`:'· bản ghi mới'}</label><textarea spellCheck={false} value={editor} onChange={e=>setEditor(e.target.value)} className="w-full h-[315px] border rounded-xl p-3 font-mono text-xs resize-y"/>{isAdmin&&<button disabled={busy||!ready} onClick={save} className="bg-[#1b4332] rounded-xl px-4 py-3 text-white font-bold flex items-center gap-2"><Save className="w-4 h-4"/>Lưu lên GitHub</button>}</div></div>
        </section>
      </>}
    </div>
  </main>
}
