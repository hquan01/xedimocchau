import React, {useEffect,useState} from 'react';
import {Save,ImagePlus,Plus,Trash2,ArrowUp,ArrowDown,Eye,EyeOff} from 'lucide-react';
import type {GuideArticle} from '../../types';
import {SiteContent,HomeTile,FeaturedStory,HeroSlide,AttractionTicket,useSiteContent,publishSiteContent,uploadSiteImage} from '../../lib/siteContent';

function Uploader({onFile}: {onFile:(url:string)=>void}) {
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [success,setSuccess]=useState('');
  const [preview,setPreview]=useState('');
  const [stage,setStage]=useState('');
  return <div className="space-y-2">
    <label className={`inline-flex gap-2 items-center cursor-pointer text-xs text-emerald-800 font-bold border border-emerald-200 rounded-xl px-3 py-2 bg-emerald-50 ${busy?'opacity-65':''}`}>
      <ImagePlus className="w-4 h-4"/>{busy?'Đang lưu ảnh...':'Thay ảnh từ thiết bị'}
      <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={busy}
        onChange={async e=>{
          const input=e.currentTarget;
          const file=input.files?.[0];
          if(!file)return;
          setBusy(true);setError('');setSuccess('');setPreview('');
          setStage('Đang đọc và tối ưu ảnh trên thiết bị...');
          try{
            const url=await uploadSiteImage(file,localPreview=>{
              setPreview(localPreview);
              setStage('Đã xem trước ảnh mới. Đang hoàn tất lưu ảnh lên máy chủ...');
            });
            onFile(url);
            setPreview('');setStage('');
            setSuccess(url.startsWith('data:')
              ?'Đã thêm ảnh đã nén vào bản nháp. Bấm Xuất bản để lưu lên website.'
              :'Đã tải ảnh lên máy chủ và thay trong bản nháp. Bấm Xuất bản để áp dụng.');
          }catch(err:any){
            setError(err?.message||'Không thể xử lý ảnh, vui lòng thử lại.');
            setStage('');
          }finally{
            setBusy(false);
            input.value='';
          }
        }}/>
    </label>
    {preview&&<div className="rounded-xl border border-emerald-200 p-2 bg-emerald-50">
      <p className="text-xs font-bold text-emerald-800 mb-1">Xem trước ảnh mới</p>
      <img src={preview} alt="Ảnh mới đang chờ lưu" className="w-full max-h-40 rounded-lg object-contain"/>
    </div>}
    {stage&&<p role="status" className="text-xs text-amber-800">{stage}</p>}
    {error&&<p role="alert" className="text-xs text-red-700 font-semibold">{error}</p>}
    {success&&<p role="status" className="text-xs text-emerald-800">{success}</p>}
  </div>;
}

function ArticleTargetSelect({value,onChange,articles,label}:{
  value:string;onChange:(next:string)=>void;articles:GuideArticle[];label:string;
}){
  const options=[
    ['guide','Danh sách Cẩm nang'],
    ['explore_legacy','Danh sách địa điểm'],
    ['moc_chau_today','Thời tiết & Mùa hoa'],
    ['services','Dịch vụ du lịch'],
    ['community','Cộng đồng'],
    ['limousine','Đặt xe QT Limousine']
  ];
  const hasArticle=value.startsWith('article:') && !articles.some(a=>a.id===value.slice(8));
  const knownOption=options.some(x=>x[0]===value)||articles.some(a=>'article:'+a.id===value);
  return <label className="block text-xs font-bold text-stone-700">
    {label}
    <select aria-label={label} value={value} onChange={e=>onChange(e.target.value)}
      className="w-full mt-1 rounded-xl border border-stone-200 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300">
      <option value="">Chọn bài viết hoặc trang cần mở...</option>
      {hasArticle&&<option value={value}>Bài đã chọn không còn tồn tại</option>}
      {!knownOption&&value&&!hasArticle&&<option value={value}>Trang hiện tại: {value}</option>}
      <optgroup label="MỞ TRỰC TIẾP BÀI VIẾT">
        {articles.map(a=><option value={`article:${a.id}`} key={a.id}>{a.title}</option>)}
      </optgroup>
      <optgroup label="Trang chức năng khác">
        {options.map(([target,name])=><option value={target} key={target}>{name}</option>)}
      </optgroup>
    </select>
    {hasArticle&&<span className="block mt-1 text-red-700">Bài viết liên kết đã bị xóa. Hãy chọn bài khác.</span>}
  </label>;
}

