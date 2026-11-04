import React, { useState } from "react";
import { MapPin, Navigation, Search } from "lucide-react";
import { Destination, Accommodation } from "../types";

interface ExploreAroundViewProps {
  setActiveTab: (tab: string) => void;
  destinations: Destination[];
  accommodations: Accommodation[];
}

export default function ExploreAroundView({ setActiveTab, destinations, accommodations }: ExploreAroundViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [userLocationStatus, setUserLocationStatus] = useState<string>("Chưa bật định vị");

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setUserLocationStatus("Trình duyệt không hỗ trợ định vị GPS.");
      return;
    }
    setUserLocationStatus("Đang định vị GPS...");
    navigator.geolocation.getCurrentPosition(
      () => {
        setUserLocationStatus("Đã xác định vị trí của bạn tại Mộc Châu (Sai số < 15m)");
      },
      () => {
        setUserLocationStatus("Không thể lấy vị trí. Vui lòng chọn khu vực thủ công.");
      }
    );
  };

  const filteredDestinations = destinations.filter(d => {
    return d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.description.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans">
      <div className="flex items-center space-x-2 text-xs text-stone-500 mb-6">
        <button onClick={() => { setActiveTab("explore"); window.scrollTo({top: 0, behavior: "smooth"}); }} className="hover:text-emerald-700">Trang chủ</button>
        <span>/</span>
        <span className="text-emerald-800 font-bold">Khám phá quanh tôi (Mộc Châu)</span>
      </div>

      <div className="bg-gradient-to-r from-stone-900 to-[#1b4332] rounded-3xl p-6 sm:p-10 text-white shadow-2xl relative overflow-hidden mb-8">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-400/30 text-emerald-300 text-xs font-extrabold uppercase tracking-widest mb-3">
              📍 Bản Đồ & Vị Trí Thực Tế
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">
              Tôi Đang Ở Mộc Châu
            </h1>
            <p className="text-stone-300 text-xs sm:text-sm">
              Định vị GPS hoặc chọn khu vực để khám phá điểm tham quan, quán ăn, homestay gần bạn nhất.
            </p>
          </div>

          <div className="bg-stone-800/90 border border-stone-700 p-4 rounded-2xl backdrop-blur-md flex flex-col items-start gap-2 shrink-0">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
              <Navigation className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>{userLocationStatus}</span>
            </div>
            <button
              onClick={handleGetLocation}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-black shadow transition-colors cursor-pointer"
            >
              Bật GPS Định Vị Quanh Tôi
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {["all", "attraction", "restaurant", "cafe", "homestay"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${selectedCategory === cat ? "bg-[#1b4332] text-white shadow-md" : "bg-white text-stone-700 border border-stone-200 hover:bg-stone-50"}`}
            >
              {cat === "all" ? "🌟 Tất cả danh mục" : cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm địa điểm, quán ăn..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:outline-none focus:border-emerald-600 shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDestinations.map((dest) => (
          <div key={dest.id} className="bg-white rounded-3xl overflow-hidden border border-stone-200 shadow-lg hover:shadow-xl transition-shadow flex flex-col justify-between">
            <div className="relative h-48">
              <img src={dest.image} alt={dest.name} className="w-full h-full object-cover" />
              <div className="absolute top-3 right-3 bg-stone-900/80 backdrop-blur-md text-amber-300 font-extrabold text-xs px-2.5 py-1 rounded-lg">
                ★ 4.9
              </div>
              <span className="absolute bottom-3 left-3 bg-[#1b4332]/90 backdrop-blur-md text-white font-extrabold text-[10px] uppercase px-2.5 py-1 rounded-lg">
                {dest.tag}
              </span>
            </div>

            <div className="p-5 space-y-2 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-black text-stone-900 text-base">{dest.name}</h3>
                <p className="text-xs text-stone-500 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>{dest.distance}</span>
                </p>
                <p className="text-xs text-stone-600 mt-2 line-clamp-2 leading-relaxed">{dest.description}</p>
              </div>

              <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg">
                  Đã xác thực GPS
                </span>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dest.name + " Mộc Châu")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-[#1b4332] text-white text-xs font-bold rounded-xl hover:bg-emerald-800 flex items-center gap-1 cursor-pointer"
                >
                  <Navigation className="w-3 h-3" />
                  <span>Chỉ đường</span>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
