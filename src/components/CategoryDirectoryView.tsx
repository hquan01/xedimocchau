import React, { useState } from "react";
import { ArrowLeft, Search, MapPin, Star, CalendarDays, ExternalLink, Sparkles, Phone, ShieldCheck, Sun, CloudRain, Wind, Thermometer, Filter } from "lucide-react";
import MocChauWeatherSection from "./MocChauWeatherSection";

interface CategoryDirectoryViewProps {
  categoryKey: string;
  categoryTitle: string;
  categoryDescription: string;
  onBack: () => void;
  onSelectBooking: () => void;
  onOpenItemDetail: (item: any) => void;
  items: any[];
}

export default function CategoryDirectoryView({
  categoryKey,
  categoryTitle,
  categoryDescription,
  onBack,
  onSelectBooking,
  onOpenItemDetail,
  items
}: CategoryDirectoryViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  const filteredItems = items.filter(item => {
    const matchesSearch = !searchQuery || 
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tag?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.area?.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedFilter === "all") return matchesSearch;
    if (selectedFilter === "verified") return matchesSearch && (item.verified !== false);
    if (selectedFilter === "cheap") {
      const priceNum = parseInt(String(item.price || "").replace(/\D/g, "")) || 0;
      return matchesSearch && (priceNum > 0 && priceNum < 500000);
    }
    if (selectedFilter === "central") {
      return matchesSearch && (item.area?.includes("Trung tâm") || item.description?.includes("trung tâm"));
    }
    return matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-10 font-sans text-left">
      {/* Breadcrumb / Back button */}
      <div className="flex items-center space-x-2 text-xs text-stone-500 mb-4 sm:mb-6">
        <button onClick={onBack} className="flex items-center space-x-1 hover:text-[#1b4332] font-bold cursor-pointer min-h-[36px]">
          <ArrowLeft className="w-4 h-4" />
          <span>Trang chủ</span>
        </button>
        <span>/</span>
        <span className="text-emerald-800 font-extrabold capitalize truncate">{categoryTitle}</span>
      </div>

      {/* Header Banner - Mobile-optimized */}
      <div className="bg-gradient-to-r from-[#1b4332] via-[#24553f] to-emerald-950 text-white p-5 sm:p-10 rounded-2xl sm:rounded-3xl shadow-xl mb-6 sm:mb-10 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-72 h-72 sm:w-96 sm:h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        <span className="text-[10px] sm:text-xs bg-amber-400 text-stone-950 font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
          Mộc Châu Travel 2.0
        </span>
        <h1 className="text-xl sm:text-3xl lg:text-4xl font-black mt-2 tracking-tight">{categoryTitle}</h1>
        <p className="text-emerald-100 text-xs sm:text-sm mt-1.5 max-w-2xl font-sans leading-relaxed">
          {categoryDescription}
        </p>
      </div>

      {/* SPECIAL WEATHER VIEW: If Category is Weather */}
      {categoryKey === "thoi-tiet" && (
        <div className="mb-8">
          <MocChauWeatherSection onBookingClick={onSelectBooking} />
        </div>
      )}

      {/* Search & Dynamic Filter Bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Tìm kiếm trong ${categoryTitle.toLowerCase()}...`}
            className="w-full pl-10 pr-3 py-2.5 sm:py-3 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm font-semibold text-stone-800 shadow-2xs focus:outline-none focus:border-emerald-600 min-h-[44px]"
          />
        </div>

        {/* Scrollable horizontal filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          <button
            onClick={() => setSelectedFilter("all")}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors min-h-[36px] ${selectedFilter === 'all' ? 'bg-[#1b4332] text-white shadow-xs' : 'bg-white text-stone-600 border border-stone-200'}`}
          >
            Tất cả ({items.length})
          </button>
          <button
            onClick={() => setSelectedFilter("verified")}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors min-h-[36px] ${selectedFilter === 'verified' ? 'bg-[#1b4332] text-white shadow-xs' : 'bg-white text-stone-600 border border-stone-200'}`}
          >
            ✓ Đã xác minh
          </button>
          {(categoryKey === "homestay" || categoryKey === "khach-san") && (
            <button
              onClick={() => setSelectedFilter("cheap")}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors min-h-[36px] ${selectedFilter === 'cheap' ? 'bg-[#1b4332] text-white shadow-xs' : 'bg-white text-stone-600 border border-stone-200'}`}
            >
              Giá dưới 500k
            </button>
          )}
          {(categoryKey === "nha-hang" || categoryKey === "dia-diem") && (
            <button
              onClick={() => setSelectedFilter("central")}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors min-h-[36px] ${selectedFilter === 'central' ? 'bg-[#1b4332] text-white shadow-xs' : 'bg-white text-stone-600 border border-stone-200'}`}
            >
              Khu vực trung tâm
            </button>
          )}
        </div>
      </div>

      {/* Item Cards Grid - Mobile Friendly */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredItems.map((item, idx) => (
            <div
              key={item.id || idx}
              onClick={() => onOpenItemDetail(item)}
              className="bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-stone-200/90 shadow-2xs hover:shadow-lg transition-all cursor-pointer flex flex-col group"
            >
              <div className="aspect-[16/10] relative overflow-hidden bg-stone-100">
                <img
                  src={item.image || item.photo || "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80"}
                  alt={item.name || item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-2.5 left-2.5">
                  <span className="bg-stone-900/80 backdrop-blur-md text-white text-[9.5px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                    {item.tag || categoryTitle}
                  </span>
                </div>
              </div>

              <div className="p-4 sm:p-5 flex flex-col flex-1">
                <div className="flex items-center justify-between text-xs text-stone-400 mb-1.5">
                  <span className="flex items-center gap-1 font-bold text-emerald-800 text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Xác thực
                  </span>
                  {item.price && (
                    <span className="font-mono font-black text-stone-900 text-xs sm:text-sm">{item.price}</span>
                  )}
                </div>

                <h3 className="font-black text-stone-900 text-sm sm:text-base group-hover:text-emerald-800 transition-colors line-clamp-1">
                  {item.name || item.title}
                </h3>

                <p className="text-stone-500 text-xs mt-1.5 line-clamp-2 leading-relaxed font-sans">
                  {item.description || item.snippet || "Xem thông tin chi tiết, địa chỉ và dịch vụ đưa đón bằng xe QT Limousine."}
                </p>

                <div className="mt-auto pt-3 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700 group-hover:underline flex items-center gap-1 min-h-[36px]">
                    Xem chi tiết <ArrowLeft className="w-3 h-3 rotate-180" />
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">#{item.id}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 sm:py-24 bg-white rounded-2xl sm:rounded-3xl border border-dashed border-stone-200">
          <div className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-3 text-stone-400">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-stone-800 text-sm sm:text-base">Không tìm thấy kết quả phù hợp</h3>
          <p className="text-stone-500 text-xs mt-1">Vui lòng thử tìm kiếm bằng từ khóa khác hoặc bỏ chọn bộ lọc.</p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedFilter("all");
            }}
            className="mt-4 bg-[#1b4332] text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase transition-colors min-h-[44px]"
          >
            Hiện tất cả
          </button>
        </div>
      )}
    </div>
  );
}
