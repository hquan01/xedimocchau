import React, {useEffect,useState} from 'react';
import {CloudSun,Sparkles,Flower2,BookOpen,MapPin,Flame,Bus,Car,Bike,House,UtensilsCrossed,Ticket,ArrowRight,Heart,ChevronRight,ChevronLeft,UsersRound,ArrowUpRight,CalendarCheck2,CheckCircle2,Route} from 'lucide-react';
import {useSiteContent,HomeTile} from '../lib/siteContent';
import type {GuideArticle} from '../types';
import {getContentMetrics,EMPTY_METRICS,type MetricsSnapshot} from '../lib/growthMetrics';
import {selectFeaturedStories} from '../lib/featuredStories';
import TikTokShowcase from './TikTokShowcase';

interface Props {setActiveTab:(tab:string)=>void;onOpenArticle:(articleId:string)=>void;onOpenLimousineBooking:()=>void;openMotorbike:()=>void;openAuth:()=>void;isSignedIn:boolean;articles:GuideArticle[]}
const icons:Record<string,React.ComponentType<any>>={'cloud-sun':CloudSun,users:UsersRound,sparkles:Sparkles,flower:Flower2,'book-open':BookOpen,'map-pin':MapPin,flame:Flame,bus:Bus,car:Car,bike:Bike,home:House,utensils:UtensilsCrossed,ticket:Ticket};

