import {useCallback,useEffect,useMemo,useState} from 'react';
import {AlertCircle,ArrowLeft,BarChart3,CheckCircle2,ChevronDown,ClipboardCheck,Database,Download,Edit3,Eye,FileJson,KeyRound,Lock,LogOut,Menu,Plus,RefreshCw,Save,Search,ShieldCheck,Trash2,Users,X} from 'lucide-react';
import {gh} from '../client/githubApi';
import {ADMIN_NAV_GROUPS,ALL_ADMIN_MODULES} from './operator/AdminNavStructure';
import {GITHUB_ADMIN_MODULES,PUBLIC_CMS_COLLECTIONS,RECOMMENDED_FIELDS,FIXED_LABELS} from './operator/githubAdminModules';
import {INITIAL_ARTICLES} from '../data/articles';
import {INITIAL_DESTINATIONS} from '../data/destinations';
import {INITIAL_COMBOS} from '../data/combos';
import {INITIAL_ACCOMMODATIONS} from '../data/accommodations';
import {INITIAL_ZALO_GROUPS} from '../data/zaloGroups';
import {INITIAL_RESTAURANTS,INITIAL_FLOWER_SEASONS} from '../data/operatorDefaults';
import {DEFAULT_LIMOUSINE_CONFIG,DEFAULT_SHARED_CAR_CONFIG,INITIAL_LOCATIONS} from '../data/config';
import {defaultSiteContent} from '../data/defaultSiteContent';


