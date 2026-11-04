import React, { useState } from "react";
import type { Coupon, User } from "../../types";
import { Plus, Trash2, Tag, Shuffle } from "lucide-react";
import { couponAudienceLabel } from "../../lib/couponEligibility";

interface CouponManagementProps {
  coupons: Coupon[];
  users: User[];
  onUpdateCoupons: (updated: Coupon[]) => void;
}

const AUDIENCES: {id: NonNullable<Coupon['audience']>; label:string}[] = [
  {id:'all',label:'Tất cả hội viên'},
  {id:'male',label:'Chỉ dành cho nam'},
  {id:'female',label:'Chỉ dành cho nữ'},
  {id:'birthday',label:'Voucher sinh nhật'},
  {id:'holiday',label:'Dịp lễ / sự kiện'},
  {id:'random',label:'Bốc thăm hội viên ngẫu nhiên'},
  {id:'age',label:'Theo độ tuổi'}
];
const input='w-full rounded-xl border border-stone-200 bg-white p-2.5 text-sm text-stone-900';
const normalizeCode=(value:string)=>value.trim().toUpperCase().replace(/\s+/g,'');

export default function CouponManagement({coupons,users,onUpdateCoupons}:CouponManagementProps){
  const [code,setCode] = useState('');
  const [title,setTitle] = useState('');
  const [discount,setDiscount] = useState(10);
  const [audience,setAudience] = useState<NonNullable<Coupon['audience']>>('all');
  const [from,setFrom] = useState('');
  const [until,setUntil] = useState('');
  const [birthdayWindow,setBirthdayWindow] = useState<'month'|'day'>('month');
  const [minAge,setMinAge] = useState(18);
  const [maxAge,setMaxAge] = useState(65);
  const [randomCount,setRandomCount] = useState(5);
  const [usageLimit,setUsageLimit] = useState<number | ''>('');
  const [feedback,setFeedback] = useState('');

  const eligibleUsers=users.filter(user=>user.role==='customer'&&Boolean(user.id));
  const pickWinners=(amount:number):string[]=>{
    const ids=[...new Set(eligibleUsers.map(user=>user.id))];
    // Draw an explicit fixed recipient list once. Client-side allocation is a
    // convenience tool, not a certified raffle or server-enforced entitlement.
    for(let i=ids.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [ids[i],ids[j]]=[ids[j],ids[i]];
    }
    return ids.slice(0,Math.min(amount,ids.length));
  };

  const add=()=>{
    setFeedback('');
    const normalized=normalizeCode(code);
    if(!/^[A-Z0-9_-]{3,30}$/.test(normalized)){setFeedback('Mã cần 3–30 ký tự A–Z, 0–9, _ hoặc -.');return;}
    if(coupons.some(c=>c.code.toUpperCase()===normalized)){setFeedback('Mã này đã tồn tại.');return;}
    if(!Number.isFinite(discount)||discount<=0||discount>100){setFeedback('Mức giảm phải từ 1% đến 100%.');return;}
    if(from&&until&&until<from){setFeedback('Ngày kết thúc phải sau ngày bắt đầu.');return;}
    if(audience==='holiday'&&(!from||!until)){setFeedback('Voucher dịp lễ cần ngày bắt đầu và kết thúc.');return;}
    if(audience==='age'&&minAge>maxAge){setFeedback('Tuổi tối thiểu không được lớn hơn tuổi tối đa.');return;}
    if(audience==='random'&&!eligibleUsers.length){setFeedback('Chưa có hội viên để bốc thăm.');return;}
    const recipients=audience==='random'?pickWinners(Math.max(1,Math.floor(randomCount))):undefined;
    const limitNum = typeof usageLimit === 'number' && usageLimit > 0 ? usageLimit : undefined;
    const next:Coupon={
      id:'coupon_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7),
      code:normalized,discountPercentage:discount,title:title.trim()||'Voucher '+normalized,
      audience,validFrom:from||undefined,validUntil:until||undefined,
      birthdayWindow:audience==='birthday'?birthdayWindow:undefined,
      minAge:audience==='age'?minAge:undefined,maxAge:audience==='age'?maxAge:undefined,
      assignedUserIds:recipients,
      usageLimit:limitNum,
      usageCount:0,
      isActive:true,isPublished:false
    };
    onUpdateCoupons([...coupons,next]);
    setCode('');setTitle('');setUsageLimit('');
    setFeedback(audience==='random'
      ?'Đã tạo bản nháp và chọn '+recipients!.length+' hội viên ngẫu nhiên. Nhấn Công bố khi đã kiểm tra.'
      :'Đã thêm voucher ở trạng thái chưa công bố.');
  };

  const change=(id:string,patch:Partial<Coupon>)=>{
    onUpdateCoupons(coupons.map(c=>c.id===id?{...c,...patch}:c));
  };

  return <div className="space-y-5">
    <div>
      <h3 className="text-lg sm:text-xl font-black text-[#1b4332]">Quản lý voucher theo đối tượng</h3>
      <p className="text-xs text-stone-600 mt-1">Tạo mã cho mọi hội viên, theo giới tính tự khai, tháng sinh nhật, tuổi, dịp lễ hoặc bốc thăm ngẫu nhiên. Mã mới chưa công bố cho tới khi Admin bật.</p>
    </div>
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 sm:p-5 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <label className="text-xs font-bold text-emerald-950">Mã voucher
          <input value={code} onChange={e=>setCode(e.target.value.toUpperCase())}
            maxLength={30} placeholder="VD: SINHNHAT20" className={input+' mt-1'}/>
        </label>
        <label className="text-xs font-bold text-emerald-950">Tên chương trình
          <input value={title} onChange={e=>setTitle(e.target.value)}
            maxLength={90} placeholder="VD: Quà sinh nhật" className={input+' mt-1'}/>
        </label>
        <label className="text-xs font-bold text-emerald-950">Giảm (%)
          <input type="number" min={1} max={100} value={discount} onChange={e=>setDiscount(Number(e.target.value))} className={input+' mt-1'}/>
        </label>
        <label className="text-xs font-bold text-emerald-950">Dành cho
          <select value={audience} onChange={e=>setAudience(e.target.value as typeof audience)} className={input+' mt-1'}>
            {AUDIENCES.map(v=><option key={v.id} value={v.id}>{v.label}</option>)}
          </select>
        </label>
        <label className="text-xs font-bold text-emerald-950">Bắt đầu (không bắt buộc)
          <input type="date" value={from} onChange={e=>setFrom(e.target.value)} className={input+' mt-1'}/>
        </label>
        <label className="text-xs font-bold text-emerald-950">Hết hạn (không bắt buộc)
          <input type="date" value={until} onChange={e=>setUntil(e.target.value)} className={input+' mt-1'}/>
        </label>
        <label className="text-xs font-bold text-emerald-950">Giới hạn số lượt dùng (không bắt buộc)
          <input type="number" min={1} placeholder="Không giới hạn" value={usageLimit} onChange={e=>setUsageLimit(e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 1))} className={input+' mt-1'}/>
        </label>
      </div>
      {audience==='birthday'&&<label className="block max-w-xs text-xs font-bold text-emerald-950">
        Khi nào được dùng?
        <select className={input+' mt-1'} value={birthdayWindow} onChange={e=>setBirthdayWindow(e.target.value as 'day'|'month')}>
          <option value="month">Trong tháng sinh nhật</option>
          <option value="day">Đúng ngày sinh nhật</option>
        </select>
      </label>}
      {audience==='age'&&<div className="grid grid-cols-2 gap-3 max-w-sm">
        <label className="text-xs font-bold">Từ tuổi<input type="number" min={0} max={120} value={minAge} onChange={e=>setMinAge(Number(e.target.value))} className={input+' mt-1'}/></label>
        <label className="text-xs font-bold">Đến tuổi<input type="number" min={0} max={120} value={maxAge} onChange={e=>setMaxAge(Number(e.target.value))} className={input+' mt-1'}/></label>
      </div>}
      {audience==='random'&&<div className="rounded-xl bg-white border border-emerald-100 p-3 space-y-2">
        <p className="text-xs text-stone-700"><Shuffle className="w-4 h-4 inline mr-1"/> Bốc thăm một lần từ <strong>{eligibleUsers.length}</strong> hồ sơ hội viên. Chỉ những UID được chọn nhận mã.</p>
        <label className="text-xs font-bold block max-w-xs">Số người được chọn
          <input type="number" min={1} max={Math.max(1,eligibleUsers.length)} value={randomCount} onChange={e=>setRandomCount(Number(e.target.value))} className={input+' mt-1'}/>
        </label>
      </div>}
      {feedback&&<p role="status" className="text-xs font-semibold text-emerald-950">{feedback}</p>}
      <button type="button" onClick={add} className="flex items-center justify-center gap-2 bg-[#1b4332] text-white rounded-xl px-4 py-3 text-sm font-black min-h-[44px]"><Plus className="w-4 h-4"/> Tạo voucher (bản nháp)</button>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {coupons.map(c=><article key={c.id} className="rounded-2xl border border-stone-200 bg-white p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-black text-emerald-900 text-sm">{c.title||c.code}</p>
            <p className="font-mono font-black text-stone-800 text-xs mt-1">{c.code}</p>
            <p className="text-xs text-emerald-800 mt-1">Giảm {c.discountPercentage}% · {couponAudienceLabel(c)}</p>
            {(c.validFrom||c.validUntil)&&<p className="text-xs text-stone-500 mt-1">{c.validFrom||'Hôm nay'} → {c.validUntil||'Không giới hạn'}</p>}
            {typeof c.usageLimit === 'number' && <p className="text-xs text-blue-700 mt-1 font-semibold">Đã dùng: {c.usageCount || 0} / {c.usageLimit} lượt</p>}
            {c.audience==='random'&&<p className="text-xs text-stone-600 mt-1">Đã chọn {(c.assignedUserIds||[]).length} hội viên</p>}
          </div>
          <div className="bg-emerald-50 w-10 h-10 rounded-xl flex items-center justify-center shrink-0"><Tag className="w-5 h-5 text-emerald-700"/></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={()=>change(c.id,{isPublished:!c.isPublished})}
            className={'rounded-xl px-3 py-2.5 text-xs font-bold '+(c.isPublished?'bg-emerald-100 text-emerald-800':'bg-stone-100 text-stone-700')}>
            {c.isPublished?'Đang công bố':'Công bố'}
          </button>
          <button type="button" onClick={()=>change(c.id,{isActive:c.isActive===false})}
            className="rounded-xl px-3 py-2.5 text-xs font-bold border border-stone-200">
            {c.isActive===false?'Bật lại':'Tạm dừng'}
          </button>
          <button type="button" onClick={()=>onUpdateCoupons(coupons.filter(v=>v.id!==c.id))}
            aria-label={'Xóa mã '+c.code} className="ml-auto p-2 rounded-xl text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4"/></button>
        </div>
        <p className="text-[11px] text-stone-500">Để chỉnh thời gian, nhóm khách hoặc người được chọn, hãy tạo mã mới và ngừng mã cũ để tránh thay đổi quyền lợi đã công bố.</p>
      </article>)}
    </div>
    {!coupons.length&&<div className="text-center text-stone-500 text-sm border border-dashed rounded-2xl p-6">Chưa có voucher.</div>}
    <p className="text-xs text-amber-800">Giới tính, ngày sinh là thông tin khách tự khai. Bốc thăm và kiểm tra điều kiện phía trình duyệt không chống được gian lận nếu quyền Firestore còn công khai; cần bảo vệ dữ liệu và giao dịch trước khi phát ưu đãi có giá trị tiền.</p>
  </div>;
}