export default function ExploreLanding({setActiveTab,onOpenArticle,onOpenLimousineBooking,openMotorbike,openAuth,isSignedIn,articles}:Props){
  const {content}=useSiteContent();
  const [slideIndex,setSlideIndex]=useState(0);
  const [metrics,setMetrics]=useState<MetricsSnapshot>(EMPTY_METRICS);
  useEffect(()=>{let mounted=true;getContentMetrics(content.featuredTrendingDays||30).then(s=>{if(mounted)setMetrics(s)});return()=>{mounted=false}},[content.featuredTrendingDays]);
  // Older published content had no article IDs attached to banner cards.
  // Use the closest existing guide article for the original seeded slides,
  // while preserving every explicitly configured article target.
  const oldSlideArticle:Record<string,string>={
    flower:'article:guide-4',tea:'article:guide-2',waterfall:'article:guide-2'
  };
  const legacyBannerTarget=(id:string,target:string)=>{
    if((content.linkVersion||1)>=2)return target;
    if(id==='flower'&&target==='moc_chau_today')return oldSlideArticle.flower;
    if((id==='tea'||id==='waterfall')&&target==='explore_legacy')return oldSlideArticle[id];
    return target;
  };
  const heroSlides=[
    {id:'main',imageUrl:content.heroImageUrl,title:content.heroTitle,description:content.heroDescription,target:content.heroTarget||'article:guide-1',visible:true},
    ...(content.heroSlides||[]).filter(x=>x.visible && !!x.imageUrl).map(slide=>({
      ...slide,target:legacyBannerTarget(slide.id,slide.target)
    }))
  ];
  const currentSlide=heroSlides[slideIndex % heroSlides.length];
  // Never animate an off-screen or hidden slideshow, and honor reduced-motion.
  useEffect(()=>{
    if(heroSlides.length<2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const timer=window.setInterval(()=>{if(!document.hidden)setSlideIndex(i=>i+1)},8000);
    return()=>window.clearInterval(timer);
  },[heroSlides.length]);
  const navigate=(target:string)=>{
    if(target.startsWith('article:')){
      const articleId=target.slice('article:'.length);
      if(articleId)onOpenArticle(articleId);
      return;
    }
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
  const hot=selectFeaturedStories(content,articles,metrics);
  return <div className="bg-[#f7faf7] text-[#17382b] pb-28 min-h-screen" id="explore_mobile_home">
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-7 space-y-7 sm:space-y-9">
      <section className="relative overflow-hidden rounded-[26px] sm:rounded-[32px] shadow-[0_18px_50px_rgba(13,57,38,.16)] ring-1 ring-emerald-900/10 bg-[#1b4332] mc-hero" aria-label="Khám phá Mộc Châu">
        <img key={currentSlide.id} src={currentSlide.imageUrl} alt={currentSlide.title} fetchPriority={slideIndex===0?'high':'auto'} decoding="async" className="w-full aspect-[1009/440] sm:aspect-[1009/350] object-cover mc-hero-photo" loading={slideIndex===0?'eager':'lazy'}/>
        <button type="button" onClick={()=>navigate(currentSlide.target)}
          aria-label={`Mở nội dung: ${currentSlide.title}`} title={`Xem nội dung: ${currentSlide.title}`}
          className="absolute inset-0 z-10 w-full h-full cursor-pointer focus-visible:outline-4 focus-visible:outline-offset-[-5px] focus-visible:outline-amber-300" />
        {(slideIndex % heroSlides.length !== 0 || currentSlide.imageUrl !== '/mocchau-hero-v5.jpg') && <div className="absolute inset-x-0 bottom-0 px-5 pt-16 pb-10 sm:p-8 bg-gradient-to-t from-[#0e291f]/95 via-[#0e291f]/30 to-transparent text-white pointer-events-none">
          <p className="text-[10px] sm:text-xs tracking-[0.16em] font-black uppercase text-emerald-100">Mộc Châu Travel · QT Limousine</p>
          <h2 className="text-xl sm:text-4xl font-black leading-tight mt-1">{currentSlide.title}</h2>
          <p className="text-[11px] sm:text-base mt-1 text-white/90 max-w-lg">{currentSlide.description}</p>
        </div>}
        {heroSlides.length>1 && <>
          <button type="button" aria-label="Ảnh banner trước" onClick={()=>setSlideIndex(i=>(i-1+heroSlides.length)%heroSlides.length)} className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/70 text-white rounded-full w-11 h-11 grid place-items-center border border-white/40 backdrop-blur-sm transition-colors"><ChevronLeft className="w-5 h-5"/></button>
          <button type="button" aria-label="Ảnh banner tiếp theo" onClick={()=>setSlideIndex(i=>(i+1)%heroSlides.length)} className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/70 text-white rounded-full w-11 h-11 grid place-items-center border border-white/40 backdrop-blur-sm transition-colors"><ChevronRight className="w-5 h-5"/></button>
          {/* The original hero artwork already has decorative dots baked into its pixels.
              Mask only that narrow strip; preserve the supplied photograph and keep a
              single, fully interactive set of navigation buttons over it. */}
          {currentSlide.imageUrl === '/mocchau-hero-v5.jpg' && (
            <div aria-hidden="true" className="absolute pointer-events-none bottom-0 left-1/2 -translate-x-1/2 w-[200px] h-14" style={{background: 'linear-gradient(to top, #113c29 0%, #113c29 78%, transparent 100%)'}} />
          )}
          <div role="group" aria-label="Chọn ảnh banner" className="absolute bottom-2.5 inset-x-0 z-20 flex justify-center gap-3">
            {heroSlides.map((slide,i)=><button key={slide.id} type="button" aria-label={`Xem banner ${i+1}`} aria-current={i===slideIndex%heroSlides.length ? 'true' : undefined} onClick={()=>setSlideIndex(i)} className="w-9 h-9 grid place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-amber-300"><span aria-hidden="true" className={`block h-2.5 rounded-full border border-white/90 shadow-sm transition-[width,background-color] ${i===slideIndex%heroSlides.length?'w-7 bg-white':'w-2.5 bg-black/40'}`}/></button>) }
          </div>
        </>}
      </section>
      {/* A clear first action above the content directory, with no fabricated social proof. */}
      <section className="mc-trip-starter relative overflow-hidden rounded-[26px] border border-emerald-100 bg-white p-4 sm:p-6 shadow-[0_12px_35px_rgba(21,61,41,.06)]" aria-label="Bắt đầu chuyến đi Mộc Châu">
        <div className="absolute -top-16 -right-14 h-48 w-48 rounded-full bg-emerald-100/55 blur-3xl pointer-events-none" aria-hidden="true"/>
        <div className="relative flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-7">
          <div className="flex-1 min-w-0 space-y-1.5">
            <p className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[.12em] text-emerald-700"><Sparkles className="w-4 h-4" aria-hidden="true"/> Khởi đầu chuyến đi thật dễ</p>
            <h1 className="text-[23px] sm:text-[28px] font-black tracking-tight leading-tight text-[#123d2a]">Mộc Châu đang chờ bạn khám phá</h1>
            <p className="text-[13px] sm:text-sm leading-relaxed text-stone-600 max-w-[550px]">Tìm điểm chơi, hỏi kinh nghiệm và chọn chuyến xe phù hợp — tất cả ngay tại đây.</p>
          </div>
          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-2.5 lg:min-w-[250px] xl:min-w-0">
            <button type="button" onClick={onOpenLimousineBooking} className="mc-primary-action min-h-[52px] px-5 py-3 rounded-2xl font-extrabold text-sm text-white bg-[#1b4332] flex items-center justify-center gap-2 shadow-[0_8px_22px_rgba(27,67,50,.2)] hover:bg-[#276749] transition-[transform,background-color,box-shadow] active:scale-[.98]"><Bus className="w-5 h-5" aria-hidden="true"/> Tìm chuyến & đặt xe <ArrowUpRight className="w-4 h-4" aria-hidden="true"/></button>
            <button type="button" onClick={()=>navigate('trip')} className="mc-secondary-action min-h-[52px] px-5 py-3 rounded-2xl font-bold text-sm text-[#1b4332] bg-emerald-50 border border-emerald-200 flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors"><Route className="w-5 h-5" aria-hidden="true"/> Lên lịch trình <ArrowRight className="w-4 h-4" aria-hidden="true"/></button>
          </div>
        </div>
        <div className="relative mt-4 pt-3.5 border-t border-emerald-100 flex flex-wrap gap-x-5 gap-y-2 text-[11px] sm:text-xs font-semibold text-emerald-900/80">
          <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-700" aria-hidden="true"/> Chọn ngày & giờ đi</span>
          <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-700" aria-hidden="true"/> Xem điểm đón trả</span>
          <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-700" aria-hidden="true"/> Quản lý vé trên website</span>
        </div>
      </section>
      <section className="space-y-3.5">
        <div className="flex items-center justify-between gap-2"><div><p className="text-[10px] sm:text-xs font-black tracking-[.14em] text-emerald-700 uppercase">Khám phá theo sở thích</p><h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1">🌿 Bạn muốn tìm gì?</h2></div><button onClick={()=>navigate('services')} className="text-xs text-emerald-700 font-bold whitespace-nowrap">Xem dịch vụ <ChevronRight className="inline w-3 h-3"/></button></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-2.5 sm:gap-3">
          {tiles.map((tile:HomeTile)=>{const Icon=icons[tile.icon]||MapPin;return <button key={tile.id} onClick={()=>navigateTile(tile)} className="group mc-service-tile bg-white border border-[#e2ebe4] shadow-sm rounded-[20px] px-2.5 py-4 flex flex-col items-center text-center justify-center min-h-[133px] hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-950/5 transition-[transform,box-shadow,border-color] active:scale-[.98] focus-visible:outline-2 focus-visible:outline-emerald-600">
            <span className="w-12 h-12 mb-2.5 rounded-2xl bg-[#e9f8ef] flex items-center justify-center group-hover:bg-emerald-100 transition-colors"><Icon className="w-6 h-6 text-emerald-700" aria-hidden="true"/></span>
            <span className="text-[13px] sm:text-sm font-extrabold leading-snug text-[#17382b]">{tile.title}</span><span className="text-[11px] sm:text-xs text-stone-600 mt-1 leading-snug">{tile.subtitle}</span>
          </button>})}
        </div>
      </section>
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3" aria-label="Công cụ hỗ trợ chuyến đi">
        <button onClick={()=>navigate('moc_chau_today')} className="mc-quick-card group flex items-center text-left gap-3.5 bg-white border border-emerald-100 rounded-[22px] px-4 sm:px-5 py-5 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all"><span className="grid place-items-center w-12 h-12 shrink-0 bg-amber-50 rounded-2xl"><CloudSun className="w-7 h-7 text-amber-600" aria-hidden="true"/></span><span className="flex-1"><strong className="text-[15px] sm:text-base block">Thời tiết Mộc Châu</strong><small className="text-[12px] sm:text-[13px] text-stone-600 block mt-1 leading-snug">Xem dự báo, nguồn dữ liệu và gợi ý chuẩn bị</small></span><ArrowUpRight className="w-5 h-5 text-emerald-700 shrink-0 group-hover:translate-x-0.5 transition-transform" aria-hidden="true"/></button>
        <button onClick={()=>navigate('ai')} className="mc-quick-card group flex items-center text-left gap-3.5 bg-emerald-50 border border-emerald-100 rounded-[22px] px-4 sm:px-5 py-5 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all"><span className="grid place-items-center w-12 h-12 shrink-0 bg-emerald-100 rounded-2xl"><Sparkles className="w-7 h-7 text-emerald-700" aria-hidden="true"/></span><span className="flex-1"><strong className="text-[15px] sm:text-base block">Hỏi AI du lịch Mộc Châu</strong><small className="text-[12px] sm:text-[13px] text-stone-600 block mt-1 leading-snug">Gợi ý lịch trình, địa điểm và dịch vụ theo nhu cầu</small></span><ArrowUpRight className="w-5 h-5 text-emerald-700 shrink-0 group-hover:translate-x-0.5 transition-transform" aria-hidden="true"/></button>
      </section>
      <section className="space-y-4 scroll-mt-24" id="hot_stories">
        <div className="flex items-end justify-between gap-3"><div>
          <p className="text-[11px] font-black text-emerald-700 uppercase tracking-[.13em]">Đọc để đi vui hơn</p>
          <h2 className="text-[22px] sm:text-[28px] font-black tracking-tight leading-tight mt-1">Bài viết & điểm đến nổi bật</h2>
          <p className="text-[12px] sm:text-sm text-stone-600 mt-1">Thông tin hữu ích giúp bạn chọn nơi chơi, ăn ở và lên kế hoạch.</p>
        </div><span className="hidden sm:inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-100 text-[11px] px-3 py-1.5 rounded-full font-extrabold shrink-0"><Flame className="w-3.5 h-3.5" aria-hidden="true"/> Gợi ý đáng xem</span></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {hot.map((story,i)=><button key={story.id} type="button" onClick={()=>navigate(legacyBannerTarget(story.id,story.target))}
            className={`mc-featured-card group flex flex-col overflow-hidden rounded-[22px] sm:rounded-[24px] shadow-sm text-left bg-white border border-emerald-100 hover:shadow-[0_14px_32px_rgba(21,61,41,.12)] hover:border-emerald-300 transition-[transform,box-shadow,border-color] ${i===0?'sm:col-span-2 lg:col-span-2 lg:row-span-2':i===3?'lg:col-span-2':''}`}>
            <div className={`relative w-full overflow-hidden bg-emerald-900 ${i===0?'h-[225px] sm:h-[280px] lg:flex-1 lg:min-h-[310px]':'h-[182px] sm:h-[190px]'}`}>
              {story.imageUrl&&<img src={story.imageUrl} alt="" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.035]"/>}
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent pointer-events-none"/>
              <span className="absolute top-3 left-3 bg-white/95 text-emerald-900 rounded-full px-3 py-1.5 text-[11px] font-extrabold shadow-sm">{story.pinned?'QT gợi ý':story.trending?'Đang được quan tâm':story.label}</span>
            </div>
            <div className={`p-4 sm:p-5 flex flex-col gap-2 ${i===0?'sm:py-6':''}`}>
              <h3 className={`font-black tracking-tight text-[#17382b] line-clamp-2 leading-snug ${i===0?'text-lg sm:text-[23px]':'text-[17px] sm:text-lg'}`}>{story.title}</h3>
              <p className="text-[12px] sm:text-[13px] text-stone-600 line-clamp-2 leading-relaxed">{story.description}</p>
              <span className="inline-flex gap-1.5 items-center text-[12px] font-extrabold text-emerald-700 mt-1">Khám phá bài viết <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true"/></span>
            </div>
          </button>)}
        </div>
      </section>
      <section className="relative overflow-hidden rounded-[26px] bg-[#143c2b] p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-white border border-[#255b44] shadow-[0_16px_35px_rgba(11,48,30,.15)]">
        <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-emerald-400/10 blur-2xl pointer-events-none"/>
        <div className="relative"><p className="text-[11px] font-black tracking-widest uppercase text-emerald-200">Đặt xe QT Limousine</p>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1">Chọn chuyến đi phù hợp với bạn</h2>
          <p className="text-[13px] sm:text-sm text-emerald-50/90 mt-1">Kiểm tra ngày, giờ và điểm đón trả trước khi xác nhận đặt vé.</p></div>
        <button type="button" onClick={onOpenLimousineBooking} className="relative shrink-0 rounded-2xl bg-white text-[#17452f] hover:bg-emerald-50 font-extrabold text-sm px-5 py-3.5 min-h-[50px] transition-colors">Xem chuyến & đặt xe <ArrowUpRight className="inline w-4 h-4 ml-1"/></button>
      </section>
      <section className="bg-gradient-to-br from-[#e2f5eb] to-white rounded-[24px] p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center gap-4 border border-emerald-100">
        <div className="flex-1 min-w-0"><p className="text-[11px] tracking-widest uppercase font-black text-emerald-700">Gợi ý hành trình</p><h2 className="text-lg sm:text-xl font-black mt-1">Lên lịch trình Mộc Châu cùng AI</h2><p className="text-[13px] sm:text-sm text-stone-600 mt-1">Dựa theo ngày đi, nhóm khách, sở thích và ngân sách của bạn.</p></div>
        <button onClick={()=>navigate('trip')} className="rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-3.5 min-h-[48px] text-sm font-bold transition-colors">Lập chuyến đi <ArrowRight className="inline w-4 h-4 ml-1"/></button>
      </section>
      <TikTokShowcase videoLinks={content.tiktokVideoLinks||[]}/>
      {!isSignedIn&&<button onClick={openAuth} className="group w-full flex items-center gap-3.5 p-4 sm:p-5 rounded-[22px] bg-white border border-emerald-100 shadow-sm hover:shadow-md text-left transition-shadow"><span className="w-12 h-12 rounded-2xl bg-emerald-50 grid place-items-center shrink-0"><Heart className="w-6 h-6 text-emerald-700"/></span><span className="flex-1"><strong className="block text-[14px] sm:text-base">Tham gia hội viên QT Limousine</strong><small className="block text-[12px] sm:text-[13px] text-stone-600 mt-1">Quản lý vé, tích điểm theo ghế và sử dụng voucher khi đủ điều kiện.</small></span><ChevronRight className="w-5 h-5 text-emerald-700 shrink-0 group-hover:translate-x-0.5 transition-transform"/></button>}
    </div>
  </div>
}
