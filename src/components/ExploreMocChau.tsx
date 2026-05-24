import React, { useState } from "react";
import { Destination } from "../types";
import { Clock, Info, Check, Sparkles, MapPin, Compass, Ticket, List, ChevronRight } from "lucide-react";
import { motion } from "motion/react";

interface ExploreMocChauProps {
  destinations: Destination[];
  onSelectBooking?: () => void;
}

export default function ExploreMocChau({ destinations, onSelectBooking }: ExploreMocChauProps) {
  const [displayCount, setDisplayCount] = useState(4);
  const visibleDestinations = destinations.slice(0, displayCount);

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

      {/* Table of Contents (Mục lục) */}
      <div className="mb-12 max-w-4xl mx-auto">
        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-12 -mt-12" />
          
          <div className="flex items-center space-x-2 text-[#1b4332] mb-4">
            <div className="bg-emerald-600 p-1.5 rounded-lg">
              <List className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-black text-sm uppercase tracking-widest">Mục Lục Bài Viết</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5">
            {destinations.map((dest, idx) => (
              <button
                key={dest.id}
                onClick={() => scrollToDestination(dest.id, idx)}
                className="flex items-center text-left group transition-colors hover:text-emerald-600"
              >
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-stone-200 flex items-center justify-center text-[10px] font-black text-stone-500 group-hover:bg-emerald-100 group-hover:text-emerald-700 transition-colors mr-2.5">
                  {idx + 1}
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-stone-600 group-hover:text-emerald-700 transition-colors line-clamp-1 border-b border-stone-200 group-hover:border-emerald-200 pb-0.5 w-full">
                  {dest.name}
                </span>
                <ChevronRight className="w-3 h-3 text-stone-300 group-hover:text-emerald-400 transform group-hover:translate-x-1 transition-all ml-1" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
        {visibleDestinations.map((dest) => (
          <div
            key={dest.id}
            id={`dest_card_${dest.id}`}
            className="bg-white rounded-3xl overflow-hidden border border-stone-200 shadow-md hover:shadow-lg transition-all flex flex-col sm:flex-row h-full"
          >
            {/* Visual Thumbnail */}
            <div className="sm:w-1/2 h-52 sm:h-auto relative overflow-hidden shrink-0">
              <img
                src={dest.image || null}
                alt={dest.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 bg-stone-900/95 backdrop-blur-xs text-emerald-400 text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-lg shadow-sm">
                {dest.tag}
              </div>
            </div>

            {/* Inner Content info */}
            <div className="p-6 sm:w-1/2 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-1 text-[10px] uppercase font-bold text-stone-400">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{dest.distance}</span>
                </div>
                <h3 className="font-extrabold text-[#1b4332] text-base leading-snug">
                  {dest.name}
                </h3>
                <p className="text-stone-500 text-[11px] leading-relaxed font-sans">{dest.description}</p>
              </div>

              {/* Tips block */}
              <div className="space-y-2 pt-3 border-t border-stone-100">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-800">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Thời gian lý tưởng:</span>
                </div>
                <p className="text-[10px] text-stone-600 font-sans leading-tight mt-1">{dest.bestTime}</p>

                <div className="flex items-start space-x-1.5 text-xs font-bold text-[#1b4332] mt-2">
                  <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Mẹo hay du lịch: <p className="font-normal text-stone-600 text-[10px] inline font-sans leading-relaxed">{dest.tips}</p></span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {displayCount < destinations.length && (
        <div className="mt-12 text-center">
          <button 
            onClick={() => setDisplayCount(prev => prev + 4)}
            className="bg-white border-2 border-emerald-600 text-emerald-600 px-8 py-3 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all cursor-pointer shadow-lg shadow-emerald-900/10"
          >
            Xem thêm địa điểm
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