type Row=Record<string,any>;
type ModuleChoice={collection:string;title:string;configId?:string;readOnly?:boolean};
const SEED:Record<string,Row[]>= {
 guide_articles:INITIAL_ARTICLES as Row[],destinations:INITIAL_DESTINATIONS as Row[],
 tour_combos:INITIAL_COMBOS as Row[],accommodations:INITIAL_ACCOMMODATIONS as Row[],
 zalo_groups:INITIAL_ZALO_GROUPS as Row[],restaurants:INITIAL_RESTAURANTS as Row[],
 flower_seasons:INITIAL_FLOWER_SEASONS as Row[],site_content:[{id:'public',...defaultSiteContent}]
};
const ADMIN_SPECIAL_FIELDS:Record<string,string[]>= {
 bookings:['pickupPoint','dropoffPoint','departureTime','travelDate','seatCount','totalPrice','depositAmount','operatorNotes','driverName','licensePlate'],
 users:['name','phone','operatorNotes'],
};
const IMMUTABLE=new Set(['id','passwordHash','guestHash','role','provider','userId','createdAt','welcomeBonusGranted','rewardedBookingIds','completedBookingsCount','pointsDeducted','paymentReportedAt']);
const money=(v:number)=>new Intl.NumberFormat('vi-VN').format(v)+'đ';
const downloadJSON=(name:string,items:Row[])=>{
 const blob=new Blob([JSON.stringify({generatedAt:new Date().toISOString(),records:items},null,2)],{type:'application/json;charset=utf-8'});
 const url=URL.createObjectURL(blob),node=document.createElement('a');node.href=url;node.download=name;document.body.appendChild(node);node.click();node.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
const displayName=(r:Row)=>String(r.title||r.name||r.passengerName||r.customerName||r.code||r.question||r.id||'Bản ghi');
const showError=(e:unknown)=>e instanceof Error?e.message:String(e);
const emptyRecord=(c:string,configId?:string):Row=>{
 const id=configId||'id_'+crypto.randomUUID().replace(/-/g,'');
 if(c==='configs'){
   if(configId==='limousineConfig')return {id,limousineConfig:DEFAULT_LIMOUSINE_CONFIG};
   if(configId==='sharedCarConfig')return {id,sharedCarConfig:DEFAULT_SHARED_CAR_CONFIG};
   if(configId==='locations')return {id,locations:INITIAL_LOCATIONS};
   return {id,name:configId||'Cấu hình mới',enabled:true};
 }
 if(c==='site_content'&&configId==='public')return {id:'public',...defaultSiteContent};
 if(c==='site_content')return {id,name:'Giao diện mới'};
 if(c==='bookings')return {id,type:'limousine',passengerName:'',passengerPhone:'',travelDate:new Date().toISOString().slice(0,10),status:'pending',totalPrice:0,paymentReported:false};
 const row:Row={id}; for(const key of (RECOMMENDED_FIELDS[c]||['name','description','visible'])){
  if(key==='id')continue; row[key]=['visible','active','available'].includes(key)?true:['totalPrice','price','seatCount','discountPercentage','amount','quotedPrice'].includes(key)?0:'';
 }return row;
};
function EditableField({name,value,onChange,disabled}: {name:string,value:any,onChange:(v:any)=>void,disabled?:boolean}){
 const label=FIXED_LABELS[name]||name;
 const box='w-full border border-stone-300 rounded-xl px-3 py-2.5 bg-white text-sm focus:ring-2 focus:ring-emerald-600 outline-none disabled:bg-stone-100';
 if(typeof value==='boolean')return <label className="flex gap-3 items-center p-3 border rounded-xl text-sm"><input disabled={disabled} type="checkbox" checked={value} onChange={e=>onChange(e.target.checked)} className="w-5 h-5"/><span className="font-semibold">{label}</span></label>;
 if(typeof value==='number')return <label className="block space-y-1"><span className="text-xs font-bold text-stone-600">{label}</span><input disabled={disabled} className={box} type="number" step="any" value={Number.isFinite(value)?value:0} onChange={e=>onChange(Number(e.target.value))}/></label>;
 if(Array.isArray(value)||value!==null&&typeof value==='object')return <label className="block space-y-1"><span className="text-xs font-bold text-stone-600">{label} (JSON)</span><textarea disabled={disabled} className={`${box} font-mono h-28`} defaultValue={JSON.stringify(value,null,2)} key={name+JSON.stringify(value)} onBlur={e=>{try{onChange(JSON.parse(e.target.value))}catch{e.target.setCustomValidity('JSON không hợp lệ');e.target.reportValidity()}}} onChange={e=>e.currentTarget.setCustomValidity('')}/></label>;
 if(['imageUrl','logoUrl','heroImageUrl','avatarDataUrl'].includes(name))return <label className="block space-y-2"><span className="text-xs font-bold text-stone-600">{label}</span><input className={box} disabled={disabled} value={String(value??'')} onChange={e=>onChange(e.target.value)} placeholder="https://... hoặc tải ảnh"/><input disabled={disabled} type="file" accept="image/*" className="text-xs block max-w-full" onChange={async e=>{
   const file=e.target.files?.[0];if(!file)return;
   if(file.size>7*1024*1024){window.alert('Ảnh vượt 7MB. Hãy giảm dung lượng ảnh.');return;}
   try{
    const img=new Image();const objectUrl=URL.createObjectURL(file);
    await new Promise<void>((resolve,reject)=>{img.onload=()=>resolve();img.onerror=()=>reject(new Error('Không mở được ảnh.'));img.src=objectUrl});
    const ratio=Math.min(1,600/Math.max(img.naturalWidth,img.naturalHeight));
    const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(img.naturalHeight*ratio));
    const context=canvas.getContext('2d');if(!context)throw new Error('Không hỗ trợ xử lý ảnh.');context.drawImage(img,0,0,canvas.width,canvas.height);
    let result='';for(const quality of [0.7,0.5,0.3,0.2]){result=canvas.toDataURL('image/webp',quality);if(result.length<38000)break;}
    URL.revokeObjectURL(objectUrl);
    if(result.length>38000)throw new Error('Ảnh vẫn quá lớn. Dùng đường dẫn ảnh HTTPS hoặc ảnh dung lượng thấp hơn.');
    onChange(result);
   }catch(err){window.alert(showError(err))}
 }} /><span className="text-[11px] text-stone-500">Ảnh sẽ được thu nhỏ và lưu cùng bản ghi trên GitHub; giới hạn kích thước để không quá tải API.</span>{typeof value==='string'&&value.startsWith('data:image/')&&<img alt="Ảnh đã chọn" className="w-32 h-24 object-cover rounded-lg" src={value}/>}</label>;
 if(name==='status')return <label className="block space-y-1"><span className="text-xs font-bold text-stone-600">{label}</span><select disabled={disabled} className={box} value={String(value||'pending')} onChange={e=>onChange(e.target.value)}>{['pending','success','completed','cancelled','new','confirmed','done','active','inactive'].map(v=><option key={v} value={v}>{v}</option>)}</select></label>;
 if(name==='description'||name==='content'||name==='excerpt'||name==='notes'||name==='operatorNotes'||name==='answer'||String(value||'').length>140)return <label className="block space-y-1"><span className="text-xs font-bold text-stone-600">{label}</span><textarea disabled={disabled} value={String(value??'')} onChange={e=>onChange(e.target.value)} className={`${box} min-h-28`}/></label>;
 return <label className="block space-y-1"><span className="text-xs font-bold text-stone-600">{label}</span><input disabled={disabled} className={box} type={name.includes('Date')||name==='travelDate'?'date':'text'} value={String(value??'')} onChange={e=>onChange(e.target.value)}/></label>;
}

