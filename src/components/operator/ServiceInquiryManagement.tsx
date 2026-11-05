import React, {useEffect, useState} from 'react';
import {Phone, RefreshCw, CheckCircle2, AlertTriangle} from 'lucide-react';
import {ServiceInquiry, InquiryStatus, subscribeServiceInquiries, updateServiceInquiryStatus} from '../../lib/serviceRequests';
import {gh} from '../../client/githubApi';

const statuses: {value:InquiryStatus; label:string}[] = [
  {value:'pending',label:'Chờ xử lý'}, {value:'contacted',label:'Đã liên hệ'},
  {value:'confirmed',label:'Đã xác nhận'}, {value:'completed',label:'Đã hoàn thành'},
  {value:'cancelled',label:'Đã hủy'}
];

export default function ServiceInquiryManagement({backend='firebase'}:{backend?:'firebase'|'github'}) {
  const [data,setData]=useState<ServiceInquiry[]>([]);
  const [filter,setFilter]=useState('all');
  const [error,setError]=useState('');
  const [saving,setSaving]=useState('');
  const refreshGithub=async()=>{
    const result=await gh.list('service_requests');
    setData((result.items||[]) as ServiceInquiry[]);
  };
  useEffect(()=>{
    if(backend==='firebase')return subscribeServiceInquiries(setData,e=>setError('Không thể đọc đơn dịch vụ: '+e.message+'. Kiểm tra Firestore Rules.'));
    void refreshGithub().catch(e=>setError('Không thể đọc đơn GitHub: '+(e instanceof Error?e.message:String(e))));
  },[backend]);
  const changeStatus=async (item:ServiceInquiry, value:InquiryStatus)=>{
    setSaving(item.id); setError('');
    try {
      if(backend==='github'){await gh.patch('service_requests',item.id,{status:value});await refreshGithub();}
      else await updateServiceInquiryStatus(item.id,value);
    }
    catch(e:any){setError('Không lưu được trạng thái: '+(e?.message||'Lỗi kết nối'))}
    finally{setSaving('')}
  };
  const displayed = data.filter(x=>filter==='all'||x.status===filter);
  return <section className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-6 space-y-4">
    <div className="flex flex-wrap justify-between gap-2 items-center"><div><h2 className="text-lg font-black text-[#1b4332]">Yêu cầu Taxi & Thuê xe máy</h2><p className="text-xs text-stone-500">{backend==='github'?'Đồng bộ GitHub mã hóa • Chỉ nhận đơn khi máy chủ xác nhận':'Đồng bộ Firebase • Chỉ báo đã nhận khi khách gửi thành công'}</p></div><span className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-900">{data.length} yêu cầu</span></div>
    {error&&<p role="alert" className="rounded-xl bg-red-50 text-red-800 p-3 text-xs flex gap-2"><AlertTriangle className="w-4 h-4"/>{error}</p>}
    {backend==='github'&&<button onClick={()=>void refreshGithub().catch(e=>setError(String(e)))} className="rounded-xl border border-emerald-300 text-emerald-900 px-3 py-2 text-xs font-bold">Tải lại đơn GitHub</button>}
    <select aria-label="Lọc trạng thái đơn" value={filter} onChange={e=>setFilter(e.target.value)} className="border rounded-xl p-3 text-sm w-full sm:max-w-xs"><option value="all">Tất cả đơn</option>{statuses.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {displayed.map(item=><article key={item.id} className="border border-stone-200 rounded-2xl p-4 space-y-2 bg-stone-50/60">
        <div className="flex justify-between gap-2 items-start"><div><strong className="text-sm text-stone-900">{item.kind==='taxi'?`Taxi ${item.seats||''} chỗ`:'Thuê xe máy'}</strong><p className="text-[11px] text-stone-500">Mã: {item.id.slice(0,10)} • {new Date(item.createdAt).toLocaleString('vi-VN')}</p></div><span className="text-[10px] rounded-lg bg-amber-100 text-amber-900 p-2 font-bold">{statuses.find(x=>x.value===item.status)?.label||item.status}</span></div>
        <p className="text-sm font-bold">{item.customerName}</p><a href={`tel:${item.customerPhone}`} className="inline-flex gap-2 items-center text-emerald-800 text-sm"><Phone className="w-4 h-4"/>{item.customerPhone}</a>
        <p className="text-xs text-stone-600">{item.kind==='taxi'?`${item.pickupPoint||''} → ${item.dropoffPoint||''} • ${item.travelDate||''} ${item.departureTime||''}`:`${item.bikeType||'Xe máy'} • ${item.quantity||1} xe • ${item.startDate||''} đến ${item.endDate||''} • ${item.deliveryLocation||''}`}</p>
        {item.notes&&<p className="text-xs text-stone-600">Ghi chú: {item.notes}</p>}
        <div className="flex gap-2 items-center"><label className="text-xs text-stone-600" htmlFor={`status-${item.id}`}>Trạng thái:</label><select id={`status-${item.id}`} disabled={saving===item.id} value={item.status} onChange={e=>changeStatus(item,e.target.value as InquiryStatus)} className="flex-1 min-w-0 border border-stone-200 rounded-xl bg-white p-2.5 text-xs">{statuses.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select>{saving===item.id?<RefreshCw className="w-4 h-4 animate-spin"/>:<CheckCircle2 className="w-4 h-4 text-emerald-700"/>}</div>
      </article>)}
    </div>
    {displayed.length===0&&<p className="text-stone-500 text-sm py-8 text-center">Chưa có yêu cầu trong bộ lọc này.</p>}
  </section>
}
