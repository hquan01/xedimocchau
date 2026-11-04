import React, {useEffect,useState} from 'react';
import {Save,ImagePlus,Plus,Trash2,ArrowUp,ArrowDown,Eye,EyeOff} from 'lucide-react';
import {SiteContent,HomeTile,FeaturedStory,HeroSlide,AttractionTicket,useSiteContent,publishSiteContent,uploadSiteImage} from '../../lib/siteContent';

function Uploader({onFile}: {onFile:(url:string)=>void}) {
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  return <label className="inline-flex gap-2 items-center cursor-pointer text-xs text-emerald-800 font-bold border border-emerald-200 rounded-xl px-3 py-2 bg-emerald-50"><ImagePlus className="w-4 h-4"/>{busy?'Đang tải ảnh...':'Tải ảnh từ thiết bị'}
    <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={busy} onChange={async e=>{const file=e.target.files?.[0];if(!file)return;setBusy(true);setError('');try{onFile(await uploadSiteImage(file))}catch(err:any){setError(err.message)}finally{setBusy(false);e.target.value=''}}}/>{error&&<span role="alert" className="text-red-700">{error}</span>}</label>
}
export default function SiteContentStudio(){
  const {content:server,error:loadError}=useSiteContent();
  const [draft,setDraft]=useState<SiteContent>(server);
  const [dirty,setDirty]=useState(false),[publishing,setPublishing]=useState(false),[message,setMessage]=useState('');
  useEffect(()=>{if(!dirty)setDraft(server)},[server,dirty]);
  const edit=(patch:Partial<SiteContent>)=>{setDraft(s=>({...s,...patch}));setDirty(true)};
  const updateTile=(id:string,patch:Partial<HomeTile>)=>edit({tiles:draft.tiles.map(x=>x.id===id?{...x,...patch}:x)});
  const updateStory=(id:string,patch:Partial<FeaturedStory>)=>edit({stories:draft.stories.map(x=>x.id===id?{...x,...patch}:x)});
  const updateTicket=(id:string,patch:Partial<AttractionTicket>)=>edit({attractionTickets:(draft.attractionTickets||[]).map(x=>x.id===id?{...x,...patch}:x)});
  const moveTicket=(index:number,offset:number)=>{
    const tickets=[...(draft.attractionTickets||[])]; const target=index+offset;
    if(target<0||target>=tickets.length)return;
    [tickets[index],tickets[target]]=[tickets[target],tickets[index]];
    edit({attractionTickets:tickets});
  };
  const move=(key:'tiles'|'stories'|'heroSlides',i:number,offset:number)=>{const copy=[...(draft[key]||[])];const k=i+offset;if(k<0||k>=copy.length)return;[copy[i],copy[k]]=[copy[k],copy[i]];edit({[key]:copy})};
  const publish=async()=>{setPublishing(true);setMessage('');try{await publishSiteContent(draft);setDirty(false);setMessage('Đã xuất bản thành công. Trang khách sẽ nhận cấu hình mới từ Firestore.')}catch(err:any){setMessage('Không thể xuất bản: '+err.message)}finally{setPublishing(false)}};
  const inputClass='w-full rounded-xl border border-stone-200 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300';
  return <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-6 space-y-5 text-left">
    <div><h2 className="text-lg font-black text-[#1b4332]">Chỉnh sửa giao diện & Nội dung trang chủ</h2><p className="text-xs text-stone-500 mt-1">Logo · Banner · 12 danh mục · Bài HOT · Thông tin liên hệ. Chỉnh trên bản nháp rồi bấm Xuất bản.</p></div>
    {loadError&&<p className="bg-amber-50 rounded-xl p-3 text-xs text-amber-900">{loadError}</p>}
    {message&&<p role="status" className="rounded-xl p-3 bg-emerald-50 text-emerald-900 text-xs">{message}</p>}
    <section className="space-y-3"><h3 className="font-extrabold">Nhận diện & banner</h3>
      {[['siteName','Tên thương hiệu'],['tagline','Mô tả thương hiệu'],['heroTitle','Tiêu đề banner'],['heroDescription','Mô tả banner']].map(([k,label])=><label key={k} className="block text-xs font-bold">{label}<input className={`${inputClass} mt-1`} value={(draft as any)[k]} onChange={e=>edit({[k]:e.target.value})}/></label>)}
      {([['logoUrl','Logo'],['heroImageUrl','Banner chính']] as const).map(([k,label])=><div key={k} className="rounded-xl bg-stone-50 p-3 space-y-2"><p className="font-bold text-xs">{label}</p><img alt={label} src={draft[k]} className="w-full max-h-44 object-contain rounded-xl"/><input value={draft[k]} className={inputClass} onChange={e=>edit({[k]:e.target.value})}/><Uploader onFile={url=>edit({[k]:url})}/></div>)}
    </section>
    <section className="space-y-3">
      <div className="flex justify-between items-center gap-2"><h3 className="font-extrabold">Các banner chuyển tiếp</h3>
        <button className="text-emerald-800 text-xs font-bold inline-flex gap-1" onClick={()=>edit({heroSlides:[...(draft.heroSlides||[]),{id:`slide-${Date.now()}`,imageUrl:'',title:'Banner mới',description:'',target:'explore',visible:false}]})}><Plus className="w-4 h-4"/>Thêm banner</button></div>
      <p className="text-xs text-stone-500">Banner đầu tiên chỉnh ở phần trên; các banner sau sẽ tự chuyển và có nút qua lại trên trang Khám phá.</p>
      {(draft.heroSlides||[]).map((slide,i)=><div className="border rounded-xl p-3 space-y-2" key={slide.id}>
        <div className="flex items-center justify-between gap-2"><strong className="text-xs">Banner {i+2}</strong><div className="flex gap-2">
          <button aria-label="Lên" onClick={()=>move('heroSlides',i,-1)}><ArrowUp className="w-4 h-4"/></button><button aria-label="Xuống" onClick={()=>move('heroSlides',i,1)}><ArrowDown className="w-4 h-4"/></button>
          <button aria-label="Ẩn hiện" onClick={()=>edit({heroSlides:(draft.heroSlides||[]).map(x=>x.id===slide.id?{...x,visible:!x.visible}:x)})}>{slide.visible?<Eye className="w-4 h-4 text-emerald-700"/>:<EyeOff className="w-4 h-4"/>}</button>
          <button aria-label="Xóa" onClick={()=>edit({heroSlides:(draft.heroSlides||[]).filter(x=>x.id!==slide.id)})}><Trash2 className="w-4 h-4 text-red-600"/></button>
        </div></div>
        <input aria-label="Tên banner" className={inputClass} value={slide.title} onChange={e=>edit({heroSlides:(draft.heroSlides||[]).map(x=>x.id===slide.id?{...x,title:e.target.value}:x)})}/>
        <input aria-label="Mô tả banner" className={inputClass} value={slide.description} onChange={e=>edit({heroSlides:(draft.heroSlides||[]).map(x=>x.id===slide.id?{...x,description:e.target.value}:x)})}/>
        {slide.imageUrl&&<img src={slide.imageUrl} alt={slide.title} className="w-full h-28 object-cover rounded-xl"/>}
        <input aria-label="Đường dẫn ảnh" className={inputClass} value={slide.imageUrl} onChange={e=>edit({heroSlides:(draft.heroSlides||[]).map(x=>x.id===slide.id?{...x,imageUrl:e.target.value}:x)})}/>
        <Uploader onFile={url=>edit({heroSlides:(draft.heroSlides||[]).map(x=>x.id===slide.id?{...x,imageUrl:url}:x)})}/>
      </div>)}
    </section>
    <section className="space-y-3"><div className="flex justify-between items-center"><h3 className="font-extrabold">Danh mục trang chủ</h3><button onClick={()=>edit({tiles:[...draft.tiles,{id:`new-${Date.now()}`,title:'Danh mục mới',subtitle:'Mô tả',icon:'map-pin',target:'services',visible:false}]})} className="text-emerald-800 text-xs font-bold flex gap-1"><Plus className="w-4 h-4"/> Thêm mục</button></div>
      {draft.tiles.map((x,i)=><div key={x.id} className="border rounded-xl p-3 space-y-2"><div className="flex justify-between items-center"><strong className="text-xs">{i+1}. {x.title}</strong><div className="flex gap-2"><button aria-label="Lên" onClick={()=>move('tiles',i,-1)}><ArrowUp className="w-4 h-4"/></button><button aria-label="Xuống" onClick={()=>move('tiles',i,1)}><ArrowDown className="w-4 h-4"/></button><button aria-label="Ẩn hiện" onClick={()=>updateTile(x.id,{visible:!x.visible})}>{x.visible?<Eye className="w-4 h-4 text-emerald-700"/>:<EyeOff className="w-4 h-4"/>}</button><button aria-label="Xóa" onClick={()=>edit({tiles:draft.tiles.filter(t=>t.id!==x.id)})}><Trash2 className="w-4 h-4 text-red-600"/></button></div></div><div className="grid grid-cols-2 gap-2"><input aria-label="Tên danh mục" className={inputClass} value={x.title} onChange={e=>updateTile(x.id,{title:e.target.value})}/><input aria-label="Mô tả" className={inputClass} value={x.subtitle} onChange={e=>updateTile(x.id,{subtitle:e.target.value})}/><input aria-label="Icon" className={inputClass} value={x.icon} onChange={e=>updateTile(x.id,{icon:e.target.value})}/><select aria-label="Trang đến" className={inputClass} value={x.target} onChange={e=>updateTile(x.id,{target:e.target.value})}>{['explore_legacy','moc_chau_today','guide','ai','limousine','trip','community','services','motorbike','hot','combo'].map(t=><option key={t} value={t}>{t}</option>)}</select></div></div>)}
    </section>
    <section className="space-y-3"><div className="flex justify-between items-center"><h3 className="font-extrabold">Bài viết & điểm đến nổi bật</h3><button onClick={()=>edit({stories:[...draft.stories,{id:`hot-${Date.now()}`,title:'Bài nổi bật',description:'Mô tả ngắn',imageUrl:'',label:'Mới',target:'guide',visible:false}]})} className="text-emerald-800 text-xs font-bold flex gap-1"><Plus className="w-4 h-4"/> Thêm bài</button></div>
      {draft.stories.map((s,i)=><div className="border p-3 rounded-xl space-y-2" key={s.id}><div className="flex justify-between items-center"><strong className="text-xs">{i+1}. {s.title}</strong><div className="flex gap-2"><button aria-label="Lên" onClick={()=>move('stories',i,-1)}><ArrowUp className="w-4 h-4"/></button><button aria-label="Xuống" onClick={()=>move('stories',i,1)}><ArrowDown className="w-4 h-4"/></button><button aria-label="Ẩn hiện" onClick={()=>updateStory(s.id,{visible:!s.visible})}>{s.visible?<Eye className="w-4 h-4 text-emerald-700"/>:<EyeOff className="w-4 h-4"/>}</button><button aria-label="Xóa" onClick={()=>edit({stories:draft.stories.filter(t=>t.id!==s.id)})}><Trash2 className="w-4 h-4 text-red-600"/></button></div></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-2"><input className={inputClass} value={s.title} onChange={e=>updateStory(s.id,{title:e.target.value})}/><input className={inputClass} value={s.label} onChange={e=>updateStory(s.id,{label:e.target.value})}/><input className={inputClass} value={s.description} onChange={e=>updateStory(s.id,{description:e.target.value})}/><select aria-label="Liên kết bài" className={inputClass} value={s.target} onChange={e=>updateStory(s.id,{target:e.target.value})}>{['guide','explore_legacy','moc_chau_today','services','community'].map(t=><option key={t} value={t}>{t}</option>)}</select></div><img src={s.imageUrl} alt="Ảnh bài viết" className="rounded-xl object-cover h-32 w-full"/><input aria-label="URL ảnh" className={inputClass} value={s.imageUrl} onChange={e=>updateStory(s.id,{imageUrl:e.target.value})}/><Uploader onFile={url=>updateStory(s.id,{imageUrl:url})}/></div>)}
    </section>
    <section className="space-y-3">
      <div className="flex justify-between items-center gap-2">
        <div><h3 className="font-extrabold">Bảng giá vé tham quan Mộc Châu</h3><p className="text-xs text-stone-500 mt-1">Thêm, sửa, ẩn hoặc cập nhật giá theo nguồn công khai. Đây là giá tham khảo, chưa nhận đặt vé.</p></div>
        <button type="button" onClick={()=>edit({attractionTickets:[...(draft.attractionTickets||[]),{id:"ticket-"+Date.now(),name:"Địa điểm mới",adultPrice:"Đang cập nhật",childPrice:"Theo chính sách điểm đến",note:"Giá tham khảo, vui lòng kiểm tra nguồn",sourceUrl:"",visible:false}]})} className="text-emerald-800 text-xs font-bold flex items-center gap-1">
          <Plus className="w-4 h-4"/> Thêm điểm
        </button>
      </div>
      {(draft.attractionTickets||[]).map((ticket,i)=><div key={ticket.id} className="p-3 rounded-xl border border-stone-200 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <strong className="text-xs text-stone-900">{i+1}. {ticket.name}</strong>
          <div className="flex gap-2">
            <button type="button" aria-label="Đưa lên" onClick={()=>moveTicket(i,-1)}><ArrowUp className="w-4 h-4"/></button>
            <button type="button" aria-label="Đưa xuống" onClick={()=>moveTicket(i,1)}><ArrowDown className="w-4 h-4"/></button>
            <button type="button" aria-label={ticket.visible?"Ẩn giá vé":"Hiển thị giá vé"} onClick={()=>updateTicket(ticket.id,{visible:!ticket.visible})}>{ticket.visible?<Eye className="w-4 h-4 text-emerald-700"/>:<EyeOff className="w-4 h-4"/>}</button>
            <button type="button" aria-label="Xóa địa điểm" onClick={()=>edit({attractionTickets:(draft.attractionTickets||[]).filter(t=>t.id!==ticket.id)})}><Trash2 className="w-4 h-4 text-red-600"/></button>
          </div>
        </div>
        <label className="block text-xs font-bold">Tên địa điểm<input className={inputClass} value={ticket.name} onChange={e=>updateTicket(ticket.id,{name:e.target.value})}/></label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <label className="block text-xs font-bold">Giá vé người lớn<input className={inputClass} value={ticket.adultPrice} onChange={e=>updateTicket(ticket.id,{adultPrice:e.target.value})}/></label>
          <label className="block text-xs font-bold">Giá vé trẻ em<input className={inputClass} value={ticket.childPrice} onChange={e=>updateTicket(ticket.id,{childPrice:e.target.value})}/></label>
        </div>
        <label className="block text-xs font-bold">Lưu ý / giá theo ngày<textarea rows={2} className={inputClass} value={ticket.note} onChange={e=>updateTicket(ticket.id,{note:e.target.value})}/></label>
        <label className="block text-xs font-bold">Nguồn kiểm tra giá (HTTPS)<input className={inputClass} type="url" value={ticket.sourceUrl} onChange={e=>updateTicket(ticket.id,{sourceUrl:e.target.value})} placeholder="https://..."/></label>
      </div>)}
    </section>
    <section className="space-y-2"><h3 className="font-extrabold">Kênh liên hệ</h3>{([['hotline','Hotline'],['zaloUrl','Zalo'],['messengerUrl','Messenger']] as const).map(([k,label])=><label className="block text-xs font-bold" key={k}>{label}<input className={`${inputClass} mt-1`} value={draft[k]} onChange={e=>edit({[k]:e.target.value})}/></label>)}</section>
    <div className="sticky bottom-16 sm:bottom-4 rounded-2xl bg-white/95 backdrop-blur-md p-3 shadow-xl border flex justify-between items-center gap-2"><span className="text-xs text-stone-600">{dirty?'Có thay đổi chưa xuất bản':'Đang đồng bộ bản đã lưu'}</span><button disabled={publishing||!dirty} onClick={publish} className="bg-[#1b4332] text-white rounded-xl px-5 py-3 font-black text-sm disabled:opacity-40 flex gap-2"><Save className="w-4 h-4"/>{publishing?'Đang lưu...':'Xuất bản'}</button></div>
  </div>;
}
