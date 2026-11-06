import {getVietnamToday} from "../lib/bookingTime";
import React, { useState } from "react";
import { Compass, CalendarDays, Users, Search, Sparkles, MapPin, Ticket, Sun, CloudRain, Utensils, Home, Hotel, ShoppingBag, Car, HelpCircle, BookOpen, Award, Loader2, ArrowLeftRight } from "lucide-react";
import { motion } from "motion/react";
import AIAdvisorResultView from "./AIAdvisorResultView";

const heroImg = "/src/assets/images/moc_chau_hero_1779246188232.png";

interface HeroProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSearchLimousine: (from: string, to: string, date: string, time?: string, pickup?: string, dropoff?: string) => void;
  onSearchCombo: (hotelId: string, date: string, from?: string, to?: string, time?: string, pickup?: string, dropoff?: string) => void;
}

export default function Hero({ activeTab, setActiveTab, onSearchLimousine, onSearchCombo }: HeroProps) {
  const getTodayString = () => getVietnamToday();

  const [routeFromType, setRouteFromType] = useState<"Hà Nội" | "Mộc Châu" | "other">("Hà Nội");
  const [customRouteFrom, setCustomRouteFrom] = useState("");
  const [routeToType, setRouteToType] = useState<"Hà Nội" | "Mộc Châu" | "other">("Mộc Châu");
  const [customRouteTo, setCustomRouteTo] = useState("");

  const effectiveRouteFrom = routeFromType === "other" ? (customRouteFrom.trim() || "Tỉnh khác") : routeFromType;
  const effectiveRouteTo = routeToType === "other" ? (customRouteTo.trim() || "Tỉnh khác") : routeToType;

  const handleSwapHeroRoute = () => {
    const prevFromType = routeFromType;
    const prevCustomFrom = customRouteFrom;
    const prevToType = routeToType;
    const prevCustomTo = customRouteTo;
    setRouteFromType(prevToType);
    setCustomRouteFrom(prevCustomTo);
    setRouteToType(prevFromType);
    setCustomRouteTo(prevCustomFrom);

    const prevPickup = pickupAddress;
    const prevDropoff = dropoffAddress;
    setPickupAddress(prevDropoff);
    setDropoffAddress(prevPickup);
  };

  const [travelDate, setTravelDate] = useState(getTodayString());
  const [travelTime, setTravelTime] = useState("06:30");
  const [pickupAddress, setPickupAddress] = useState("");
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [subType, setSubType] = useState<'limousine' | 'combo'>('limousine');
  const [generalQuery, setGeneralQuery] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiResultModal, setAiResultModal] = useState<{ question: string; result: any } | null>(null);

  const handleGeneralSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generalQuery.trim() || loadingAi) return;

    const queryText = generalQuery.trim();
    setLoadingAi(true);

    try {
      const res = await fetch("/api/ai/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: queryText })
      });
      const data = await res.json().catch(() => ({}));
      if (data && data.success) {
        setAiResultModal({
          question: queryText,
          result: data
        });
      } else {
        setAiResultModal({
          question: queryText,
          result: {
            intents: ["GENERAL", "TRANSPORT", "DESTINATION"],
            extractedParams: {},
            replyText: `Chào bạn! Cảm ơn bạn đã quan tâm đến Mộc Châu Travel. Về câu hỏi "${queryText}", Mộc Châu Travel và nhà xe QT Limousine luôn sẵn sàng hỗ trợ bạn trải nghiệm chuyến đi trọn vẹn nhất.`
          }
        });
      }
    } catch (err) {
      console.warn("AI intent fallback triggered:", err);
      setAiResultModal({
        question: queryText,
        result: {
          intents: ["GENERAL", "TRANSPORT", "DESTINATION"],
          extractedParams: {},
          replyText: `Chào bạn! Về câu hỏi "${queryText}": Mộc Châu Travel luôn sẵn sàng phục vụ bạn với hệ thống thông tin du lịch và dịch vụ xe QT Limousine đón trả tận nơi.`
        }
      });
    } finally {
      setLoadingAi(false);
    }
  };

  const provinceOptions = (
    <>
      <option value="">-- Chọn điểm --</option>
      <optgroup label="Cao nguyên Xanh">
        <option value="Mộc Châu">Mộc Châu (Sơn La)</option>
      </optgroup>
      <optgroup label="Hành lang Đồng bằng sông Hồng & Miền Bắc">
        <option value="Hà Nội">Hà Nội</option>
        <option value="Bắc Ninh">Bắc Ninh</option>
        <option value="Hưng Yên">Hưng Yên</option>
        <option value="Hải Phòng">Hải Phòng</option>
        <option value="Quảng Ninh">Quảng Ninh</option>
        <option value="Thanh Hóa">Thanh Hóa</option>
        <option value="Nghệ An">Nghệ An</option>
      </optgroup>
    </>
  );

  const handleBookingSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!travelDate) {
      alert("Vui lòng chọn ngày khởi hành!");
      return;
    }
    // The quick-search box has no hour picker; departure time is chosen on the booking screen.
    if (travelDate < getVietnamToday()) {
      alert("Ngày khởi hành đã qua. Vui lòng chọn ngày hôm nay hoặc ngày sau.");
      return;
    }
    if (subType === 'limousine') {
      setActiveTab("limousine");
      onSearchLimousine(effectiveRouteFrom, effectiveRouteTo, travelDate, travelTime, pickupAddress, dropoffAddress);
    } else {
      setActiveTab("combo");
      onSearchCombo("all", travelDate, effectiveRouteFrom, effectiveRouteTo, travelTime, pickupAddress, dropoffAddress);
    }
  };

  return (
    <div className="relative bg-stone-900 overflow-hidden font-sans" id="hero_wrapper">
      {/* Background Hero Image */}
      <div className="absolute inset-0">
        <img
          src={heroImg}
          alt="Mộc Châu Travel & QT Limousine"
          className="w-full h-full object-cover opacity-55 scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/60 to-stone-950/80" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 md:pt-24 md:pb-32 flex flex-col items-center text-center">
        
        {/* Brand Tag: Mộc Châu Travel – Đồng hành cùng QT Limousine */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center space-x-2 bg-emerald-950/80 border border-emerald-400/40 px-5 py-2 rounded-full text-emerald-300 text-xs font-extrabold uppercase tracking-widest mb-6 backdrop-blur-md shadow-lg shadow-emerald-950/30"
        >
          <span className="text-sm">🌸</span>
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>Mộc Châu Travel – Đồng hành cùng QT Limousine</span>
        </motion.div>

        {/* Catchy Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-sans text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.15] max-w-4xl"
        >
          Mộc Châu có gì? <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-amber-300 to-teal-300">Hỏi là có!</span>
        </motion.h1>

        {/* Large Natural Search Box */}
        <motion.form
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          onSubmit={handleGeneralSearch}
          className="w-full max-w-2xl mt-8 relative"
        >
          <div className="relative flex items-center shadow-2xl rounded-2xl overflow-hidden bg-white/95 backdrop-blur-md border border-emerald-200">
            <Search className="absolute left-4 w-5 h-5 text-emerald-700 pointer-events-none" />
            <input
              type="text"
              value={generalQuery}
              onChange={(e) => setGeneralQuery(e.target.value)}
              placeholder="Bạn muốn biết điều gì về Mộc Châu? (Ví dụ: Thời tiết, quán ăn, homestay...)"
              className="w-full pl-12 pr-36 py-4 text-xs sm:text-sm text-stone-900 font-medium focus:outline-none bg-transparent"
            />
            <button
              type="submit"
              disabled={loadingAi}
              className="absolute right-1.5 top-1.5 bottom-1.5 px-5 bg-[#1b4332] hover:bg-emerald-800 disabled:opacity-70 text-white rounded-xl font-bold text-xs sm:text-sm tracking-wide transition-colors shadow-md flex items-center space-x-1.5 cursor-pointer"
            >
              {loadingAi ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Đang hỏi AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Hỏi AI ngay</span>
                </>
              )}
            </button>
          </div>
        </motion.form>

        {/* 4 Major Interactive Destination Choice Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full max-w-6xl mt-8 sm:mt-12 text-left"
        >
          <button
            onClick={() => setActiveTab("trip_prep")}
            className="group bg-stone-900/80 hover:bg-[#1b4332] border border-stone-800 hover:border-emerald-500/60 p-4 sm:p-6 rounded-2xl sm:rounded-3xl transition-all duration-300 shadow-xl cursor-pointer text-left relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-400/20 transition-all"></div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-base sm:text-lg mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
              🎒
            </div>
            <h3 className="text-white font-extrabold text-sm sm:text-base tracking-tight">Tôi sắp đi Mộc Châu</h3>
            <p className="text-stone-300 text-xs mt-1 sm:mt-1.5 font-sans leading-relaxed line-clamp-2">
              Lịch trình gợi ý, dự toán chi phí, phương tiện di chuyển & homestay.
            </p>
            <span className="inline-flex items-center text-emerald-400 text-xs font-bold mt-2.5 sm:mt-4 group-hover:translate-x-1 transition-transform">
              Khám phá ngay →
            </span>
          </button>

          <button
            onClick={() => setActiveTab("explore_around")}
            className="group bg-stone-900/80 hover:bg-[#1b4332] border border-stone-800 hover:border-emerald-500/60 p-4 sm:p-6 rounded-2xl sm:rounded-3xl transition-all duration-300 shadow-xl cursor-pointer text-left relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-400/20 transition-all"></div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-base sm:text-lg mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
              📍
            </div>
            <h3 className="text-white font-extrabold text-sm sm:text-base tracking-tight">Tôi đang ở Mộc Châu</h3>
            <p className="text-stone-300 text-xs mt-1 sm:mt-1.5 font-sans leading-relaxed line-clamp-2">
              Điểm tham quan, ăn uống, vị trí bản đồ và dịch vụ di chuyển quanh đảo.
            </p>
            <span className="inline-flex items-center text-amber-300 text-xs font-bold mt-2.5 sm:mt-4 group-hover:translate-x-1 transition-transform">
              Xem bản đồ →
            </span>
          </button>

          <button
            onClick={() => setActiveTab("moc_chau_today")}
            className="group bg-stone-900/80 hover:bg-[#1b4332] border border-stone-800 hover:border-emerald-500/60 p-4 sm:p-6 rounded-2xl sm:rounded-3xl transition-all duration-300 shadow-xl cursor-pointer text-left relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-400/20 transition-all"></div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-base sm:text-lg mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
              🌸
            </div>
            <h3 className="text-white font-extrabold text-sm sm:text-base tracking-tight">Mộc Châu hôm nay có gì?</h3>
            <p className="text-stone-300 text-xs mt-1 sm:mt-1.5 font-sans leading-relaxed line-clamp-2">
              Dự báo thời tiết, mùa hoa mận nở rộ & tình trạng điểm tham quan xác thực.
            </p>
            <span className="inline-flex items-center text-teal-300 text-xs font-bold mt-2.5 sm:mt-4 group-hover:translate-x-1 transition-transform">
              Cập nhật mới →
            </span>
          </button>

          <button
            onClick={() => setActiveTab("community")}
            className="group bg-stone-900/80 hover:bg-[#1b4332] border border-stone-800 hover:border-emerald-500/60 p-4 sm:p-6 rounded-2xl sm:rounded-3xl transition-all duration-300 shadow-xl cursor-pointer text-left relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-400/20 transition-all"></div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-base sm:text-lg mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
              💬
            </div>
            <h3 className="text-white font-extrabold text-sm sm:text-base tracking-tight">Hỏi cộng đồng</h3>
            <p className="text-stone-300 text-xs mt-1 sm:mt-1.5 font-sans leading-relaxed line-clamp-2">
              Hỏi đáp kinh nghiệm du lịch, tham gia các nhóm Zalo chuyên biệt Mộc Châu.
            </p>
            <span className="inline-flex items-center text-indigo-300 text-xs font-bold mt-2.5 sm:mt-4 group-hover:translate-x-1 transition-transform">
              Tham gia ngay →
            </span>
          </button>
        </motion.div>

        {/* Travel Exploration Categories Grid */}
        <div 
          id="travel_categories_grid"
          className="w-full max-w-6xl mt-10 sm:mt-16 bg-gradient-to-br from-stone-950/95 via-emerald-950/40 to-stone-950/95 border border-emerald-500/30 p-5 sm:p-8 rounded-3xl text-left backdrop-blur-2xl shadow-2xl relative overflow-hidden"
        >
          {/* Subtle background glow */}
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 sm:mb-6 pb-4 border-b border-emerald-500/20 gap-2 relative z-10">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] sm:text-xs uppercase tracking-widest text-emerald-400 font-extrabold bg-emerald-900/60 border border-emerald-400/30 px-2.5 py-0.5 rounded-full">
                  🌿 Dịch Vụ & Cẩm Nang Du Lịch Mộc Châu
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1 tracking-tight">
                12 Chuyên Mục Du Lịch Trải Nghiệm Mộc Châu
              </h2>
            </div>
            <p className="text-xs text-stone-300 max-w-xs font-sans leading-relaxed">
              Chọn chuyên mục để xem danh sách địa điểm, dịch vụ xe, homestay và thông tin xác thực.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3.5 relative z-10">
            {[
              { label: "Thời tiết", icon: Sun, cat: "thoi-tiet", sub: "Dự báo Live 24/7", badge: "LIVE", badgeColor: "bg-red-500" },
              { label: "Mùa hoa", icon: Sparkles, cat: "mua-hoa", sub: "Mận nở rộ tháng 1-2", badge: "HOT", badgeColor: "bg-amber-500" },
              { label: "Lịch trình", icon: CalendarDays, cat: "lich-trinh", sub: "Gợi ý 2N1Đ, 3N2Đ" },
              { label: "Điểm tham quan", icon: MapPin, cat: "dia-diem", sub: "Bạch Long, Bản Áng" },
              { label: "Homestay", icon: Home, cat: "homestay", sub: "View đồi chè đẹp", badge: "TOP", badgeColor: "bg-emerald-500" },
              { label: "Khách sạn", icon: Hotel, cat: "khach-san", sub: "Resort tiện nghi" },
              { label: "Nhà hàng", icon: Utensils, cat: "nha-hang", sub: "Bê chao, cá suối", badge: "NGON", badgeColor: "bg-orange-500" },
              { label: "Đặc sản", icon: ShoppingBag, cat: "dac-san", sub: "Mận dẻo, sữa tươi" },
              { label: "Trải nghiệm", icon: Compass, cat: "trai-nghiem", sub: "Săn mây, hái mận" },
              { label: "Di chuyển", icon: Car, cat: "di-chuyen", sub: "QT Limousine VIP", badge: "VIP", badgeColor: "bg-emerald-600" },
              { label: "Chi phí", icon: Ticket, cat: "chi-phi", sub: "Dự toán ngân sách" },
              { label: "Hỗ trợ 24/7", icon: HelpCircle, cat: "ho-tro", sub: "Hotline cứu hộ", badge: "24/7", badgeColor: "bg-blue-500" },
            ].map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveTab(`cat:${cat.cat}`)}
                  className="group relative bg-stone-900/90 hover:bg-[#1b4332] active:scale-[0.98] border border-stone-800 hover:border-emerald-400/60 p-3 sm:p-4 rounded-2xl flex flex-col items-center text-center transition-all duration-300 cursor-pointer shadow-lg hover:shadow-emerald-950/50 min-h-[90px] justify-between"
                  id={`hero_cat_${cat.cat}`}
                >
                  {cat.badge && (
                    <span className={`absolute -top-1.5 -right-1 text-[8px] font-black text-white px-1.5 py-0.2 rounded-full uppercase shadow-xs ${cat.badgeColor || 'bg-emerald-500'}`}>
                      {cat.badge}
                    </span>
                  )}
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center mb-1 group-hover:scale-110 group-hover:bg-emerald-500/30 group-hover:text-amber-300 transition-all shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-white text-xs font-black tracking-tight leading-tight block group-hover:text-amber-200 transition-colors">
                      {cat.label}
                    </span>
                    <span className="text-[9.5px] text-stone-400 group-hover:text-emerald-100 mt-0.5 block leading-tight font-sans">
                      {cat.sub}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick QT Limousine Booking Bar with Restored Pickup & Dropoff Specific Address Fields */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="w-full max-w-5xl mt-8 sm:mt-12 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-2xl border border-stone-100 text-left"
          id="limousine_quick_booking"
        >
          <div className="flex items-center justify-between mb-3 sm:mb-4 pb-2.5 sm:pb-3 border-b border-stone-100">
            <div className="flex items-center space-x-2">
              <Car className="w-5 h-5 text-emerald-700" />
              <h3 className="font-extrabold text-sm sm:text-base text-stone-900">Đặt Xe QT Limousine Nhanh</h3>
            </div>
            <div className="flex space-x-1.5 sm:space-x-2">
              <button
                type="button"
                onClick={() => setSubType('limousine')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${subType === 'limousine' ? 'bg-[#1b4332] text-white' : 'bg-stone-100 text-stone-600'}`}
              >
                Limousine
              </button>
              <button
                type="button"
                onClick={() => setSubType('combo')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${subType === 'combo' ? 'bg-[#1b4332] text-white' : 'bg-stone-100 text-stone-600'}`}
              >
                Combo Xe + Phòng
              </button>
            </div>
          </div>

          <form onSubmit={handleBookingSearch} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Route From */}
              <div className="md:col-span-4 space-y-1">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Điểm xuất phát</label>
                <select
                  value={routeFromType}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    setRouteFromType(val);
                    if (val !== "Mộc Châu") {
                      setRouteToType("Mộc Châu");
                    } else {
                      setRouteToType("Hà Nội");
                    }
                  }}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-bold text-[#1b4332] focus:outline-none focus:border-emerald-600 cursor-pointer min-h-[44px]"
                >
                  <option value="Hà Nội">Hà Nội</option>
                  <option value="Mộc Châu">Mộc Châu (Sơn La)</option>
                  <option value="other">Tỉnh khác (tự nhập)</option>
                </select>
                {routeFromType === "other" && (
                  <input
                    type="text"
                    value={customRouteFrom}
                    onChange={(e) => setCustomRouteFrom(e.target.value)}
                    placeholder="Nhập tên tỉnh/thành xuất phát..."
                    className="w-full mt-1.5 p-2 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-none"
                  />
                )}
              </div>

              {/* Swap Route Button */}
              <div className="md:col-span-1 flex justify-center py-1">
                <button
                  type="button"
                  onClick={handleSwapHeroRoute}
                  className="p-3 bg-emerald-50 hover:bg-emerald-100 text-[#1b4332] rounded-2xl border border-emerald-200 transition-all shadow-xs cursor-pointer flex items-center justify-center min-h-[44px] min-w-[44px]"
                  title="Đảo chiều tuyến đường"
                >
                  <ArrowLeftRight className="w-5 h-5" />
                </button>
              </div>

              {/* Route To */}
              <div className="md:col-span-4 space-y-1">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Điểm đến</label>
                <select
                  value={routeToType}
                  onChange={(e) => setRouteToType(e.target.value as any)}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-bold text-[#1b4332] focus:outline-none focus:border-emerald-600 cursor-pointer min-h-[44px]"
                >
                  {routeFromType === "Mộc Châu" ? (
                    <>
                      <option value="Hà Nội">Hà Nội</option>
                      <option value="other">Tỉnh khác (tự nhập)</option>
                    </>
                  ) : (
                    <option value="Mộc Châu">Mộc Châu (Sơn La)</option>
                  )}
                </select>
                {routeToType === "other" && (
                  <input
                    type="text"
                    value={customRouteTo}
                    onChange={(e) => setCustomRouteTo(e.target.value)}
                    placeholder="Nhập tên tỉnh/thành đến..."
                    className="w-full mt-1.5 p-2 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-none"
                  />
                )}
              </div>

              {/* Travel Date */}
              <div className="md:col-span-3 space-y-1">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Ngày đi</label>
                <input
                  type="date"
                  min={getTodayString()}
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-bold text-stone-800 focus:outline-none focus:border-emerald-600 cursor-pointer min-h-[44px]"
                />
              </div>
            </div>

            {/* Specific Pickup & Dropoff Address Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-stone-200/60">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-[#1b4332] uppercase tracking-wider block flex items-center justify-between">
                  <span>📍 Điểm đón dự kiến ({effectiveRouteFrom}):</span>
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">Đón tận nhà</span>
                </label>
                <input
                  type="text"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder={effectiveRouteFrom === "Mộc Châu" ? "Nhập tên Homestay, Khách sạn, Bản làng đón tại Mộc Châu..." : `Nhập số nhà, tên đường, ngõ phố đón tại ${effectiveRouteFrom}...`}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-semibold text-stone-900 focus:outline-none focus:border-emerald-600 focus:bg-white min-h-[44px]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-[#1b4332] uppercase tracking-wider block flex items-center justify-between">
                  <span>🏠 Điểm trả / điểm đến dự kiến ({effectiveRouteTo}):</span>
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">Trả tận cửa</span>
                </label>
                <input
                  type="text"
                  value={dropoffAddress}
                  onChange={(e) => setDropoffAddress(e.target.value)}
                  placeholder={effectiveRouteTo === "Mộc Châu" ? "Nhập Homestay Bản Áng, Khách sạn, Thung lũng trả..." : `Nhập số nhà, tên đường, khu vực trả tại ${effectiveRouteTo}...`}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-semibold text-stone-900 focus:outline-none focus:border-emerald-600 focus:bg-white min-h-[44px]"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 bg-[#1b4332] hover:bg-emerald-800 text-white rounded-xl font-extrabold text-xs tracking-wider uppercase transition-colors shadow-md flex items-center justify-center space-x-1.5 cursor-pointer min-h-[48px]"
              >
                <Car className="w-4 h-4 text-emerald-400" />
                <span>Tìm & Đặt Vé QT Limousine Nhanh ({effectiveRouteFrom} ⇄ {effectiveRouteTo})</span>
              </button>
            </div>
          </form>
        </motion.div>

        {/* Agency Trust Authority Numbers */}
        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-5xl text-stone-300 border-t border-stone-800 pt-8">
          <div>
            <span className="block text-2xl md:text-3xl font-black text-white font-mono">15.000+</span>
            <span className="text-[11px] uppercase tracking-wider text-stone-400">Khách hàng tin tưởng</span>
          </div>
          <div>
            <span className="block text-2xl md:text-3xl font-black text-white font-mono">30+</span>
            <span className="text-[11px] uppercase tracking-wider text-stone-400">Dàn xe Limousine VIP</span>
          </div>
          <div>
            <span className="block text-2xl md:text-3xl font-black text-white font-mono">4.9 / 5</span>
            <span className="text-[11px] uppercase tracking-wider text-stone-400">Điểm đánh giá thực tế</span>
          </div>
          <div>
            <span className="block text-2xl md:text-3xl font-black text-white font-mono">100%</span>
            <span className="text-[11px] uppercase tracking-wider text-stone-400">Cam kết giữ chỗ chính xác</span>
          </div>
        </div>

      </div>

      {/* AI Multi-Intent Advisor Result Modal */}
      {aiResultModal && (
        <AIAdvisorResultView
          question={aiResultModal.question}
          result={aiResultModal.result}
          onClose={() => setAiResultModal(null)}
          onSelectBooking={() => {
            setAiResultModal(null);
            setActiveTab("limousine");
          }}
          onOpenItinerary={() => {
            setAiResultModal(null);
            setActiveTab("ai");
          }}
          onOpenCategory={(catKey) => {
            setAiResultModal(null);
            setActiveTab(`cat:${catKey}`);
          }}
        />
      )}
    </div>
  );
}
