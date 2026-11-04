import React, { useState, useMemo } from "react";
import { Destination, GuideArticle } from "../types";
import { 
  Clock, Info, Check, Sparkles, MapPin, Compass, Ticket, 
  ChevronRight, Search, X, Filter, Navigation, Calendar, 
  DollarSign, Users, Share2, Heart, Bookmark, Phone, ArrowRight,
  ExternalLink, Layers, Eye
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import DestinationReview from "./DestinationReview";
import { INITIAL_ARTICLES } from "../data/articles";

const heroImg = "/src/assets/images/moc_chau_hero_1779246188232.png";

interface ExploreMocChauProps {
  destinations: Destination[];
  articles?: GuideArticle[];
  onSelectBooking?: () => void;
  currentUser?: any;
}

const CATEGORY_CHIPS = [
  { id: "all", label: "Tất cả", icon: "🌐" },
  { id: "nature", label: "Thiên nhiên", icon: "🌿" },
  { id: "checkin", label: "Điểm check-in", icon: "📸" },
  { id: "flowers", label: "Mùa hoa", icon: "🌸" },
  { id: "culture", label: "Văn hóa bản địa", icon: "🏔️" },
  { id: "food", label: "Ăn uống", icon: "🍲" },
  { id: "homestay", label: "Homestay", icon: "🏡" },
  { id: "hotel", label: "Khách sạn", icon: "🏨" },
  { id: "experience", label: "Trải nghiệm", icon: "🎢" },
  { id: "family", label: "Gia đình", icon: "👨‍👩‍👧‍👦" },
  { id: "free", label: "Miễn phí vé", icon: "🆓" }
];

export default function ExploreMocChau({ 
  destinations, 
  articles = INITIAL_ARTICLES,
  onSelectBooking, 
  currentUser 
}: ExploreMocChauProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  
  // Filter states
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedPrice, setSelectedPrice] = useState("all");
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [selectedSeason, setSelectedSeason] = useState("all");
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Detail Modal State
  const [detailPlace, setDetailPlace] = useState<Destination | null>(null);

  const isAdmin = currentUser?.role === "operator";

  // Filtered destinations list logic
  const filteredDestinations = useMemo(() => {
    return destinations.filter(dest => {
      const name = (dest.name || "").toLowerCase();
      const desc = (dest.description || "").toLowerCase();
      const tag = (dest.tag || "").toLowerCase();
      const dist = (dest.distance || "").toLowerCase();
      const tips = (dest.tips || "").toLowerCase();
      const query = searchQuery.toLowerCase().trim();

      // Search Query filter
      if (query && !name.includes(query) && !desc.includes(query) && !tag.includes(query) && !dist.includes(query)) {
        return false;
      }

      // Quick Category Chip Filter
      if (activeCategory !== "all") {
        if (activeCategory === "nature" && !tag.includes("thiên nhiên") && !tag.includes("thác") && !tag.includes("đồi chè") && !tag.includes("đồi") && !tag.includes("rừng")) return false;
        if (activeCategory === "checkin" && !tag.includes("check-in") && !tag.includes("sống ảo") && !tag.includes("cầu kính")) return false;
        if (activeCategory === "flowers" && !tag.includes("mùa hoa") && !tag.includes("mận") && !tag.includes("cải") && !tag.includes("đào")) return false;
        if (activeCategory === "culture" && !tag.includes("bản") && !tag.includes("văn hóa") && !tag.includes("làng") && !tag.includes("phiên")) return false;
        if (activeCategory === "food" && !tag.includes("ẩm thực") && !tag.includes("ăn uống") && !tag.includes("quán")) return false;
        if (activeCategory === "homestay" && !tag.includes("homestay")) return false;
        if (activeCategory === "hotel" && !tag.includes("khách sạn") && !tag.includes("resort")) return false;
        if (activeCategory === "experience" && !tag.includes("trải nghiệm") && !tag.includes("hái mận") && !tag.includes("cắm trại")) return false;
        if (activeCategory === "family" && !tag.includes("gia đình") && !tag.includes("trẻ em")) return false;
        if (activeCategory === "free" && !desc.includes("miễn phí") && !tips.includes("miễn phí") && !tag.includes("miễn phí")) return false;
      }

      // Region Filter
      if (selectedRegion !== "all") {
        if (selectedRegion === "town" && !dist.includes("trung tâm") && !dist.includes("thị trấn")) return false;
        if (selectedRegion === "farm" && !dist.includes("nông trường") && !dist.includes("đồi chè")) return false;
        if (selectedRegion === "ang" && !dist.includes("bản áng") && !dist.includes("đông sang")) return false;
        if (selectedRegion === "naka" && !dist.includes("nà ka") && !dist.includes("mu náu")) return false;
        if (selectedRegion === "vanho" && !dist.includes("vân hồ") && !dist.includes("chiềng khoa")) return false;
      }

      // Price Filter
      if (selectedPrice !== "all") {
        const isFree = desc.includes("miễn phí") || tips.includes("miễn phí") || tag.includes("miễn phí");
        if (selectedPrice === "free" && !isFree) return false;
        if (selectedPrice === "under_50k" && !isFree && desc.includes("200.000")) return false;
      }

      return true;
    });
  }, [destinations, searchQuery, activeCategory, selectedRegion, selectedPrice, selectedGroup, selectedSeason]);

  const handleOpenGoogleMaps = (placeName: string) => {
    const encoded = encodeURIComponent(`${placeName}, Mộc Châu, Sơn La`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, "_blank");
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 font-sans text-left" id="explore_moc_chau_section">
      
      {/* 1. Compact Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="bg-emerald-100 text-emerald-800 text-[10px] sm:text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
            📍 DANH MỤC DU LỊCH MỘC CHÂU
          </span>
          <span className="text-stone-400 text-xs hidden sm:inline">• Dữ liệu xác thực thực tế</span>
        </div>
        <span className="text-stone-500 text-xs font-bold font-mono">
          {filteredDestinations.length} Tọa độ
        </span>
      </div>

      {/* 2. Compact Title & Scenic Banner */}
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg border border-stone-200 mb-4 bg-stone-900">
        <div className="aspect-[21/9] sm:aspect-[24/8] w-full relative">
          <img
            src={heroImg}
            alt="Khám phá Mộc Châu"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 text-white">
            <h1 className="text-xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight">
              Khám phá Mộc Châu
            </h1>
            <p className="text-stone-200 text-xs sm:text-sm font-sans mt-1 max-w-2xl line-clamp-2">
              Danh mục tổng hợp tọa độ check-in, thiên nhiên, homestay và ẩm thực cao nguyên Mộc Châu được xác thực thực tế.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Search Box */}
      <div className="relative mb-3">
        <div className="relative flex items-center bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/10">
          <Search className="w-4.5 h-4.5 text-stone-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên địa điểm, thung lũng, đồi chè, homestay..."
            className="w-full pl-10 pr-24 py-3 text-xs sm:text-sm text-stone-900 font-medium focus:outline-none bg-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-12 text-stone-400 hover:text-stone-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            className={`absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors ${
              showFilterDrawer || selectedRegion !== "all" || selectedPrice !== "all"
                ? "bg-[#1b4332] text-white"
                : "bg-stone-100 text-stone-700 hover:bg-stone-200"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bộ lọc</span>
          </button>
        </div>
      </div>

      {/* 4. Quick Filter Chips Bar (Scrollable) */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
        {CATEGORY_CHIPS.map((chip) => {
          const isActive = activeCategory === chip.id;
          return (
            <button
              key={chip.id}
              onClick={() => setActiveCategory(chip.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 whitespace-nowrap transition-all cursor-pointer border ${
                isActive
                  ? "bg-[#1b4332] text-white border-[#1b4332] shadow-xs scale-[1.02]"
                  : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
              }`}
            >
              <span>{chip.icon}</span>
              <span>{chip.label}</span>
            </button>
          );
        })}
      </div>

      {/* 5. Filter Controls Drawer (Toggleable) */}
      <AnimatePresence>
        {showFilterDrawer && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-stone-50 border border-stone-200 rounded-2xl p-4 mb-5 space-y-3 overflow-hidden text-xs text-stone-800"
          >
            <div className="flex justify-between items-center border-b border-stone-200 pb-2">
              <span className="font-extrabold text-[#1b4332] uppercase tracking-wider flex items-center space-x-1.5">
                <Filter className="w-4 h-4 text-emerald-600" />
                <span>Bộ lọc chi tiết địa điểm</span>
              </span>
              <button
                onClick={() => {
                  setSelectedRegion("all");
                  setSelectedPrice("all");
                  setSelectedGroup("all");
                  setSelectedSeason("all");
                }}
                className="text-[11px] text-emerald-700 font-bold hover:underline"
              >
                Đặt lại bộ lọc
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Region Filter */}
              <div className="space-y-1">
                <label className="font-bold text-stone-600 block text-[10px] uppercase">Khu vực Mộc Châu</label>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full p-2 bg-white border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-600"
                >
                  <option value="all">Tất cả khu vực</option>
                  <option value="town">Trung tâm thị trấn Mộc Châu</option>
                  <option value="farm">Thị trấn Nông Trường</option>
                  <option value="ang">Bản Áng / Đông Sang</option>
                  <option value="naka">Thung lũng Nà Ka / Mu Náu</option>
                  <option value="vanho">Vân Hồ / Chiềng Khoa</option>
                </select>
              </div>

              {/* Price Filter */}
              <div className="space-y-1">
                <label className="font-bold text-stone-600 block text-[10px] uppercase">Giá vé tham khảo</label>
                <select
                  value={selectedPrice}
                  onChange={(e) => setSelectedPrice(e.target.value)}
                  className="w-full p-2 bg-white border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-600"
                >
                  <option value="all">Tất cả mức giá</option>
                  <option value="free">Miễn phí vé vào</option>
                  <option value="under_50k">Dưới 50.000đ/vé</option>
                  <option value="over_50k">Từ 50.000đ trở lên</option>
                </select>
              </div>

              {/* Suitable Group Filter */}
              <div className="space-y-1">
                <label className="font-bold text-stone-600 block text-[10px] uppercase">Phù hợp nhóm</label>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full p-2 bg-white border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-600"
                >
                  <option value="all">Tất cả các nhóm</option>
                  <option value="couple">Cặp đôi / Bạn thân</option>
                  <option value="family">Gia đình có trẻ em</option>
                  <option value="group">Phượt / Nhóm đông</option>
                </select>
              </div>

              {/* Season Filter */}
              <div className="space-y-1">
                <label className="font-bold text-stone-600 block text-[10px] uppercase">Mùa du lịch đẹp nhất</label>
                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(e.target.value)}
                  className="w-full p-2 bg-white border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-600"
                >
                  <option value="all">Quanh năm (Bốn mùa)</option>
                  <option value="spring">Mùa hoa mận (Tháng 1-2)</option>
                  <option value="summer">Mùa mận chín (Tháng 5-6)</option>
                  <option value="autumn">Mùa săn mây (Tháng 9-10)</option>
                  <option value="winter">Mùa hoa cải trắng (Tháng 11-12)</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. Featured Places Grid (Thẻ Địa Điểm Mobile First) */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base sm:text-lg font-black text-[#1b4332] flex items-center space-x-1.5">
            <Compass className="w-4.5 h-4.5 text-emerald-600" />
            <span>Địa Điểm & Tọa Độ Check-in</span>
          </h2>
          <span className="text-[11px] text-stone-500 font-medium">
            Hiển thị {filteredDestinations.length} địa điểm
          </span>
        </div>

        {filteredDestinations.length === 0 ? (
          <div className="bg-stone-50 border border-dashed border-stone-200 rounded-2xl p-8 text-center text-stone-500 space-y-2">
            <p className="font-bold text-sm text-stone-800">Không tìm thấy địa điểm nào phù hợp</p>
            <p className="text-xs">Thử xóa từ khóa tìm kiếm hoặc bấm Đặt lại bộ lọc.</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveCategory("all");
                setSelectedRegion("all");
                setSelectedPrice("all");
              }}
              className="px-4 py-2 bg-[#1b4332] text-white rounded-xl text-xs font-bold mt-2"
            >
              Xem tất cả địa điểm
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDestinations.map((dest) => {
              const ticketInfo = (dest.description || "").includes("miễn phí") || (dest.tips || "").includes("miễn phí") || (dest.tag || "").includes("miễn phí")
                ? "Vé: Miễn phí"
                : "Vé: Tham khảo";

              return (
                <div
                  key={dest.id}
                  className="bg-white border border-stone-200/90 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Photo Header */}
                    <div className="aspect-[16/10] relative overflow-hidden bg-stone-100">
                      <img
                        src={dest.image}
                        alt={dest.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-2.5 left-2.5 flex items-center space-x-1.5">
                        <span className="bg-stone-900/80 backdrop-blur-xs text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                          {dest.tag}
                        </span>
                      </div>
                      <div className="absolute top-2.5 right-2.5">
                        <span className="bg-emerald-600/95 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                          {ticketInfo}
                        </span>
                      </div>
                    </div>

                    {/* Content Details */}
                    <div className="p-3.5 space-y-2">
                      <div className="flex items-center space-x-1 text-[11px] text-emerald-800 font-bold">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{dest.distance}</span>
                      </div>

                      <h3 className="font-extrabold text-stone-900 text-sm sm:text-base leading-snug group-hover:text-emerald-700 transition-colors line-clamp-1">
                        {dest.name}
                      </h3>

                      <p className="text-stone-600 text-xs line-clamp-2 leading-relaxed font-sans">
                        {dest.description}
                      </p>

                      {dest.tips && (
                        <div className="bg-emerald-50/60 p-2 rounded-xl border border-emerald-100/80 text-[11px] text-emerald-950 flex items-start space-x-1.5 font-sans">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="line-clamp-1 italic font-medium">"{dest.tips}"</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="p-3.5 pt-0 border-t border-stone-100 mt-2 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-stone-400 bg-stone-50 px-2 py-1 rounded-md">
                      Xác minh: 2026
                    </span>

                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleOpenGoogleMaps(dest.name)}
                        className="px-2.5 py-1.5 bg-stone-100 hover:bg-emerald-100 text-stone-700 hover:text-emerald-800 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer"
                        title="Mở chỉ đường Google Maps"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Chỉ đường</span>
                      </button>

                      <button
                        onClick={() => setDetailPlace(dest)}
                        className="px-3 py-1.5 bg-[#1b4332] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer shadow-2xs"
                      >
                        <span>Chi tiết</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Rating Reviews Section */}
                  <div className="px-3.5 pb-3">
                    <DestinationReview destinationId={dest.id} destinationName={dest.name} isAdmin={isAdmin} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 7. Quick Category Directories Grid */}
      <div className="mb-10 bg-stone-900 text-white rounded-3xl p-5 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <div>
            <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest">Khám phá nhanh</span>
            <h2 className="text-base sm:text-xl font-black text-white mt-0.5">10 Danh Mục Trải Nghiệm Mộc Châu</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {CATEGORY_CHIPS.filter(c => c.id !== "all").map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                window.scrollTo({ top: 300, behavior: "smooth" });
              }}
              className="p-3 bg-stone-800/80 hover:bg-[#1b4332] border border-stone-700/80 hover:border-emerald-500 rounded-2xl text-left transition-all cursor-pointer group"
            >
              <div className="text-xl mb-1 group-hover:scale-110 transition-transform">{cat.icon}</div>
              <h3 className="font-bold text-xs text-white group-hover:text-emerald-300">{cat.label}</h3>
              <p className="text-[10px] text-stone-400 mt-0.5 font-sans">Xem danh sách →</p>
            </button>
          ))}
        </div>
      </div>

      {/* 8. Mùa hoa & Sự kiện nổi bật */}
      <div className="mb-10 bg-emerald-950/20 border border-emerald-800/30 rounded-3xl p-5 sm:p-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🌸</span>
            <h2 className="text-base sm:text-xl font-black text-[#1b4332]">Săn Mùa Hoa & Trải Nghiệm Săn Mây</h2>
          </div>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full uppercase">Cập nhật thực tế</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-1">
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">Thung lũng mận Nà Ka</span>
            <h3 className="font-bold text-xs text-stone-900">Mùa Hoa Mận Trắng & Mận Chín</h3>
            <p className="text-[11px] text-stone-600 font-sans leading-relaxed">Hoa nở bạt ngàn tháng 1-2. Mận chín mọng trĩu cành tháng 5-6 thích hợp hái tại vườn.</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-1">
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">Rừng thông Bản Áng</span>
            <h3 className="font-bold text-xs text-stone-900">Cánh Đồng Hoa Cải Trắng & Dâu Tây</h3>
            <p className="text-[11px] text-stone-600 font-sans leading-relaxed">Không gian Đà Lạt thu nhỏ, hái dâu tây ngọt mát và cắm trại ven hồ lãng mạn.</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-1">
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">Đồi chè Trái Tim</span>
            <h3 className="font-bold text-xs text-stone-900">Check-in Đồi Chè Xanh Ngắt</h3>
            <p className="text-[11px] text-stone-600 font-sans leading-relaxed">Khung cảnh lãng mạn lứa đôi, đẹp nhất lúc 8h00 - 10h00 sáng khi nắng mai rọi sương.</p>
          </div>
        </div>
      </div>

      {/* 9. Related Guide Articles Section (Bài cẩm nang liên quan) */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-black text-[#1b4332] flex items-center space-x-1.5">
            <Ticket className="w-4.5 h-4.5 text-emerald-600" />
            <span>Bài Cẩm Nang & Kinh Nghiệm Liên Quan</span>
          </h2>
          <span className="text-[11px] text-stone-500 font-medium">Lưu trữ cẩm nang</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {articles.map((art) => (
            <div
              key={art.id}
              className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="aspect-[16/10] relative overflow-hidden bg-stone-100">
                  <img
                    src={art.imageUrl}
                    alt={art.title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2 left-2 bg-stone-900/80 text-white text-[9px] font-bold px-2 py-0.5 rounded-md uppercase">
                    {art.categoryLabel}
                  </span>
                </div>
                <div className="p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-stone-400 font-medium">
                    <span>{art.date}</span>
                    <span>⏱️ {art.readTime}</span>
                  </div>
                  <h3 className="font-extrabold text-stone-900 text-xs sm:text-sm line-clamp-2 leading-snug">
                    {art.title}
                  </h3>
                  <p className="text-stone-500 text-[11px] line-clamp-2 font-sans leading-relaxed">
                    {art.excerpt}
                  </p>
                </div>
              </div>

              <div className="p-3.5 pt-0 border-t border-stone-100 mt-2 flex justify-between items-center text-[11px]">
                <span className="text-stone-400 font-mono">👁️ {art.views || 1200}</span>
                <span className="text-emerald-700 font-bold flex items-center space-x-1">
                  <span>Đọc bài</span>
                  <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 10. Direct Transport CTA */}
      <div className="bg-[#1b4332] text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-xs text-amber-300 font-bold uppercase tracking-wider block">Xe QT Limousine Đón Tận Nhà</span>
            <h3 className="text-lg sm:text-2xl font-black">Khám Phá Mộc Châu Thỏa Thích Không Lo Di Chuyển</h3>
            <p className="text-xs sm:text-sm text-emerald-100 font-sans max-w-xl">
              Đón trả tận nhà tại Hà Nội và tận cửa mọi homestay, khách sạn tại Mộc Châu. Giá niêm yết từ 300.000đ/ghế.
            </p>
          </div>
          <button
            onClick={onSelectBooking}
            className="px-6 py-3.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs sm:text-sm rounded-2xl shadow-lg transition-colors shrink-0 uppercase tracking-wider flex items-center space-x-2 cursor-pointer"
          >
            <Compass className="w-4.5 h-4.5" />
            <span>Đặt Vé Xe Limousine Ngay</span>
          </button>
        </div>
      </div>

      {/* Place Detail Modal */}
      <AnimatePresence>
        {detailPlace && (
          <div className="fixed inset-0 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-[120] text-left font-sans animate-fade-in">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-stone-100 flex flex-col max-h-[92vh]"
            >
              {/* Header Image */}
              <div className="aspect-[16/9] w-full relative bg-stone-900">
                <img
                  src={detailPlace.image}
                  alt={detailPlace.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setDetailPlace(null)}
                  className="absolute top-3 right-3 bg-stone-900/80 hover:bg-stone-900 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm cursor-pointer transition-colors shadow-md"
                >
                  ✕
                </button>
                <div className="absolute bottom-3 left-3 flex gap-2">
                  <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                    {detailPlace.tag}
                  </span>
                  <span className="bg-stone-900/80 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                    {detailPlace.distance}
                  </span>
                </div>
              </div>

              {/* Body details */}
              <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
                <div>
                  <h3 className="text-xl font-extrabold text-[#1b4332] tracking-tight">{detailPlace.name}</h3>
                  <p className="text-xs text-stone-500 mt-0.5 font-medium">Xác minh thông tin: Tháng 05/2026</p>
                </div>

                <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80 text-xs text-stone-700 leading-relaxed font-sans">
                  <p className="font-bold text-stone-900 mb-1">Mô tả & Nổi bật:</p>
                  {detailPlace.description}
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200/60">
                    <span className="text-[10px] font-extrabold text-emerald-800 uppercase block mb-0.5">Thờ điểm ghé thăm</span>
                    <span className="font-bold text-stone-900">{detailPlace.bestTime}</span>
                  </div>
                  <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200/60">
                    <span className="text-[10px] font-extrabold text-amber-800 uppercase block mb-0.5">Vé tham khảo</span>
                    <span className="font-bold text-stone-900">
                      {detailPlace.description.includes("miễn phí") ? "Miễn phí vé" : "Từ 30.000đ - 100.000đ"}
                    </span>
                  </div>
                </div>

                {detailPlace.tips && (
                  <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200 text-xs text-emerald-950 font-sans">
                    <span className="font-extrabold text-stone-900 block mb-1">💡 Kinh nghiệm & Mẹo check-in:</span>
                    <p className="italic">"{detailPlace.tips}"</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleOpenGoogleMaps(detailPlace.name)}
                    className="flex-1 py-3 bg-stone-100 hover:bg-emerald-100 text-[#1b4332] rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-1.5 cursor-pointer border border-stone-200"
                  >
                    <Navigation className="w-4 h-4 text-emerald-700" />
                    <span>Mở Chỉ Đường Maps</span>
                  </button>

                  <button
                    onClick={() => {
                      setDetailPlace(null);
                      if (onSelectBooking) onSelectBooking();
                    }}
                    className="flex-1 py-3 bg-[#1b4332] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shadow-md"
                  >
                    <Compass className="w-4 h-4 text-amber-300" />
                    <span>Đặt Xe QT Limousine</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
