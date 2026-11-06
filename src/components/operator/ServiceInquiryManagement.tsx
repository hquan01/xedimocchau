import React, {useState} from 'react';
import {Phone, RefreshCw, CheckCircle2, AlertTriangle} from 'lucide-react';
import {ServiceInquiry, ServiceKind, InquiryStatus, updateServiceInquiryStatus} from '../../lib/serviceRequests';

const statuses: {value:InquiryStatus; label:string}[] = [
  {value:'pending',label:'Chờ xử lý'}, {value:'contacted',label:'Đã liên hệ'},
  {value:'confirmed',label:'Đã xác nhận'}, {value:'completed',label:'Đã hoàn thành'},
  {value:'cancelled',label:'Đã hủy'}
];

interface ServiceInquiryManagementProps {
  data: ServiceInquiry[];
  error?: string;
  kind?: ServiceKind;
}

export default function ServiceInquiryManagement({data, error = '', kind}: ServiceInquiryManagementProps) {
  const [filter,setFilter]=useState('all');
  const [kindFilter,setKindFilter]=useState<ServiceKind | 'all'>('all');
  const [saveError,setSaveError]=useState('');
  const [saving,setSaving]=useState('');
  const changeStatus=async (item:ServiceInquiry, value:InquiryStatus)=>{
    setSaving(item.id); setSaveError('');
    try {await updateServiceInquiryStatus(item.id,value)}
    catch(e:any){setSaveError('Không lưu được trạng thái: '+(e?.message||'Lỗi kết nối'))}
    finally{setSaving('')}
  };
  const relevant = data.filter(item => (kind || kindFilter) === 'all' || item.kind === (kind || kindFilter));
  const displayed = relevant.filter(item => filter === 'all' || item.status === filter);
  const pending = relevant.filter(item => item.status === 'pending').length;

  return <section className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-6 space-y-4" id="service_inquiry_management">
    <div className="flex flex-wrap justify-between gap-2 items-center">
      <div>
        <h2 className="text-lg font-black text-[#1b4332]">{kind === 'taxi' ? 'Yêu cầu Taxi & Xe Du Lịch' : kind === 'motorbike' ? 'Yêu cầu Thuê Xe Máy' : 'Yêu cầu Taxi & Thuê Xe Máy'}</h2>
        <p className="text-xs text-stone-500">Đơn khách gửi từ website • Đồng bộ Firebase theo thời gian thực</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {pending > 0 && <span className="rounded-xl bg-amber-100 border border-amber-300 text-amber-900 px-3 py-2 text-xs font-extrabold">🔔 {pending} đơn chờ xử lý</span>}
        <span className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-900">{relevant.length} yêu cầu</span>
      </div>
    </div>
    {(error || saveError) && <p role="alert" className="rounded-xl bg-red-50 text-red-800 p-3 text-xs flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0"/>{error || saveError}</p>}
    <div className="flex gap-2 flex-wrap">
      {!kind && <select aria-label="Lọc loại dịch vụ" value={kindFilter} onChange={e=>setKindFilter(e.target.value as ServiceKind | 'all')} className="border border-stone-200 rounded-xl p-3 text-sm flex-1 min-w-36">
        <option value="all">Taxi & Thuê xe máy</option><option value="taxi">Taxi / Xe du lịch</option><option value="motorbike">Thuê xe máy</option>
      </select>}
      <select aria-label="Lọc trạng thái đơn" value={filter} onChange={e=>setFilter(e.target.value)} className="border border-stone-200 rounded-xl p-3 text-sm flex-1 min-w-36"><option value="all">Tất cả trạng thái</option>{statuses.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {displayed.map(item=><article key={item.id} className={`border rounded-2xl p-4 space-y-2 ${item.status === 'pending' ? 'border-amber-300 bg-amber-50/60' : 'border-stone-200 bg-stone-50/60'}`}>
        <div className="flex justify-between gap-2 items-start">
          <div>
            <strong className="text-sm text-stone-900">{item.kind==='taxi' ? `Taxi / Xe du lịch ${item.seats||''} chỗ` : 'Thuê xe máy'}</strong>
            <p className="text-[11px] text-stone-500">Mã: {item.id.slice(0,12)} • {new Date(item.createdAt).toLocaleString('vi-VN')}</p>
          </div>
          <span className={`text-[10px] rounded-lg p-2 font-bold ${item.status === 'pending' ? 'bg-amber-200 text-amber-950' : 'bg-stone-200 text-stone-800'}`}>{statuses.find(x=>x.value===item.status)?.label||item.status}</span>
        </div>
        <p className="text-sm font-bold">{item.customerName}</p>
        <a href={`tel:${item.customerPhone.replace(/[^+0-9]/g,'')}`} className="inline-flex gap-2 items-center text-emerald-800 text-sm font-semibold"><Phone className="w-4 h-4"/>{item.customerPhone}</a>
        <p className="text-xs text-stone-600">{item.kind==='taxi' ? `${item.pickupPoint||''} → ${item.dropoffPoint||''} • ${item.travelDate||''} ${item.departureTime||''}` : `${item.bikeType||'Xe máy'} • ${item.quantity||1} xe • ${item.startDate||''} đến ${item.endDate||''} • ${item.deliveryLocation||''}`}</p>
        {item.notes && <p className="text-xs text-stone-600">Ghi chú: {item.notes}</p>}
        <div className="flex gap-2 items-center">
          <label className="text-xs text-stone-600" htmlFor={`status-${item.id}`}>Trạng thái:</label>
          <select id={`status-${item.id}`} disabled={saving===item.id} value={item.status} onChange={e=>changeStatus(item,e.target.value as InquiryStatus)} className="flex-1 min-w-0 border border-stone-200 rounded-xl bg-white p-2.5 text-xs">{statuses.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select>
          {saving===item.id ? <RefreshCw className="w-4 h-4 animate-spin"/> : <CheckCircle2 className="w-4 h-4 text-emerald-700"/>}
        </div>
      </article>)}
    </div>
    {displayed.length===0 && <p className="text-stone-500 text-sm py-8 text-center">{error ? 'Không tải được đơn, vui lòng kiểm tra quyền quản trị Firebase.' : 'Chưa có yêu cầu trong bộ lọc này.'}</p>}
  </section>;
}