export default function SiteContentStudio({articles}: {articles:GuideArticle[]}){
  const {content:server,error:loadError}=useSiteContent();
  const [draft,setDraft]=useState<SiteContent>(server);
  const [editorSection,setEditorSection]=useState<'identity'|'slides'|'tiles'|'stories'|'tickets'|'contacts'>('identity');
  const editorTabs = [
    {id:'identity',label:'Logo & banner chính'},
    {id:'slides',label:'Banner chuyển tiếp'},
    {id:'tiles',label:'Danh mục trang chủ'},
    {id:'stories',label:'Bài HOT & điểm đến'},
    {id:'tickets',label:'Giá vé tham quan'},
    {id:'contacts',label:'Thông tin liên hệ'}
  ] as const;
  const [dirty,setDirty]=useState(false),[publishing,setPublishing]=useState(false),[message,setMessage]=useState('');
  useEffect(()=>{if(!dirty)setDraft(server)},[server,dirty]);
  const edit=(patch:Partial<SiteContent>|((current:SiteContent)=>Partial<SiteContent>))=>{setDraft(current=>({...current,...(typeof patch==='function'?patch(current):patch)}));setDirty(true)};
  const updateTile=(id:string,patch:Partial<HomeTile>)=>edit({tiles:draft.tiles.map(x=>x.id===id?{...x,...patch}:x)});
  const updateStory=(id:string,patch:Partial<FeaturedStory>)=>edit(current=>({stories:current.stories.map(x=>x.id===id?{...x,...patch}:x)}));
  const updateTicket=(id:string,patch:Partial<AttractionTicket>)=>edit({attractionTickets:(draft.attractionTickets||[]).map(x=>x.id===id?{...x,...patch}:x)});
  const moveTicket=(index:number,offset:number)=>{
    const tickets=[...(draft.attractionTickets||[])]; const target=index+offset;
    if(target<0||target>=tickets.length)return;
    [tickets[index],tickets[target]]=[tickets[target],tickets[index]];
    edit({attractionTickets:tickets});
  };
  const move=(key:'tiles'|'stories'|'heroSlides',i:number,offset:number)=>{const copy=[...(draft[key]||[])];const k=i+offset;if(k<0||k>=copy.length)return;[copy[i],copy[k]]=[copy[k],copy[i]];edit({[key]:copy})};
  const publish=async()=>{setPublishing(true);setMessage('');try{
    const targets=[draft.heroTarget,...(draft.heroSlides||[]).map(x=>x.target),...draft.stories.map(x=>x.target)].filter(Boolean) as string[];
    const invalid=targets.find(target=>target.startsWith('article:')&&!articles.some(a=>a.id===target.slice(8)));
    if(invalid)throw new Error('Một banner liên kết đến bài viết không tồn tại. Hãy chọn lại bài viết trước khi xuất bản.');
    await publishSiteContent(draft);
    setDirty(false);setMessage('Đã xuất bản thành công. Ảnh và liên kết bài viết được đồng bộ trên trang khách.');
  }catch(err:any){setMessage('Không thể xuất bản: '+(err?.message||'Lỗi không rõ'))}
  finally{setPublishing(false)}};
  const inputClass='w-full rounded-xl border border-stone-200 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300';
  return <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-6 pb-32 sm:pb-36 space-y-5 text-left">
    <div><h2 className="text-lg font-black text-[#1b4332]">Chỉnh sửa giao diện & Nội dung trang chủ</h2><p className="text-xs text-stone-500 mt-1">Logo · Banner · 12 danh mục · Bài HOT · Thông tin liên hệ. Chỉnh trên bản nháp rồi bấm Xuất bản.</p></div>
    {loadError&&<p className="bg-amber-50 rounded-xl p-3 text-xs text-amber-900">{loadError}</p>}
    {message&&<p role={message.startsWith('Không thể')?'alert':'status'} className={`rounded-xl p-3 text-xs font-semibold ${message.startsWith('Không thể')?'bg-red-50 text-red-900 border border-red-200':'bg-emerald-50 text-emerald-900'}`}>{message}</p>}
    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-2" role="tablist" aria-label="Chọn phần nội dung cần chỉnh sửa">
      <div className="flex overflow-x-auto gap-2 sm:flex-wrap pb-1">
        {editorTabs.map(tab=>(
          <button type="button" key={tab.id} role="tab"
            aria-selected={editorSection===tab.id}
            onClick={()=>setEditorSection(tab.id)}
            className={"shrink-0 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-colors "+
              (editorSection===tab.id?"bg-[#1b4332] text-white shadow-sm":"bg-white text-stone-700 border border-stone-200 hover:bg-emerald-50")}>
            {tab.label}
          </button>
        ))}
      </div>
      <p className="px-2 pt-2 text-[11px] text-stone-500">
        Chỉ hiển thị nội dung đang chọn. Các chỉnh sửa ở mục khác vẫn giữ trong bản nháp cho đến khi Xuất bản.
      </p>
    </div>
    {editorSection === 'identity' && (
    <section className="space-y-3"><h3 className="font-extrabold">Nhận diện & banner</h3>
      {[['siteName','Tên thương hiệu'],['tagline','Mô tả thương hiệu'],['heroTitle','Tiêu đề banner'],['heroDescription','Mô tả banner']].map(([k,label])=><label key={k} className="block text-xs font-bold">{label}<input className={`${inputClass} mt-1`} value={(draft as any)[k]} onChange={e=>edit({[k]:e.target.value})}/></label>)}
      {([['logoUrl','Logo'],['heroImageUrl','Banner chính']] as const).map(([k,label])=><div key={k} className="rounded-xl bg-stone-50 p-3 space-y-2"><p className="font-bold text-xs">{label}</p><img alt={label} src={draft[k]} className="w-full max-h-44 object-contain rounded-xl"/><input aria-label={`URL ảnh ${label}`} value={draft[k].startsWith('data:')?'(Ảnh đã tải từ thiết bị – nhấn Xuất bản)':draft[k]} readOnly={draft[k].startsWith('data:')} className={inputClass} onChange={e=>edit({[k]:e.target.value})}/><Uploader onFile={url=>edit({[k]:url})}/></div>)}
      <ArticleTargetSelect label="Khi bấm banner chính, mở bài viết" value={draft.heroTarget||'article:guide-1'} onChange={target=>edit({heroTarget:target})} articles={articles}/>
      <p className="text-xs text-stone-600">Khách bấm vào hình banner chính sẽ mở trực tiếp bài viết bạn chọn.</p>
    </section>
    )}
    {editorSection === 'slides' && (
    <section className="space-y-3">
      <div className="flex justify-between items-center gap-2"><h3 className="font-extrabold">Các banner chuyển tiếp</h3>
        <button className="text-emerald-800 text-xs font-bold inline-flex gap-1" onClick={()=>edit({heroSlides:[...(draft.heroSlides||[]),{id:`slide-${Date.now()}`,imageUrl:'',title:'Banner mới',description:'',target:articles[0]?`article:${articles[0].id}`:'guide',visible:false}]})}><Plus className="w-4 h-4"/>Thêm banner</button></div>
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
        <input aria-label="Đường dẫn ảnh" className={inputClass} value={slide.imageUrl.startsWith('data:')?'(Ảnh đã tải từ thiết bị – nhấn Xuất bản)':slide.imageUrl} readOnly={slide.imageUrl.startsWith('data:')} onChange={e=>edit(current=>({heroSlides:(current.heroSlides||[]).map(x=>x.id===slide.id?{...x,imageUrl:e.target.value}:x)}))}/>
        <Uploader onFile={url=>edit(current=>({heroSlides:(current.heroSlides||[]).map(x=>x.id===slide.id?{...x,imageUrl:url}:x)}))}/>
        <ArticleTargetSelect label="Khi khách bấm banner, mở" value={slide.target} articles={articles} onChange={target=>edit(current=>({heroSlides:(current.heroSlides||[]).map(x=>x.id===slide.id?{...x,target}:x)}))}/>
      </div>)}
    </section>
    )}
    {editorSection === 'tiles' && (
    <section className="space-y-3"><div className="flex justify-between items-center"><h3 className="font-extrabold">Danh mục trang chủ</h3><button onClick={()=>edit({tiles:[...draft.tiles,{id:`new-${Date.now()}`,title:'Danh mục mới',subtitle:'Mô tả',icon:'map-pin',target:'services',visible:false}]})} className="text-emerald-800 text-xs font-bold flex gap-1"><Plus className="w-4 h-4"/> Thêm mục</button></div>
      {draft.tiles.map((x,i)=><div key={x.id} className="border rounded-xl p-3 space-y-2"><div className="flex justify-between items-center"><strong className="text-xs">{i+1}. {x.title}</strong><div className="flex gap-2"><button aria-label="Lên" onClick={()=>move('tiles',i,-1)}><ArrowUp className="w-4 h-4"/></button><button aria-label="Xuống" onClick={()=>move('tiles',i,1)}><ArrowDown className="w-4 h-4"/></button><button aria-label="Ẩn hiện" onClick={()=>updateTile(x.id,{visible:!x.visible})}>{x.visible?<Eye className="w-4 h-4 text-emerald-700"/>:<EyeOff className="w-4 h-4"/>}</button><button aria-label="Xóa" onClick={()=>edit({tiles:draft.tiles.filter(t=>t.id!==x.id)})}><Trash2 className="w-4 h-4 text-red-600"/></button></div></div><div className="grid grid-cols-2 gap-2"><input aria-label="Tên danh mục" className={inputClass} value={x.title} onChange={e=>updateTile(x.id,{title:e.target.value})}/><input aria-label="Mô tả" className={inputClass} value={x.subtitle} onChange={e=>updateTile(x.id,{subtitle:e.target.value})}/><input aria-label="Icon" className={inputClass} value={x.icon} onChange={e=>updateTile(x.id,{icon:e.target.value})}/><select aria-label="Trang đến" className={inputClass} value={x.target} onChange={e=>updateTile(x.id,{target:e.target.value})}>{['explore_legacy','moc_chau_today','guide','ai','limousine','trip','community','services','motorbike','hot','combo'].map(t=><option key={t} value={t}>{t}</option>)}</select></div></div>)}
    </section>
    )}
    {editorSection === 'stories' && (
    <section className="space-y-3"><div className="flex justify-between items-center"><h3 className="font-extrabold">Bài viết & điểm đến nổi bật</h3><button onClick={()=>edit({stories:[...draft.stories,{id:`hot-${Date.now()}`,title:'Bài nổi bật',description:'Mô tả ngắn',imageUrl:'',label:'Mới',target:articles[0]?`article:${articles[0].id}`:'guide',visible:false}]})} className="text-emerald-800 text-xs font-bold flex gap-1"><Plus className="w-4 h-4"/> Thêm bài</button></div>
      {draft.stories.map((s,i)=><div className="border p-3 rounded-xl space-y-2" key={s.id}><div className="flex justify-between items-center"><strong className="text-xs">{i+1}. {s.title}</strong><div className="flex gap-2"><button aria-label="Lên" onClick={()=>move('stories',i,-1)}><ArrowUp className="w-4 h-4"/></button><button aria-label="Xuống" onClick={()=>move('stories',i,1)}><ArrowDown className="w-4 h-4"/></button><button aria-label="Ẩn hiện" onClick={()=>updateStory(s.id,{visible:!s.visible})}>{s.visible?<Eye className="w-4 h-4 text-emerald-700"/>:<EyeOff className="w-4 h-4"/>}</button><button aria-label="Xóa" onClick={()=>edit({stories:draft.stories.filter(t=>t.id!==s.id)})}><Trash2 className="w-4 h-4 text-red-600"/></button></div></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-2"><input className={inputClass} value={s.title} onChange={e=>updateStory(s.id,{title:e.target.value})}/><input className={inputClass} value={s.label} onChange={e=>updateStory(s.id,{label:e.target.value})}/><input className={inputClass} value={s.description} onChange={e=>updateStory(s.id,{description:e.target.value})}/><ArticleTargetSelect label="Bài viết mở khi bấm thẻ HOT" value={s.target} articles={articles} onChange={target=>updateStory(s.id,{target})}/></div>{s.imageUrl&&<img src={s.imageUrl} alt="Ảnh bài viết" className="rounded-xl object-cover h-32 w-full"/>}<input aria-label="URL ảnh" className={inputClass} value={s.imageUrl.startsWith('data:')?'(Ảnh đã tải từ thiết bị – nhấn Xuất bản)':s.imageUrl} readOnly={s.imageUrl.startsWith('data:')} onChange={e=>updateStory(s.id,{imageUrl:e.target.value})}/><Uploader onFile={url=>updateStory(s.id,{imageUrl:url})}/></div>)}
    </section>
    )}
    {editorSection === 'tickets' && (
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
    )}
    {editorSection === 'contacts' && (
    <section className="space-y-2"><h3 className="font-extrabold">Kênh liên hệ</h3>{([['hotline','Hotline'],['zaloUrl','Zalo'],['messengerUrl','Messenger']] as const).map(([k,label])=><label className="block text-xs font-bold" key={k}>{label}<input className={`${inputClass} mt-1`} value={draft[k]} onChange={e=>edit({[k]:e.target.value})}/></label>)}</section>
    )}
    <div className="fixed bottom-0 right-0 left-0 md:left-64 z-[65] bg-white/95 backdrop-blur-md px-4 sm:px-7 py-3 shadow-[0_-6px_24px_rgba(0,0,0,0.12)] border-t border-emerald-100 flex justify-between items-center gap-3" style={{paddingBottom:'max(0.75rem, env(safe-area-inset-bottom))'}}>
      <div className="min-w-0">
        <p className="text-xs font-black text-[#1b4332]">Xuất bản nội dung website</p>
        <p className="text-[11px] text-stone-600">{dirty?'Bạn có thay đổi chưa xuất bản':'Bản nháp đang đồng bộ, chưa có thay đổi'}</p>
        {message&&<p role={message.startsWith('Không thể')?'alert':'status'} className={`text-[11px] font-semibold max-w-lg ${message.startsWith('Không thể')?'text-red-700':'text-emerald-700'}`}>{message}</p>}
      </div>
      <button type="button" disabled={publishing||!dirty} onClick={publish}
        className="shrink-0 bg-[#1b4332] text-white rounded-xl px-5 py-3 font-black text-sm disabled:opacity-40 inline-flex items-center justify-center gap-2 min-h-[44px]">
        <Save className="w-4 h-4"/>{publishing?'Đang lưu...':'Xuất bản'}
      </button>
    </div>
  </div>;
}
