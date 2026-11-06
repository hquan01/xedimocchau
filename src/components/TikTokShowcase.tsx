import React, {useEffect, useRef, useState} from 'react';
import {ArrowUpRight, ExternalLink, Play, Video, X} from 'lucide-react';

export const VERIFIED_TIKTOK_PROFILE='https://www.tiktok.com/@limousinemocchau';
const VIDEO_RE=/^https:\/\/(?:www\.)?tiktok\.com\/@limousinemocchau\/video\/(\d{15,22})(?:[?#].*)?$/i;

export function validTikTokVideos(value:string[]){
  return [...new Set(value.map(x=>x.trim()).filter(x=>VIDEO_RE.test(x)))].slice(0,4);
}

interface TikTokItem {
  id:string;
  url:string;
  title:string;
  cover:string;
}
function fromManualLinks(links:string[]):TikTokItem[]{
  return validTikTokVideos(links).map((url,i)=>({
    id:url.match(VIDEO_RE)![1],
    url,title:`Video ${i+1} từ QT Limousine`,cover:''
  }));
}
function safeRecentVideos(data:unknown):TikTokItem[]{
  if(!data || typeof data!=='object' || !('videos' in data))return [];
  const raw=(data as {videos?:unknown}).videos;
  if(!Array.isArray(raw))return [];
  return raw.slice(0,4).flatMap((entry):TikTokItem[]=>{
    if(!entry || typeof entry!=='object')return [];
    const item=entry as Record<string,unknown>;
    const url=String(item.url||'');
    const match=url.match(VIDEO_RE);
    if(!match)return [];
    return [{id:match[1],url,title:String(item.title||'Video mới từ QT Limousine').slice(0,100),
      cover:/^https:\/\//.test(String(item.cover||''))?String(item.cover):''}];
  });
}

/**
 * Do not mount TikTok Creator Profile Embed at all: its remote embed script can
 * return "overload-protect triggered" inside an opaque cross-origin iframe.
 * Instead the page always shows its own responsive UI. A TikTok player iframe
 * is requested only after a visitor specifically clicks a video.
 *
 * Recent 4 videos need an approved TikTok Display API access token on the server.
 * Without credentials the website never invents videos: Admin may pin 3-4 real
 * video URLs, or the UI provides a lightweight, reliable link to the channel.
 */
export default function TikTokShowcase({videoLinks=[]}:{videoLinks?:string[]}){
  const section=useRef<HTMLElement|null>(null);
  const [near,setNear]=useState(false);
  const [apiVideos,setApiVideos]=useState<TikTokItem[]>([]);
  const [activeId,setActiveId]=useState<string|null>(null);
  const manual=fromManualLinks(videoLinks);
  const videos=manual.length?manual:apiVideos;
  useEffect(()=>{
    if(!section.current)return;
    if(!('IntersectionObserver' in window)){setNear(true);return;}
    const observer=new IntersectionObserver(entries=>{
      if(entries.some(entry=>entry.isIntersecting)){
        setNear(true);observer.disconnect();
      }
    },{rootMargin:'280px 0px'});
    observer.observe(section.current);
    return ()=>observer.disconnect();
  },[]);
  useEffect(()=>{
    if(!near||manual.length)return;
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),5500);
    fetch('/api/tiktok/recent',{signal:controller.signal})
      .then(response=>response.ok?response.json():null)
      .then(result=>{if(!controller.signal.aborted)setApiVideos(safeRecentVideos(result))})
      .catch(()=>{/* TikTok authentication or network may be unavailable; show profile CTA. */})
      .finally(()=>clearTimeout(timer));
    return ()=>{controller.abort();clearTimeout(timer)};
  },[near,videoLinks.join('|')]);

  return <section ref={section} id="tiktok_moc_chau" aria-label="Video TikTok QT Limousine"
    className="rounded-3xl border border-emerald-100 bg-white p-4 sm:p-6 space-y-4">
    <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
      <div>
        <h2 className="text-lg sm:text-2xl font-black text-[#1b4332] flex items-center gap-2">
          <Video className="w-6 h-6 text-rose-600"/> Mộc Châu qua những thước phim
        </h2>
        <p className="text-xs sm:text-sm text-stone-600 mt-1">Kênh TikTok chính thức của QT Limousine — @limousinemocchau</p>
      </div>
      <a href={VERIFIED_TIKTOK_PROFILE} target="_blank" rel="noopener noreferrer"
        className="rounded-xl bg-stone-950 text-white px-4 py-3 min-h-11 text-xs sm:text-sm font-bold inline-flex gap-2 items-center">
        Theo dõi TikTok <ArrowUpRight className="w-4 h-4"/>
      </a>
    </div>
    {!near ? <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" aria-hidden="true">
      {[0,1,2,3].map(i=><div key={i} className="aspect-[9/16] max-h-[340px] rounded-2xl bg-stone-100"/>)}
    </div> : videos.length>0 ? (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {videos.map((item,i)=><article key={item.id}
          className="relative min-w-0 aspect-[9/16] max-h-[380px] rounded-2xl overflow-hidden bg-gradient-to-b from-[#27694c] via-[#163d2e] to-[#0b211b] text-white shadow-sm">
          {activeId===item.id ? <>
            <iframe key={item.id} loading="lazy" title={`TikTok QT Limousine — video ${i+1}`}
              src={`https://www.tiktok.com/player/v1/${item.id}?autoplay=0`}
              className="absolute inset-0 w-full h-full" referrerPolicy="strict-origin-when-cross-origin"
              allow="encrypted-media; picture-in-picture; fullscreen"/>
            <button type="button" onClick={()=>setActiveId(null)} aria-label="Đóng trình phát TikTok"
              className="absolute top-2 right-2 z-10 rounded-full bg-black/80 p-2.5"><X className="w-4 h-4"/></button>
          </> : <>
            {item.cover&&<img src={item.cover} alt="" loading="lazy" referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover opacity-75"
              onError={e=>{e.currentTarget.style.display='none'}}/>}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30 pointer-events-none"/>
            <span className="absolute top-3 left-3 text-[10px] font-extrabold bg-white/90 text-[#1b4332] rounded-lg px-2.5 py-1">TikTok #{i+1}</span>
            <button type="button" onClick={()=>setActiveId(item.id)}
              className="absolute inset-x-2 top-[21%] bottom-[23%] flex flex-col items-center justify-center gap-3"
              aria-label={`Phát video TikTok ${i+1} trong trang`}>
              <span className="w-14 h-14 rounded-full bg-white/25 border border-white/40 backdrop-blur-sm grid place-items-center">
                <Play className="w-7 h-7 fill-white"/>
              </span>
              <span className="text-xs font-bold">Bấm để phát video</span>
            </button>
            <p className="absolute bottom-14 inset-x-3 font-bold text-xs sm:text-sm line-clamp-2">{item.title}</p>
          </>}
          <a href={item.url} target="_blank" rel="noopener noreferrer"
            className="absolute bottom-2 inset-x-2 z-10 rounded-lg bg-black/85 text-white px-2 py-2 text-xs font-bold flex items-center justify-center gap-1">
            Xem trực tiếp TikTok <ExternalLink className="w-3.5 h-3.5"/>
          </a>
        </article>)}
      </div>
    ) : (
      <div className="rounded-2xl bg-gradient-to-br from-[#153f32] via-[#1b5844] to-[#10291f] p-6 sm:p-8 text-white flex flex-col sm:flex-row sm:items-center gap-5 min-h-[170px]">
        <div className="w-16 h-16 rounded-2xl bg-white/15 grid place-items-center shrink-0">
          <Play className="w-9 h-9 fill-white"/>
        </div>
        <div className="flex-1">
          <h3 className="font-black text-lg">Xem những video Mộc Châu mới nhất</h3>
          <p className="text-xs sm:text-sm text-white/80 mt-1 max-w-xl">
            TikTok đang hạn chế nhúng video tự động. Mở kênh để xem những clip thật về chuyến xe và du lịch Mộc Châu.
          </p>
        </div>
        <a href={VERIFIED_TIKTOK_PROFILE} target="_blank" rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-white text-[#1b4332] px-5 py-3 min-h-11 text-sm font-extrabold">
          Xem video mới <ArrowUpRight className="w-4 h-4"/>
        </a>
      </div>
    )}
    <p className="text-xs text-stone-500">
      Video do TikTok cung cấp. Nếu trình phát bị giới hạn, chọn “Xem trực tiếp TikTok” để không bị gián đoạn.
    </p>
  </section>;
}