export default function GithubOperatorPanel({account,onLogout}:{account:Row,onLogout:()=>Promise<void>}){
 const [moduleId,setModuleId]=useState('overview');
 const [sectionIndex,setSectionIndex]=useState(0);
 const [items,setItems]=useState<Row[]>([]);
 const [editor,setEditor]=useState<Row|null>(null);
 const [editingId,setEditingId]=useState<string|null>(null);
 const [advanced,setAdvanced]=useState(false);
 const [raw,setRaw]=useState('');
 const [query,setQuery]=useState('');
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const [error,setError]=useState('');
 const [drawer,setDrawer]=useState(false);
 const [stats,setStats]=useState({bookings:0,pending:0,reported:0,customers:0,service:0,revenue:0});
 const [configured,setConfigured]=useState<boolean|null>(null);
 const [refreshedAt,setRefreshedAt]=useState('');
 const module=ALL_ADMIN_MODULES.find(m=>m.id===moduleId);
 const sections=GITHUB_ADMIN_MODULES[moduleId]||[];
 const section:ModuleChoice|undefined=sections[sectionIndex]||sections[0];
 const filtered=useMemo(()=>items.filter(x=>(!section?.configId||String(x.id)===section.configId)&&JSON.stringify(x).toLocaleLowerCase('vi-VN').includes(query.toLocaleLowerCase('vi-VN'))),[items,query,section?.configId]);
 const isProtected=section?.collection==='users'||section?.collection==='bookings';
 const closeEditor=()=>{setEditor(null);setEditingId(null);setRaw('');setAdvanced(false)};
 const load=useCallback(async()=>{
  if(!section)return;
  setBusy(true);setError('');setMessage('');closeEditor();
  try{const r=await gh.list(section.collection);setItems(r.items||[]);setRefreshedAt(new Date().toLocaleTimeString('vi-VN'));}
  catch(e){setItems([]);setError('Không tải được dữ liệu GitHub: '+showError(e));}
  finally{setBusy(false)};
 },[section?.collection,section?.configId]);
 const loadStats=useCallback(async()=>{
  setBusy(true);setError('');
  try{const [b,u,s]=await Promise.all([gh.list('bookings'),gh.list('users'),gh.list('service_requests')]);
   const bookings=b.items||[];
   setStats({bookings:bookings.length,pending:bookings.filter(x=>x.status==='pending').length,reported:bookings.filter(x=>x.paymentReported&&x.status==='pending').length,customers:(u.items||[]).length,service:(s.items||[]).length,revenue:bookings.filter(x=>x.status==='success'||x.status==='completed').reduce((sum,x)=>sum+Number(x.totalPrice||0),0)});
   setRefreshedAt(new Date().toLocaleTimeString('vi-VN'));
  }catch(e){setError('Không đọc được thống kê GitHub: '+showError(e))}finally{setBusy(false)};
 },[]);
 useEffect(()=>{void gh.status().then(x=>setConfigured(x.configured)).catch(()=>setConfigured(false))},[]);
 useEffect(()=>{setSectionIndex(0);setQuery('');closeEditor()},[moduleId]);
 useEffect(()=>{if(moduleId==='overview'||moduleId==='growth_analytics'){void loadStats()}else{void load()}},[moduleId,sectionIndex,load,loadStats]);
 const go=(id:string)=>{setModuleId(id);setDrawer(false);setMessage('');setError('')};
 const beginEdit=(r:Row)=>{setEditor({...r});setEditingId(String(r.id));setRaw(JSON.stringify(r,null,2));setAdvanced(false)};
 const beginNew=()=>{if(!section)return;const r=emptyRecord(section.collection,section.configId);beginEdit(r);setEditingId(null)};
 const mutate=async(fn:()=>Promise<any>,success:string,refresh=true)=>{
   setBusy(true);setError('');setMessage('');
   try{const result=await fn();if(refresh)await load();setMessage(success);return result}
   catch(e){setError('Thao tác CHƯA được lưu: '+showError(e));return null}
   finally{setBusy(false)}
 };
 const save=async()=>{
   if(!section||!editor)return;
   let value={...editor};
   if(advanced){try{value=JSON.parse(raw);if(!value||Array.isArray(value)||typeof value!=='object')throw new Error('Yêu cầu JSON object');}
    catch(e){setError('JSON không hợp lệ: '+showError(e));return}}
   if(editingId&&String(value.id)!==editingId){setError('Không được thay mã ID của bản ghi.');return}
   if(!editingId){value.id=String(editor.id);if(!value.id||!/^[\w-]{1,128}$/.test(value.id)){setError('Mã bản ghi không hợp lệ.');return}}
   // Never allow an editor to overwrite password hashes, role or guest ownership.
   if(section.collection==='users')for(const k of ['role','passwordHash','welcomeBonusGranted','rewardedBookingIds','provider','points','createdAt'])delete value[k];
   if(section.collection==='bookings')for(const k of ['status','paymentReported','paymentReportedAt','guestHash','userId','rewardedBookingIds'])delete value[k];
   if(section.collection==='security_audit'){setError('Nhật ký chỉ được xem.');return}
   const saved=await mutate(()=>editingId?gh.patch(section.collection,editingId!,value):gh.create(section.collection,value),editingId?'Đã sửa và lưu trên GitHub.':'Đã thêm lên GitHub.');
   if(saved){closeEditor()}
 };
 const remove=async(r:Row)=>{
   if(!section||section.readOnly)return;
   const isSensitive=section.collection==='users'||section.collection==='bookings';
   if(!window.confirm(`${isSensitive?'CẢNH BÁO: dữ liệu khách hàng/đơn đặt vé. ':''}Xóa “${displayName(r)}” khỏi GitHub? Lịch sử Git có thể vẫn giữ bản cũ.`))return;
   const removed=await mutate(()=>gh.remove(section.collection,String(r.id)),'Đã xóa bản ghi trên GitHub.');
   if(removed)closeEditor();
 };
 const bookingAction=async(r:Row,status:'success'|'cancelled'|'completed')=>{
   if(status==='success'&&!window.confirm('Bạn đã kiểm tra tài khoản ngân hàng và THỰC SỰ nhận đủ cọc 50% chưa? Chỉ xác nhận nếu đã nhận tiền.'))return;
   if(status==='cancelled'&&!window.confirm('Hủy đơn này?'))return;
   await mutate(()=>gh.patch('bookings',String(r.id),{status}),status==='success'?'Đã xác nhận vé sau khi kiểm tra tiền cọc.':status==='completed'?'Đã hoàn thành chuyến.':'Đã hủy đơn.');
 };
 const seed=async()=>{
   if(!section)return;const sample=SEED[section.collection];
   if(!sample?.length||items.length)return;
   if(!window.confirm('Nhập '+sample.length+' mục dữ liệu mẫu có trong ZIP lên GitHub? Chỉ dùng khi danh mục thật sự trống. Không thay thế bài viết chỉ còn lưu trên Firebase.'))return;
   await mutate(()=>gh.replace(section.collection,sample.map(r=>({...r}))),`Đã nhập ${sample.length} bản ghi có sẵn trong ZIP.`);
 };
 const download=()=>{if(!section)return;downloadJSON(`qt-${section.collection}-${new Date().toISOString().slice(0,10)}.json`,items)};
 const liveModules=ADMIN_NAV_GROUPS;
 return <div className="min-h-screen bg-[#f6f8f6] text-stone-900 flex font-sans" data-github-admin="true">
  {drawer&&<button className="fixed inset-0 z-40 bg-black/30 lg:hidden" aria-label="Đóng menu" onClick={()=>setDrawer(false)}/>}
  <aside className={`z-50 fixed lg:sticky top-0 h-screen w-[282px] shrink-0 bg-[#163d2b] text-white flex flex-col ${drawer?'left-0':'-left-[300px]'} lg:left-0 transition-[left] duration-200`}>
    <div className="p-5 border-b border-white/10"><div className="font-extrabold text-lg">QT Limousine</div><div className="text-xs text-white/60 mt-1">QUẢN TRỊ DỮ LIỆU GITHUB</div></div>
    <div className="overflow-y-auto flex-1 p-3 space-y-5">
      {liveModules.map(g=><div key={g.id}><div className="uppercase text-[11px] font-black tracking-wider text-white/50 px-3 py-2">{g.title}</div><div className="space-y-1">{g.modules.map(m=><button type="button" key={m.id} onClick={()=>go(m.id)} aria-current={moduleId===m.id?'page':undefined} className={`w-full text-left text-[13px] px-3 py-2.5 rounded-lg transition-colors ${moduleId===m.id?'bg-white text-[#163d2b] font-black':'text-white/85 hover:bg-white/10'}`}>{m.shortName||m.name}</button>)}</div></div>)}
    </div>
    <div className="p-4 border-t border-white/10 space-y-2"><button onClick={()=>void onLogout()} className="w-full border border-white/25 rounded-xl py-2.5 flex items-center justify-center gap-2 text-sm"><LogOut size={16}/> Đăng xuất</button><a href="/" className="block text-center text-xs text-white/60 underline">Về website</a></div>
  </aside>
  <div className="min-w-0 flex-1">
   <header className="sticky top-0 z-20 bg-white border-b border-stone-200 px-4 sm:px-7 py-3 flex items-center gap-3 justify-between">
    <div className="flex items-center min-w-0 gap-3"><button className="lg:hidden rounded-lg border p-2" onClick={()=>setDrawer(true)} aria-label="Mở menu"><Menu size={21}/></button><div className="min-w-0"><div className="font-black text-base sm:text-lg truncate">{module?.name||'Quản trị'}</div><div className="text-xs text-stone-500 truncate">{module?.description||'GitHub API — không Firebase'}</div></div></div>
    <div className="flex gap-2 items-center"><span className={`text-xs hidden sm:inline px-2 py-1 rounded-full ${configured?'bg-emerald-50 text-emerald-700':'bg-amber-50 text-amber-800'}`}>{configured===null?'Đang kiểm tra':configured?'GitHub đã cấu hình':'Thiếu cấu hình GitHub'}</span><button type="button" className="border rounded-lg p-2 hover:bg-stone-50" title="Tải lại dữ liệu" disabled={busy} onClick={()=>void(moduleId==='overview'||moduleId==='growth_analytics'?loadStats():load())}><RefreshCw size={19}/></button></div>
   </header>
   <main className="p-4 sm:p-6 xl:p-8 max-w-[1480px] mx-auto space-y-5">
    {error&&<div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800 flex gap-2"><AlertCircle size={19} className="shrink-0"/>{error}</div>}
    {message&&<div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 flex gap-2"><CheckCircle2 size={19} className="shrink-0"/>{message}</div>}
    {configured===false&&<div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm"><strong>Chưa thể thao tác thực tế.</strong> Máy chủ cần các biến GITHUB_DATA_REPO, GITHUB_DATA_BRANCH=main, GITHUB_DATA_TOKEN, GITHUB_DATA_ENCRYPTION_KEY, GITHUB_SESSION_SECRET và GITHUB_ADMIN_PASSWORD. Không nhập bí mật vào giao diện khách.</div>}
    {(moduleId==='overview'||moduleId==='growth_analytics') ? <>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">{[
       ['Tổng đơn đặt vé',stats.bookings,'limousine_bookings'],['Chờ xác nhận',stats.pending,'limousine_bookings'],['Khách báo đã cọc',stats.reported,'limousine_bookings'],
       ['Hội viên',stats.customers,'limousine_customers'],['Yêu cầu dịch vụ',stats.service,'service_orders'],['Giá trị đơn xác nhận',money(stats.revenue),'limousine_bookings']
      ].map(([title,value,target])=><button key={title} className="rounded-2xl bg-white border border-stone-200 shadow-sm p-4 sm:p-6 text-left hover:border-emerald-400" onClick={()=>go(String(target))}><div className="text-xs text-stone-500">{title}</div><div className="text-2xl font-black mt-2 text-[#1b4332]">{value}</div></button>)}</div>
      <div className="bg-white border rounded-2xl p-5 space-y-3"><h2 className="font-black">{moduleId==='growth_analytics'?'Thống kê thực từ dữ liệu đơn hàng':'Thao tác nhanh'}</h2><p className="text-sm text-stone-600">Chỉ thống kê những bản ghi thực sự đọc được từ GitHub. Không tự tạo lượt xem hoặc doanh thu giả. Lần cập nhật: {refreshedAt||'Chưa có'}.</p><div className="flex flex-wrap gap-2">{[['Đơn chưa duyệt','limousine_bookings'],['Bài viết','articles_guide'],['Địa điểm','destinations'],['Hội viên','limousine_customers'],['Voucher','limousine_coupons']].map(([name,id])=><button key={id} onClick={()=>go(id)} className="px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-sm font-semibold">{name}</button>)}</div></div>
    </> : <>
     {moduleId==='security_config'&&<div className="bg-white border rounded-2xl p-5 space-y-2"><h2 className="font-bold flex gap-2 items-center"><ShieldCheck size={18}/> Kiểm tra bảo mật</h2><p className="text-sm text-stone-600">Khóa mã hóa, token GitHub và mật khẩu Admin chỉ được thay trong Vercel Environment Variables. Không hiển thị hoặc sửa bí mật trong trình duyệt.</p><p className="text-xs text-stone-500">Tài khoản đang dùng: {account.email||account.name||'Admin'}. Dữ liệu khách được lưu riêng và mã hóa.</p></div>}
     <div className="bg-white rounded-2xl border p-4 flex flex-wrap items-center gap-2 justify-between">
      <div className="flex flex-wrap gap-2">{sections.map((s,i)=><button type="button" key={s.collection+String(s.configId||'')} onClick={()=>{setSectionIndex(i);setQuery('')}} aria-pressed={sectionIndex===i} className={`px-4 py-2 rounded-xl text-sm font-bold ${sectionIndex===i?'bg-[#1b4332] text-white':'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>{s.title}</button>)}</div>
      <div className="text-xs text-stone-500">{filtered.length} mục {refreshedAt&&'· tải lúc '+refreshedAt}</div>
     </div>
     {section&&<div className="bg-white border rounded-2xl overflow-hidden">
      <div className="p-4 flex flex-wrap items-center gap-2 justify-between border-b"><div className="flex-1 min-w-[190px] relative"><Search size={16} className="absolute top-3.5 left-3 text-stone-400"/><input className="border rounded-xl py-2.5 pl-9 pr-3 w-full text-sm" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Tìm trong dữ liệu đã lưu..." aria-label="Tìm kiếm"/></div>
       <div className="flex flex-wrap gap-2"><button disabled={busy} onClick={download} className="border rounded-xl px-3 py-2.5 text-sm font-semibold flex gap-2 items-center" title="Tải bản sao dữ liệu"><Download size={16}/> Sao lưu</button><button disabled={busy} onClick={()=>void load()} className="border rounded-xl px-3 py-2.5 text-sm font-semibold flex gap-2 items-center"><RefreshCw size={16}/> Tải lại</button>{!section.readOnly&&section.collection!=='users'&&(!section.configId||!items.some(x=>x.id===section.configId))&&<button disabled={busy} onClick={beginNew} className="rounded-xl px-3 py-2.5 bg-[#1b4332] text-white text-sm font-bold flex gap-2 items-center"><Plus size={17}/> Thêm</button>}</div>
      </div>
      {busy&&<div className="p-3 text-emerald-800 text-sm">Đang đọc/ghi dữ liệu GitHub...</div>}
      {filtered.length>0 ? <div className="divide-y max-h-[650px] overflow-y-auto">{filtered.map(r=><div key={String(r.id)} className="p-4 flex flex-wrap gap-3 items-center justify-between hover:bg-stone-50"><div className="min-w-0 flex-1"><div className="font-bold text-sm truncate">{displayName(r)}</div><div className="text-xs text-stone-500 mt-0.5">{r.travelDate?`${r.travelDate} · `:''}{r.passengerPhone||r.categoryLabel||r.category||r.type||r.description?.slice?.(0,65)||''}</div>{r.status&&<span className="inline-block text-[11px] px-2 py-0.5 rounded-full bg-stone-100 mt-1">{String(r.status)} {r.paymentReported&&r.status==='pending'?'· Khách đã báo cọc':''}</span>}</div><div className="flex flex-wrap gap-2">
       {section.collection==='bookings'&&r.status==='pending'&&<><button disabled={busy} onClick={()=>void bookingAction(r,'success')} className="text-xs rounded-lg bg-emerald-700 text-white px-3 py-2 font-black flex gap-1 items-center"><ClipboardCheck size={15}/> Đã nhận cọc / Duyệt</button><button disabled={busy} onClick={()=>void bookingAction(r,'cancelled')} className="text-xs rounded-lg border px-3 py-2">Hủy đơn</button></>}
       {section.collection==='bookings'&&r.status==='success'&&<button disabled={busy} onClick={()=>void bookingAction(r,'completed')} className="text-xs rounded-lg bg-blue-50 border border-blue-200 text-blue-800 px-3 py-2">Hoàn thành</button>}
       <button disabled={busy} onClick={()=>beginEdit(r)} className="text-xs rounded-lg border px-3 py-2 flex gap-1 items-center"><Edit3 size={15}/> Sửa/Xem</button>{!section.readOnly&&<button disabled={busy} onClick={()=>void remove(r)} className="text-xs rounded-lg border border-rose-200 text-rose-700 px-3 py-2 flex gap-1 items-center"><Trash2 size={15}/> Xóa</button>}</div></div>)}</div> : <div className="p-8 text-center space-y-3"><Database className="w-9 h-9 text-stone-300 mx-auto"/><div className="font-semibold text-stone-600">{query?'Không có kết quả phù hợp.':'Chưa có bản ghi trên GitHub.'}</div>{!query&&PUBLIC_CMS_COLLECTIONS.has(section.collection)&&SEED[section.collection]?.length&&<><p className="text-xs text-stone-500">File ZIP có {SEED[section.collection].length} mục dữ liệu mẫu; chưa tự ý ghi đè hoặc chuyển bài viết chỉ có trên Firebase.</p><button disabled={busy} onClick={()=>void seed()} className="px-4 py-2 rounded-xl border border-emerald-600 text-emerald-800 text-sm font-bold">Nhập nội dung có sẵn từ ZIP</button></>}</div>}
      {isProtected&&<div className="px-4 py-3 bg-amber-50 border-t text-xs text-amber-900">{section.collection==='bookings'?'Khách chỉ báo đã cọc; chỉ bấm Duyệt khi bạn đã kiểm tra tiền thật.':'Tài khoản hội viên chỉ được tạo qua đăng ký. Không chỉnh mật khẩu hoặc quyền quản trị tại đây.'}</div>}
     </div>}
    </>}
   </main>
  </div>
  {editor&&section&&<div className="fixed inset-0 z-[100] bg-black/40 flex justify-end" role="dialog" aria-modal="true" aria-label="Chỉnh sửa dữ liệu GitHub"><div className="bg-white h-full w-full max-w-[670px] shadow-2xl flex flex-col"><div className="p-4 border-b flex justify-between gap-3 items-center"><div><div className="font-black text-lg">{editingId?'Sửa bản ghi':'Thêm bản ghi'}</div><p className="text-xs text-stone-500">{section.title} · {editor.id}</p></div><button aria-label="Đóng" onClick={closeEditor} className="p-2 rounded-xl hover:bg-stone-100"><X/></button></div>
   <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-4">
    {isProtected&&<p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">{section.collection==='bookings'?'Trạng thái vé chỉ đổi bằng nút Duyệt / Hủy trên danh sách.':'Không đổi mật khẩu, điểm thưởng hoặc vai trò bằng form này.'}</p>}
    <label className="block space-y-1"><span className="text-xs font-bold text-stone-600">Mã bản ghi — không thể đổi</span><input readOnly value={String(editor.id)} className="w-full border rounded-xl bg-stone-100 text-sm p-3"/></label>
    {!advanced&&Array.from(new Set([...(ADMIN_SPECIAL_FIELDS[section.collection]||RECOMMENDED_FIELDS[section.collection]||[]),...Object.keys(editor).filter(k=>!IMMUTABLE.has(k)&&!['passwordHash','guestHash'].includes(k))])).filter(k=>k!=='id'&&!(section.collection==='users'&&['role','points','passwordHash','welcomeBonusGranted'].includes(k))&&!(section.collection==='bookings'&&['status','paymentReported'].includes(k))).map(k=><React.Fragment key={k}><EditableField name={k} value={editor[k]??''} onChange={v=>setEditor(old=>old?{...old,[k]:v}:old)} disabled={section.readOnly}/></React.Fragment>) }
    {advanced&&<label className="block space-y-2"><span className="font-semibold text-sm">JSON nâng cao (chỉ dành cho người hiểu cấu trúc)</span><textarea value={raw} onChange={e=>setRaw(e.target.value)} spellCheck={false} className="w-full h-[440px] p-3 border rounded-xl font-mono text-xs"/></label>}
    <button onClick={()=>{if(!advanced)setRaw(JSON.stringify(editor,null,2));else try{setEditor(JSON.parse(raw))}catch{}setAdvanced(!advanced)}} className="text-xs text-stone-600 underline flex gap-2 items-center"><FileJson size={15}/>{advanced?'Chuyển về biểu mẫu':'Mở chỉnh sửa JSON nâng cao'}</button>
   </div><div className="p-4 border-t bg-stone-50 flex justify-between gap-2"><button onClick={closeEditor} className="px-4 py-3 border rounded-xl text-sm">Đóng</button>{!section.readOnly&&<button disabled={busy} onClick={()=>void save()} className="bg-emerald-800 text-white rounded-xl px-5 py-3 font-bold text-sm flex gap-2 items-center disabled:opacity-50"><Save size={17}/>{busy?'Đang lưu...':'Lưu lên GitHub'}</button>}</div></div></div>}
 </div>
}
