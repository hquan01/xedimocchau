import React, {useEffect, useRef, useState} from 'react';
import {ArrowUpRight, Play, Video} from 'lucide-react';

export const VERIFIED_TIKTOK_PROFILE='https://www.tiktok.com/@limousinemocchau';
const VIDEO_RE=/^https:\/\/(?:www\.)?tiktok\.com\/@limousinemocchau\/video\/(\d{15,22})(?:[?#].*)?$/i;

export function validTikTokVideos(value:string[]){
  return [...new Set(value.map(x=>x.trim()).filter(x=>VIDEO_RE.test(x)))].slice(0,4);
}

/**
 * TikTok Creator Profile Embed updates its own recent-video list without
 * scraping. The official embed can show up to 10 videos rather than exactly 4.
 * For an exact four-video selection, Admin can enter original post links.
 * The remote TikTok script is never requested before this section nears view.
 */
export default function TikTokShowcase({videoLinks=[]}: {videoLinks?:string[]}){
  const section=useRef<HTMLElement|null>(null);
  const [near,setNear]=useState(false);
  const [selected,setSelected]=useState<string|null>(null);
  const videos=validTikTokVideos(videoLinks);
  useEffect(()=>{
    if(!section.current)return;
    if(!('IntersectionObserver' in window)){setNear(true);return;}
    const observer=new IntersectionObserver(entries=>{
      if(entries.some(x=>x.isIntersecting)){setNear(true);observer.disconnect();}
    },{rootMargin:'320px 0px'});
    observer.observe(section.current);
    return ()=>observer.disconnect();
  },[]);
  useEffect(()=>{
    if(!near||videos.length)return;
    const id='qt-tiktok-profile-embed';
    if(document.getElementById(id))return;
    const script=document.createElement('script');
    script.id=id;script.async=true;script.src='https://www.tiktok.com/embed.js';
    script.onerror=()=>{script.remove();};
    document.body.appendChild(script);
  },[near,videos.length]);
  return <section ref={section} id="tiktok_moc_chau" aria-label="Video TikTok QT Limousine"
    className="rounded-3xl border border-emerald-100 bg-white p-4 sm:p-6 space-y-4">
    <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
      <div><h2 className="text-lg sm:text-2xl font-black text-[#1b4332] flex items-center gap-2"><Video className="w-6 h-6 text-rose-600"/> Mộc Châu qua những thước phim</h2>
      <p className="text-xs sm:text-sm text-stone-600 mt-1">Video thực tế từ kênh TikTok @limousinemocchau</p></div>
      <a href={VERIFIED_TIKTOK_PROFILE} target="_blank" rel="noopener noreferrer"
        className="rounded-xl bg-stone-950 text-white px-4 py-3 text-xs sm:text-sm font-bold inline-flex gap-2 items-center">Theo dõi TikTok <ArrowUpRight className="w-4 h-4"/></a>
    </div>
    {!near ? <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" aria-hidden="true">
      {[0,1,2,3].map(i=><div key={i} className="aspect-[9/16] bg-stone-100 animate-pulse rounded-2xl"/>)}
    </div> : videos.length>0 ? (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {videos.map((url,i)=>{
          const id=url.match(VIDEO_RE)?.[1];
          return <div key={url} className="aspect-[9/16] bg-[#12261e] text-white rounded-2xl relative overflow-hidden">
            {selected===url&&id? <iframe loading="lazy" title={`Video TikTok QT Limousine ${i+1}`}
              src={`https://www.tiktok.com/player/v1/${id}?autoplay=0`} className="w-full h-full" allow="encrypted-media; picture-in-picture; fullscreen" referrerPolicy="strict-origin-when-cross-origin"/>:
              <button type="button" onClick={()=>setSelected(url)} className="w-full h-full flex flex-col gap-3 justify-center items-center px-3 text-center">
                <span className="w-14 h-14 rounded-full bg-white/15 grid place-items-center"><Play className="w-7 h-7 fill-white"/></span>
                <span className="font-bold text-xs">Xem video {i+1}</span>
                <span className="text-[10px] text-white/70">Chỉ tải video khi bạn bấm xem</span>
              </button>}
            <a href={url} target="_blank" rel="noopener noreferrer" className="absolute bottom-2 right-2 text-[10px] rounded-lg bg-black/70 px-2 py-1">TikTok ↗</a>
          </div>
        })}
      </div>
    ) : (
      <div className="flex justify-center min-h-[280px] rounded-2xl bg-stone-50 p-2 sm:p-4">
        <blockquote className="tiktok-embed" cite={VERIFIED_TIKTOK_PROFILE}
          data-unique-id="limousinemocchau" data-embed-type="creator"
          style={{maxWidth:'720px',minWidth:'min(288px, 100%)',width:'100%'}}>
          <section><a href={VERIFIED_TIKTOK_PROFILE} target="_blank" rel="noopener noreferrer">@limousinemocchau — Xem video mới trên TikTok</a></section>
        </blockquote>
      </div>
    )}
    <p className="text-xs text-stone-500">Video được cung cấp bởi TikTok. Nếu trình duyệt chặn nhúng, bạn vẫn có thể mở kênh bằng nút Theo dõi TikTok.</p>
  </section>;
}
