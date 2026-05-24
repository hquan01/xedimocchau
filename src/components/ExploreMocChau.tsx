import React, { useState, useMemo } from "react";
import { Destination } from "../types";
import { Clock, Info, Check, Sparkles, MapPin, Compass, Ticket, List, ChevronRight, Heart, Eye, Bookmark, Share2, ChevronDown, Search, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import DestinationReview from "./DestinationReview";

interface ExploreMocChauProps {
  destinations: Destination[];
  onSelectBooking?: () => void;
  currentUser?: any;
}

export default function ExploreMocChau({ destinations, onSelectBooking, currentUser }: ExploreMocChauProps) {
  const [displayCount, setDisplayCount] = useState(4);
  const [searchQuery, setSearchQuery] = useState("");
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [interactions, setInteractions] = useState<{ [key: string]: { liked: boolean, saved: boolean, likes: number, views: number } }>({});

  const isAdmin = currentUser?.role === "operator";

  const filteredDestinations = useMemo(() => {
    if (!searchQuery.trim()) return destinations;
    const query = searchQuery.toLowerCase().trim();
    return destinations.filter(dest => 
      dest.name.toLowerCase().includes(query) || 
      dest.description.toLowerCase().includes(query) ||
      dest.tag?.toLowerCase().includes(query)
    );
  }, [destinations, searchQuery]);

  const visibleDestinations = filteredDestinations.slice(0, searchQuery ? filteredDestinations.length : displayCount);

  const toggleLike = (id: string) => {
    setInteractions(prev => {
      const current = prev[id] || { liked: false, saved: false, likes: Math.floor(Math.random() * 200) + 50, views: Math.floor(Math.random() * 5000) + 1000 };
      return {
        ...prev,
        [id]: { ...current, liked: !current.liked, likes: current.liked ? current.likes - 1 : current.likes + 1 }
      };
    });
  };

  const toggleSave = (id: string) => {
    setInteractions(prev => {
      const current = prev[id] || { liked: false, saved: false, likes: Math.floor(Math.random() * 200) + 50, views: Math.floor(Math.random() * 5000) + 1000 };
      return {
        ...prev,
        [id]: { ...current, saved: !current.saved }
      };
    });
  };

  const handleShare = (name: string) => {
    if (navigator.share) {
      navigator.share({
        title: `Khám phá ${name} cùng Xe Đi Mộc Châu`,
        text: `Tọa độ check-in siêu hot tại Mộc Châu: ${name}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      alert(`Đã sao chép liên kết cho: ${name}`);
    }
  };

  const getStats = (id: string) => {
    return interactions[id] || { liked: false, saved: false, likes: Math.floor(Math.random() * 200) + 50, views: Math.floor(Math.random() * 5000) + 1000 };
  };

  const scrollToDestination = (id: string, index: number) => {
    // If the destination is currently hidden by displayCount, expand the list
    if (index >= displayCount) {
      setDisplayCount(index + 1);
    }
    
    // Small delay to allow state update and DOM rendering
    setTimeout(() => {
      const element = document.getElementById(`dest_card_${id}`);
      if (element) {
        const headerOffset = 100;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }
    }, 50);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" id="explore_moc_chau_section">
      {/* SEO Structured Data - Review Rating Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org/",
          "@type": "Guide",
          "name": "Cẩm Nang Du Lịch & Tọa Độ Check-in Mộc Châu Siêu Đẹp",
          "description": "Tổng hợp các địa điểm check-in, vui chơi, ăn uống hot nhất tại Mộc Châu được cập nhật mới nhất 2024.",
          "image": destinations[0]?.image,
          "author": {
            "@type": "Organization",
            "name": "Xe Đi Mộc Châu"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "bestRating": "5",
            "worstRating": "1",
            "ratingCount": "1250",
            "reviewCount": "860"
          }
        })}
      </script>

      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-xs bg-emerald-100 text-emerald-800 font-extrabold px-3.5 py-1.5 rounded-full uppercase tracking-wider">
          Cẩm Nang Tây Bắc
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1b4332] tracking-tight mt-3">
          Tọa Độ Check-in Mộc Châu "Sống Ảo" Đẹp Nhất
        </h2>
        <p className="text-stone-500 mt-2 text-sm font-sans">
          Mộc Châu bốn mùa ngập tràn hương sắc hoa trái thiên nhiên mộc mạc. Điểm qua danh sách các tọa độ vàng không thể bỏ lỡ khi xách vali lướt trên cao nguyên.
        </p>
      </div>

      {/* Search & Navigation Bar */}
      <div className="mb-8 max-w-4xl mx-auto flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-stone-400 group-focus-within:text-emerald-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Tìm địa điểm, bài viết, trải nghiệm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 bg-white border border-stone-200 rounded-2xl pl-12 pr-12 text-sm font-bold text-stone-800 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-4 flex items-center text-stone-400 hover:text-stone-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Table of Contents (Mục lục) - Dropdown Style */}
      <div className="mb-12 max-w-4xl mx-auto">
        <div className="bg-stone-50 border border-stone-200 rounded-2xl shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-12 -mt-12" />
          
          <button 
            onClick={() => setIsTocOpen(!isTocOpen)}
            className="w-full flex items-center justify-between p-5 sm:p-6 text-[#1b4332] outline-none cursor-pointer group"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-emerald-600 p-2 rounded-lg shadow-lg shadow-emerald-900/10">
                <List className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <h3 className="font-black text-xs sm:text-sm uppercase tracking-widest leading-none">Mục Lục Bài Viết</h3>
                <p className="text-[10px] text-stone-500 font-bold mt-1 uppercase tracking-tight">
                  {searchQuery ? `Tìm thấy ${filteredDestinations.length} kết quả` : "Click để xem nhanh tọa độ"}
                </p>
              </div>
            </div>
            <motion.div
              animate={{ rotate: isTocOpen ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <ChevronDown className="w-5 h-5 text-stone-400 group-hover:text-emerald-600 transition-colors" />
            </motion.div>
          </button>
          
          <AnimatePresence>
            {isTocOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="px-5 sm:px-6 pb-6 pt-0">
                  <div className="h-px bg-stone-200 mb-6" />
                  {filteredDestinations.length === 0 ? (
                    <p className="text-xs text-stone-400 font-medium italic text-center py-4">Không tìm thấy địa điểm phù hợp</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                      {filteredDestinations.map((dest, idx) => (
                        <button
                          key={dest.id}
                          onClick={() => {
                            scrollToDestination(dest.id, idx);
                            setIsTocOpen(false);
                          }}
                          className="flex items-center text-left group transition-all hover:translate-x-1"
                        >
                          <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-stone-200/50 flex items-center justify-center text-[10px] font-black text-stone-600 group-hover:bg-emerald-100 group-hover:text-emerald-700 transition-colors mr-3 border border-stone-200 group-hover:border-emerald-200">
                            {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                          </div>
                          <span className="text-xs font-bold text-stone-600 group-hover:text-emerald-700 transition-colors line-clamp-1 border-b border-transparent group-hover:border-emerald-300 pb-0.5">
                            {dest.name}
                          </span>
                          <ChevronRight className="w-3 h-3 text-stone-300 group-hover:text-emerald-400 ml-auto opacity-0 group-hover:opacity-100 transition-all" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 text-left">
        {visibleDestinations.map((dest) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            key={dest.id}
            id={`dest_card_${dest.id}`}
            className="group bg-white rounded-[2rem] overflow-hidden border border-stone-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 flex flex-col h-full"
          >
            {/* Visual Thumbnail - Rectangular Aspect Ratio */}
            <div className="aspect-[16/10] sm:aspect-video w-full relative overflow-hidden">
              <img
                src={dest.image || null}
                alt={dest.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s] ease-out"
              />
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <div className="bg-white/90 backdrop-blur-md text-emerald-900 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-xl">
                  {dest.tag}
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-stone-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Content Section */}
            <div className="p-6 sm:p-8 flex flex-col flex-1">
              <div className="flex items-center space-x-2 text-emerald-600 mb-3">
                <MapPin className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{dest.distance}</span>
              </div>

              <h3 className="font-black text-stone-900 text-xl sm:text-2xl mb-3 tracking-tight group-hover:text-emerald-700 transition-colors">
                {dest.name}
              </h3>
              
              <p className="text-stone-500 text-xs sm:text-sm leading-relaxed mb-6 line-clamp-3 font-sans opacity-80">
                {dest.description}
              </p>

              {/* Social Interactions */}
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-stone-100">
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleLike(dest.id); }}
                    className={`flex items-center space-x-1.5 transition-all outline-none ${getStats(dest.id).liked ? 'text-rose-500' : 'text-stone-400 hover:text-rose-500'}`}
                  >
                    <Heart className={`w-4.5 h-4.5 ${getStats(dest.id).liked ? 'fill-current' : ''}`} />
                    <span className="text-[11px] font-black">{getStats(dest.id).likes}</span>
                  </button>
                  <div className="flex items-center space-x-1.5 text-stone-400">
                    <Eye className="w-4.5 h-4.5" />
                    <span className="text-[11px] font-black">{getStats(dest.id).views}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleSave(dest.id); }}
                    className={`p-2 rounded-full transition-all outline-none ${getStats(dest.id).saved ? 'bg-amber-100 text-amber-600' : 'bg-stone-50 text-stone-400 hover:bg-stone-100 hover:text-stone-600'}`}
                  >
                    <Bookmark className={`w-4 h-4 ${getStats(dest.id).saved ? 'fill-current' : ''}`} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleShare(dest.name); }}
                    className="p-2 rounded-full bg-stone-50 text-stone-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all outline-none"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Detail Grid */}
              <div className="mt-auto grid grid-cols-1 gap-4">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-0.5">Thời điểm ghé thăm</h4>
                    <p className="text-xs font-extrabold text-stone-700 leading-tight">{dest.bestTime}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-0.5">Bí kíp check-in</h4>
                    <p className="text-xs text-stone-600 leading-relaxed font-medium italic">"{dest.tips}"</p>
                  </div>
                </div>
              </div>

              {/* Review Section */}
              <DestinationReview 
                destinationId={dest.id} 
                destinationName={dest.name} 
                isAdmin={isAdmin}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {filteredDestinations.length > displayCount && !searchQuery && (
        <div className="mt-12 text-center">
          <button 
            onClick={() => setDisplayCount(prev => prev + 4)}
            className="bg-white border-2 border-emerald-600 text-emerald-600 px-8 py-3 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all cursor-pointer shadow-lg shadow-emerald-900/10"
          >
            Xem thêm địa điểm
          </button>
        </div>
      )}

      {filteredDestinations.length === 0 && (
        <div className="mt-20 text-center py-20 bg-stone-50 rounded-3xl border border-dashed border-stone-200">
          <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-stone-300" />
          </div>
          <h3 className="text-stone-900 font-black text-lg">Không tìm thấy kết quả</h3>
          <p className="text-stone-500 text-sm mt-2">Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc.</p>
          <button 
            onClick={() => setSearchQuery("")}
            className="mt-6 text-emerald-600 font-black text-xs uppercase tracking-widest hover:underline"
          >
            Xóa tìm kiếm
          </button>
        </div>
      )}

      {/* Premium Conversion CTA - Big Brand Style */}
      <section className="mt-16 relative group">
        <div className="absolute inset-0 bg-emerald-500 blur-[80px] opacity-10 group-hover:opacity-15 transition-opacity" />
        
        <div className="relative bg-stone-950 border border-stone-800 rounded-[2rem] overflow-hidden shadow-2xl">
          <div className="flex flex-col lg:flex-row items-stretch">
            {/* Left side: Benefit & Content */}
            <div className="flex-1 p-6 sm:p-10 lg:p-12 text-left">
              <div className="flex items-center space-x-2 mb-5">
                <span className="w-6 h-[2px] bg-emerald-500" />
                <span className="text-emerald-500 text-[10px] sm:text-xs font-black uppercase tracking-[0.3em]">Ưu đãi dành riêng cho bạn</span>
              </div>
              
              <h2 className="text-xl sm:text-3xl lg:text-4xl font-black text-white leading-tight mb-5 font-sans">
                Gác Lại Âu Lo - Tự Do <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Sống Ảo Trọn Vẹn</span>
              </h2>
              
              <p className="text-stone-400 text-xs sm:text-base mb-8 leading-relaxed max-w-xl opacity-90">
                Đừng để đường đèo dốc làm bạn chùn bước. Hệ thống xe VIP <strong>Limousine đời mới 2024</strong> của chúng tôi đón tận cửa, trả tận nơi mọi tọa độ hot nhất Mộc Châu.
              </p>
              
              <div className="flex flex-wrap gap-4 mb-8">
                <div className="bg-stone-900 border border-stone-800 px-4 py-2.5 rounded-xl">
                  <div className="text-[9px] text-stone-500 font-bold uppercase tracking-widest mb-0.5">Giá chỉ từ</div>
                  <div className="text-lg font-black text-emerald-400">300.000đ<span className="text-xs text-stone-500 font-normal ml-1">/vé</span></div>
                </div>
                <div className="bg-stone-900 border border-stone-800 px-4 py-2.5 rounded-xl">
                  <div className="text-[9px] text-stone-500 font-bold uppercase tracking-widest mb-0.5">Tần suất</div>
                  <div className="text-lg font-black text-white">60 Phút<span className="text-xs text-stone-500 font-normal ml-1">/chuyến</span></div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onSelectBooking}
                  className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs sm:text-sm px-8 py-4 rounded-xl shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center space-x-3 cursor-pointer"
                >
                  <span>MỞ FORM ĐẶT XE NGAY</span>
                  <Compass className="w-5 h-5" />
                </motion.button>
                
                <a
                  href="tel:0971050324"
                  className="w-full sm:w-auto px-6 py-4 text-white font-black text-xs sm:text-sm rounded-xl border border-stone-700 hover:border-emerald-500 transition-all flex items-center justify-center space-x-3"
                >
                  <Ticket className="w-5 h-5 text-emerald-500" />
                  <span>HOTLINE: 0971.050.324</span>
                </a>
              </div>
            </div>

            {/* Right side: Trust Badges / Stats (Bento style) */}
            <div className="lg:w-1/3 bg-stone-900/50 p-6 sm:p-8 lg:p-10 border-l border-stone-800 flex flex-col justify-center space-y-6">
              {[
                { icon: Check, title: "Đưa đón tận nơi", desc: "Không cần ra bến, đón trả nội thành Hà Nội & Mộc Châu." },
                { icon: Clock, title: "Giữ đúng số ghế", desc: "Cam kết 100% không bắt khách dọc đường, chuẩn giờ." },
                { icon: Sparkles, title: "Hỗ trợ thiết kế tour", desc: "Tư vấn điểm check-in & lộ trình miễn phí cho đoàn." }
              ].map((benefit, i) => (
                <div key={i} className="flex space-x-3">
                  <div className="w-8 h-8 shrink-0 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                    <benefit.icon className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-xs mb-0.5">{benefit.title}</h4>
                    <p className="text-stone-500 text-[10px] leading-snug">{benefit.desc}</p>
                  </div>
                </div>
              ))}
              
              <div className="pt-5 border-t border-stone-800 opacity-60">
                <div className="flex items-center space-x-3">
                  <div className="flex -space-x-1.5">
                    {[1,2,3].map(i => <div key={i} className="w-5 h-5 rounded-full border-2 border-stone-900 bg-stone-700" />)}
                  </div>
                  <span className="text-[9px] text-stone-400 font-bold uppercase tracking-tight">3,400+ Lượt đặt tuần qua</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
