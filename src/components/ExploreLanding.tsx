import React, {useEffect,useState} from 'react';
import {CloudSun,Sparkles,Flower2,BookOpen,MapPin,Flame,Bus,Car,Bike,House,UtensilsCrossed,Ticket,ArrowRight,Heart,ChevronRight,ChevronLeft,MessageCircle,UsersRound} from 'lucide-react';
import {useSiteContent,HomeTile,FeaturedStory} from '../lib/siteContent';

interface Props {setActiveTab:(tab:string)=>void;onOpenLimousineBooking:()=>void;openMotorbike:()=>void;openAuth:()=>void;isSignedIn:boolean}
const icons:Record<string,React.ComponentType<any>>={'cloud-sun':CloudSun,users:UsersRound,sparkles:Sparkles,flower:Flower2,'book-open':BookOpen,'map-pin':MapPin,flame:Flame,bus:Bus,car:Car,bike:Bike,home:House,utensils:UtensilsCrossed,ticket:Ticket};

export default function ExploreLanding({setActiveTab,onOpenLimousineBooking,openMotorbike,openAuth,isSignedIn}:Props){
  const {content}=useSiteContent();
  const [slideIndex,setSlideIndex]=useState(0);
  const heroSlides=[
    {id:'main',imageUrl:content.heroImageUrl,title:content.heroTitle,description:content.heroDescription,target:'explore',visible:true},
    ...(content.heroSlides||[]).filter(x=>x.visible && !!x.imageUrl)
  ];
  const currentSlide=heroSlides[slideIndex % heroSlides.length];
  useEffect(()=>{const timer=window.setInterval(()=>setSlideIndex(i=>i+1),6500);return()=>window.clearInterval(timer)},[heroSlides.length]);
  const navigate=(target:string)=>{
    // The QT Limousine tile must open the actual booking form, never just the
    // generic route-search Hero. Also works with saved/custom home tile config.
    if(target==='limousine'){onOpenLimousineBooking();return;}
    if(target==='hot'){document.getElementById('hot_stories')?.scrollIntoView({behavior:'smooth',block:'start'});return;}
    if(target==='motorbike'){openMotorbike();return;}
    if(target==='ai'){window.dispatchEvent(new Event('mocchau:open-ai'));return;}
    if(target==='ticket-prices'){
      try {sessionStorage.setItem('mocchau_services_open_category','tour')} catch {}
      setActiveTab('services');
      window.scrollTo({top:0,behavior:'smooth'});
      return;
    }
    setActiveTab(target); window.scrollTo({top:0,behavior:'smooth'});
  };
  const navigateTile = (tile:HomeTile) => {
    if(tile.id==='limousine') {onOpenLimousineBooking();return;}
    if(tile.target==='ticket-prices') {navigate('ticket-prices');return;}
    const serviceCategory:Record<string,string>={
      taxi:'transport',stay:'accommodation',food:'restaurant',
      tour:'tour',motorbike:'motorbike'
    };
    if(tile.target==='services' && serviceCategory[tile.id]){
      try {sessionStorage.setItem('mocchau_services_open_category',serviceCategory[tile.id]);} catch {}
    }
    navigate(tile.target);
  };
  // The published Firebase site config may predate the new Community tile.
  // Add it visibly after Weather without discarding any saved tile order.
  const communityTile:HomeTile={
    id:'community',title:'Cộng đồng',subtitle:'Hỏi đáp · nhóm Zalo',
    icon:'users',target:'community',visible:true
  };
  const otherTiles=content.tiles.filter(x=>x.id!=='community'&&x.visible);
  const communitySaved=content.tiles.find(x=>x.id==='community');
  const pinnedCommunity={...communityTile,...communitySaved,target:'community',visible:true};
  const weatherPosition=otherTiles.findIndex(x=>x.id==='weather');
  const communityPosition=weatherPosition<0?0:weatherPosition+1;
  const tiles=[
    ...otherTiles.slice(0,communityPosition),
    pinnedCommunity,
    ...otherTiles.slice(communityPosition)
  ];
  const hot=content.stories.filter(x=>x.visible);
  return <div className="bg-[#f7faf7] text-[#17382b] pb-28 min-h-screen" id="explore_mobile_home">
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 space-y-6">
      <section className="relative overflow-hidden rounded-[24px] shadow-lg bg-[#1b4332]" aria-label="Khám phá Mộc Châu">
        <img key={currentSlide.id} src={currentSlide.imageUrl} alt={currentSlide.title} className="w-full aspect-[1009/440] sm:aspect-[1009/350] object-cover" loading="eager"/>
        {(slideIndex % heroSlides.length !== 0 || currentSlide.imageUrl !== '/mocchau-hero-v5.jpg') && <div className="absolute inset-x-0 bottom-0 px-5 pt-16 pb-10 sm:p-8 bg-gradient-to-t from-[#0e291f]/95 via-[#0e291f]/30 to-transparent text-white pointer-events-none">
          <p className="text-[10px] sm:text-xs tracking-[0.16em] font-black uppercase text-emerald-100">Mộc Châu Travel · QT Limousine</p>
          <h2 className="text-xl sm:text-4xl font-black leading-tight mt-1">{currentSlide.title}</h2>
          <p className="text-[11px] sm:text-base mt-1 text-white/90 max-w-lg">{currentSlide.description}</p>
        </div>}
        {heroSlides.length>1 && <>
          <button type="button" aria-label="Ảnh banner trước" onClick={()=>setSlideIndex(i=>(i-1+heroSlides.length)%heroSlides.length)} className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/30 hover:bg-black/60 text-white rounded-full p-2"><ChevronLeft className="w-5 h-5"/></button>
          <button type="button" aria-label="Ảnh banner tiếp theo" onClick={()=>setSlideIndex(i=>(i+1)%heroSlides.length)} className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/30 hover:bg-black/60 text-white rounded-full p-2"><ChevronRight className="w-5 h-5"/></button>
          {/* The original hero artwork already has decorative dots baked into its pixels.
              Mask only that narrow strip; preserve the supplied photograph and keep a
              single, fully interactive set of navigation buttons over it. */}
          {currentSlide.imageUrl === '/mocchau-hero-v5.jpg' && (
            <div aria-hidden="true" className="absolute pointer-events-none bottom-0 left-1/2 -translate-x-1/2 w-[200px] h-14" style={{background: 'linear-gradient(to top, #113c29 0%, #113c29 78%, transparent 100%)'}} />
          )}
          <div role="group" aria-label="Chọn ảnh banner" className="absolute bottom-2.5 inset-x-0 z-10 flex justify-center gap-3">
            {heroSlides.map((slide,i)=><button key={slide.id} type="button" aria-label={`Xem banner ${i+1}`} aria-current={i===slideIndex%heroSlides.length ? 'true' : undefined} onClick={()=>setSlideIndex(i)} className={`w-3 h-3 rounded-full border-2 border-white shadow-md transition-colors ${i===slideIndex%heroSlides.length?'bg-white':'bg-black/25'}`}/>) }
          </div>
        </>}
      </section>
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2"><h2 className="text-lg sm:text-2xl font-black">🌿 Bạn muốn tìm gì?</h2><button onClick={()=>navigate('services')} className="text-xs text-emerald-700 font-bold whitespace-nowrap">Xem dịch vụ <ChevronRight className="inline w-3 h-3"/></button></div>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {tiles.map((tile:HomeTile)=>{const Icon=icons[tile.icon]||MapPin;return <button key={tile.id} onClick={()=>navigateTile(tile)} className="group bg-white border border-[#e2ebe4] shadow-sm rounded-2xl px-1.5 py-4 flex flex-col items-center text-center min-h-[113px] hover:border-emerald-400 hover:shadow-md transition-all active:scale-[.98]">
            <span className="w-11 h-11 mb-2 rounded-2xl bg-[#e9f8ef] flex items-center justify-center group-hover:bg-emerald-100"><Icon className="w-6 h-6 text-emerald-700"/></span>
            <span className="text-[11px] sm:text-xs font-black leading-tight">{tile.title}</span><span className="text-[10px] text-stone-500 mt-1 leading-tight">{tile.subtitle}</span>
          </button>})}
        </div>
      </section>
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button onClick={()=>navigate('moc_chau_today')} className="flex items-center text-left gap-3 bg-white border border-emerald-100 rounded-2xl px-4 py-4 shadow-sm"><CloudSun className="w-9 h-9 text-amber-500 shrink-0"/><span className="flex-1"><strong className="text-sm block">Thời tiết Mộc Châu</strong><small className="text-xs text-stone-500 block mt-1">Xem dự báo trực tiếp, nguồn dữ liệu và lời khuyên</small></span><ArrowRight className="w-4 h-4 text-emerald-600"/></button>
        <button onClick={()=>navigate('ai')} className="flex items-center text-left gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-4 shadow-sm"><Sparkles className="w-9 h-9 text-emerald-700 shrink-0"/><span className="flex-1"><strong className="text-sm block">Hỏi AI du lịch Mộc Châu</strong><small className="text-xs text-stone-600 block mt-1">Hỏi về lịch trình, đặt xe, mùa hoa và dịch vụ</small></span><ArrowRight className="w-4 h-4 text-emerald-600"/></button>
      </section>
      <section className="space-y-3 scroll-mt-24" id="hot_stories">
        <div className="flex items-center justify-between"><div><h2 className="text-xl sm:text-2xl font-black">🔥 Bài viết & Điểm đến nổi bật</h2><p className="text-xs text-stone-500 mt-0.5">Gợi ý để bạn lên kế hoạch cho chuyến đi</p></div><span className="bg-red-500 text-white text-[10px] px-2 py-1 rounded-full font-black">NỔI BẬT</span></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {hot.map((story:FeaturedStory,i)=><button key={story.id} onClick={()=>navigate(story.target)} className={`relative min-h-[210px] ${i===0?'sm:col-span-2 lg:col-span-2 lg:row-span-2 sm:min-h-[260px]':''} overflow-hidden rounded-2xl shadow-sm text-left group bg-emerald-900`}>
            {story.imageUrl&&<img src={story.imageUrl} alt={story.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"/>}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent"/><span className="absolute top-3 left-3 bg-white/90 text-emerald-800 rounded-full px-3 py-1 text-[10px] font-bold">{story.label}</span>
            <div className="absolute inset-x-0 bottom-0 p-4 text-white"><h3 className="text-lg sm:text-xl font-black">{story.title}</h3><p className="text-xs text-white/90 mt-1">{story.description}</p><span className="mt-2 inline-flex gap-1 items-center text-xs font-bold">Khám phá <ArrowRight className="w-3.5 h-3.5"/></span></div>
          </button>)}
        </div>
      </section>
      <section className="bg-gradient-to-br from-[#e2f5eb] to-white rounded-2xl p-5 sm:p-7 flex flex-wrap items-center gap-4 border border-emerald-100">
        <div className="flex-1 min-w-[190px]"><h2 className="text-lg sm:text-xl font-black">✨ Lên lịch trình Mộc Châu cùng AI</h2><p className="text-xs sm:text-sm text-stone-600 mt-1">Theo ngày đi, số khách, sở thích và ngân sách của bạn.</p></div>
        <button onClick={()=>navigate('trip')} className="rounded-xl bg-emerald-700 text-white px-5 py-3 text-sm font-bold">Lập chuyến đi <ArrowRight className="inline w-4 h-4"/></button>
      </section>
      {!isSignedIn&&<button onClick={openAuth} className="w-full flex items-center gap-3 p-4 rounded-xl bg-white border text-left"><Heart className="w-6 h-6 text-emerald-700"/><span className="flex-1"><strong className="block text-sm">Trở thành thành viên Mộc Châu Travel</strong><small className="block text-xs text-stone-500">Đăng ký để quản lý vé và sử dụng voucher khi có chương trình phù hợp.</small></span><ChevronRight className="w-4 h-4"/></button>}
    </div>
  </div>
}
