import React,{useState} from 'react';
import {MessageCircle,Phone,Send,Bot,X,ChevronUp} from 'lucide-react';
import {useSiteContent} from '../lib/siteContent';

/** One compact support launcher replaces overlapping AI/Zalo/phone bubbles on mobile. */
export default function FloatingContact(){
  const [open,setOpen]=useState(false);
  const {content}=useSiteContent();
  const phone=(content.hotline||'').replace(/\D/g,'');
  const links=[
    {name:'Nhắn Zalo',href:content.zaloUrl,icon:MessageCircle,color:'bg-blue-600'},
    {name:'Messenger',href:content.messengerUrl,icon:Send,color:'bg-sky-500'},
    {name:'Gọi trực tiếp',href:`tel:${phone}`,icon:Phone,color:'bg-emerald-700'}
  ].filter(x=>x.href&&(/^https:\/\//.test(x.href)||x.href.startsWith('tel:')));
  return <aside className="fixed bottom-[calc(75px+env(safe-area-inset-bottom,0px))] right-3 sm:bottom-6 sm:right-6 z-[85] print:hidden" aria-label="Hỗ trợ Mộc Châu Travel">
    {open&&<div className="mb-2 bg-white border border-stone-200 rounded-2xl shadow-2xl p-2 min-w-[214px] space-y-1">
      <p className="px-3 py-2 font-black text-xs text-[#1b4332]">Cần hỗ trợ chuyến đi?</p>
      <button onClick={()=>{setOpen(false);window.dispatchEvent(new Event('mocchau:open-ai'))}} className="w-full flex gap-2.5 items-center rounded-xl p-2.5 hover:bg-emerald-50 text-left text-sm font-bold text-[#1b4332]"><span className="p-2 rounded-xl bg-emerald-100"><Bot className="w-4 h-4"/></span>Chat tư vấn AI</button>
      {links.map(x=>{const Icon=x.icon;return <a key={x.name} href={x.href} target={x.href.startsWith('tel:')?undefined:'_blank'} rel="noopener noreferrer" className="flex gap-2.5 items-center rounded-xl p-2.5 hover:bg-stone-50 text-sm text-stone-800 font-bold"><span className={`${x.color} rounded-xl p-2 text-white`}><Icon className="w-4 h-4"/></span>{x.name}</a>})}
    </div>}
    <div className="flex justify-end"><button type="button" onClick={()=>setOpen(v=>!v)} aria-label={open?'Đóng hỗ trợ':'Mở tư vấn AI, Zalo, Messenger và gọi điện'} aria-expanded={open} className="w-12 h-12 rounded-full bg-emerald-700 text-white shadow-xl border-2 border-white/90 flex items-center justify-center hover:bg-emerald-800 active:scale-95 transition"><span>{open?<X className="w-5 h-5"/>:<MessageCircle className="w-5 h-5"/>}</span></button></div>
  </aside>
}
