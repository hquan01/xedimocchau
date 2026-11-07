import React, { useState } from "react";
import {submitServiceInquiry} from "../lib/serviceRequests";
import {getVietnamToday} from "../lib/bookingTime";
import {useSiteContent} from "../lib/siteContent";
import { 
  Bus, Car, Bike, Hotel, Star, DollarSign, Sparkles, MapPin, Phone, 
  Search, CheckCircle2, ChevronRight, ShieldCheck, Clock, CalendarDays, 
  MessageSquare, User, Filter, ArrowRight, Award, Tag, Heart, UtensilsCrossed, Coffee, BookOpen, Flame
} from "lucide-react";
import { Accommodation, TourCombo, Destination, LocationPoint, User as UserType } from "../types";

interface ServicesHubViewProps {
  setActiveTab: (tab: string) => void;
  accommodations: Accommodation[];
  combos: TourCombo[];
  destinations: Destination[];
  currentUser: UserType | null;
  onSearchLimousine: (from: string, to: string, date: string, time?: string) => void;
  onSearchCombo: (hotelId: string, date: string, from?: string, to?: string, time?: string) => void;
  onOpenMotorbikeModal: () => void;
}

export default function ServicesHubView({
  setActiveTab,
  accommodations,
  combos,
  destinations,
  currentUser,
  onSearchLimousine,
  onSearchCombo,
  onOpenMotorbikeModal
}: ServicesHubViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<"all" | "transport" | "motorbike" | "accommodation" | "combo" | "restaurant" | "tour">(()=>{
    // Homepage "Giá vé tham quan" tile opens this tab directly.
    try {
      const selected = sessionStorage.getItem("mocchau_services_open_category");
      // Keep value until mount: React StrictMode may evaluate state initialization twice.
      if (selected === "tour" || selected === "restaurant" || selected === "accommodation" ||
          selected === "transport" || selected === "combo" || selected === "motorbike") return selected;
    } catch {}
    return "transport";
  });
  const {content: siteContent} = useSiteContent();
  React.useEffect(() => {
    try { sessionStorage.removeItem("mocchau_services_open_category"); } catch {}
  }, []);
  const [searchTerm, setSearchTerm] = useState("");
  const [foodFilter, setFoodFilter] = useState<"all" | "restaurant" | "cafe" | "grill" | "snack">("all");
  const serviceSearchItems = [
    { category:'transport' as const, name:'Xe QT Limousine & Taxi 4–7–9–16 chỗ', keywords:'limousine taxi o to xe dua don' },
    { category:'motorbike' as const, name:'Thuê xe máy Mộc Châu', keywords:'xe may xe so xe tay ga' },
    { category:'accommodation' as const, name:'Homestay & Khách sạn', keywords:'homestay khach san luu tru nha nghi' },
    { category:'combo' as const, name:'Combo xe và phòng', keywords:'combo phong khach san' },
    { category:'restaurant' as const, name:'Ẩm thực: địa điểm & món ngon', keywords:'an uong nha hang quan an cafe ca phe dac san be chao mon ngon' },
    { category:'tour' as const, name:'Bảng giá vé tham quan Mộc Châu', keywords:'ve tham quan gia ve diem du lich thac dai yem cau kinh bach long rung thong' },
  ];
  const simplify=(text:string)=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/đ/g,'d');
  const searchMatches=searchTerm.trim()?serviceSearchItems.filter(x=>simplify(x.name+' '+x.keywords).includes(simplify(searchTerm.trim()))):[];

  // Quick Taxi Booking Modal State
  const [isTaxiModalOpen, setIsTaxiModalOpen] = useState(false);
  const [taxiSeats, setTaxiSeats] = useState<4 | 7 | 9 | 16>(7);
  const [taxiPickup, setTaxiPickup] = useState("Khách sạn / Homestay Mộc Châu");
  const [taxiDropoff, setTaxiDropoff] = useState("Điểm tham quan Mộc Châu");
  const [taxiDate, setTaxiDate] = useState(() => new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().substring(0, 10));
  const [taxiTime, setTaxiTime] = useState("08:00");
  const [taxiPhone, setTaxiPhone] = useState(currentUser?.phone || "");
  const [taxiName, setTaxiName] = useState(currentUser?.name || "");
  const [taxiNotes, setTaxiNotes] = useState("");
  const [taxiSubmitted, setTaxiSubmitted] = useState(false);
  const [taxiSaving, setTaxiSaving] = useState(false);
  const [taxiError, setTaxiError] = useState("");
  const [taxiRequestId, setTaxiRequestId] = useState("");

  const handleBookTaxiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTaxiSaving(true);
    setTaxiError("");
    try {
      const id = await submitServiceInquiry({
        kind: "taxi",
        customerName: taxiName,
        customerPhone: taxiPhone,
        pickupPoint: taxiPickup,
        dropoffPoint: taxiDropoff,
        seats: taxiSeats,
        travelDate: taxiDate,
        departureTime: taxiTime,
        notes: taxiNotes.trim()
      });
      setTaxiRequestId(id);
      setTaxiSubmitted(true);
    } catch (err: any) {
      setTaxiError("Chưa gửi được yêu cầu: " + (err?.message || "Lỗi kết nối") + ". Vui lòng thử lại hoặc liên hệ Zalo.");
    } finally {
      setTaxiSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7faf7] pb-28 font-sans" id="services_hub_root">
      {/* Hero Header Banner */}
      <div className="bg-gradient-to-br from-[#1b4332] via-emerald-700 to-emerald-600 text-white pt-4 pb-5 sm:pt-5 sm:pb-6 px-4 sm:px-6 lg:px-8 relative overflow-hidden rounded-b-[1.5rem]">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/20 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <span className="hidden sm:inline-flex items-center space-x-2 bg-white/15 border border-white/20 px-3 py-1 rounded-full text-[10px] font-bold text-white tracking-wide mb-2">
            <Sparkles className="w-3.5 h-3.5 text-yellow-100" />
            <span>Mộc Châu Travel Của Bạn</span>
          </span>
          <h1 className="text-xl sm:text-4xl font-black tracking-tight text-white mb-1 sm:mb-2">
            Dịch vụ Mộc Châu
          </h1>
          <p className="text-emerald-50 text-[12px] sm:text-sm max-w-2xl mx-auto font-sans leading-snug sm:leading-relaxed">
            Đặt xe, thuê xe máy, tìm lưu trú và trải nghiệm phù hợp với chuyến đi.
          </p>

          {/* Quick Search bar */}
          <div className="mt-3 sm:mt-4 max-w-md mx-auto relative">
            <Search className="w-4 h-4 text-emerald-600 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Tìm xe, lưu trú, quán ăn, giá vé..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white text-stone-900 rounded-xl sm:rounded-3xl text-[14px] font-semibold shadow-md focus:outline-none focus:ring-4 focus:ring-emerald-200 placeholder:text-stone-500"
            />
            {searchTerm.trim()&&<div className="absolute top-full left-0 right-0 mt-2 z-30 bg-white border border-emerald-100 shadow-xl rounded-xl overflow-hidden text-left text-emerald-950">
              {searchMatches.length ? searchMatches.map(result=><button key={result.category} type="button" onClick={()=>{setSelectedCategory(result.category);setSearchTerm('');}} className="block w-full text-left px-4 py-3 text-sm font-semibold hover:bg-emerald-50 border-b last:border-b-0">{result.name}</button>) : <p className="p-3 text-xs text-stone-500">Không tìm thấy dịch vụ. Hãy thử từ khóa khác.</p>}
            </div>}
          </div>
        </div>
      </div>

      {/* Category Filter Chips Bar */}
      <div className="relative sm:sticky sm:top-16 z-20 bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-2.5">
          {/* One clearly selected service on small screens, without a nested dropdown. */}
          <div className="sm:hidden grid grid-cols-2 gap-2" role="group" aria-label="Chọn danh mục dịch vụ">
            {[
              {id:'transport',label:'Xe Limousine & Taxi',Icon:Bus},
              {id:'motorbike',label:'Thuê xe máy',Icon:Bike},
              {id:'accommodation',label:'Homestay & Khách sạn',Icon:Hotel},
              {id:'combo',label:'Combo xe & phòng',Icon:Star},
              {id:'restaurant',label:'Ăn uống & Đặc sản',Icon:UtensilsCrossed},
              {id:'tour',label:'Giá vé tham quan',Icon:MapPin}
            ].map((cat)=>(
              <button type="button" key={cat.id} aria-pressed={selectedCategory===cat.id}
                onClick={()=>setSelectedCategory(cat.id as typeof selectedCategory)}
                className={"flex items-center gap-2 min-h-[48px] rounded-xl border px-3 py-2.5 text-left text-[12px] font-bold leading-tight "+
                (selectedCategory===cat.id
                  ?"bg-emerald-800 border-emerald-800 text-white shadow-sm"
                  :"bg-white border-stone-200 text-stone-700")}>
                <cat.Icon className="w-5 h-5 shrink-0" aria-hidden="true"/>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
          <div className="hidden sm:flex space-x-2 overflow-x-auto custom-tab-scrollbar pb-1.5 pt-0.5">
            {[
              { id: "all", label: "Tất Cả Dịch Vụ", icon: Sparkles },
              { id: "transport", label: "Xe Limousine & Taxi", icon: Bus },
              { id: "motorbike", label: "Thuê Xe Máy", icon: Bike },
              { id: "accommodation", label: "Lưu Trú & Homestay", icon: Hotel },
              { id: "combo", label: "Combo Xe + Phòng", icon: Star },
              { id: "restaurant", label: "Ẩm Thực & Đặc Sản", icon: UtensilsCrossed },
              { id: "tour", label: "Bảng Giá Vé Tham Quan", icon: MapPin }
            ].map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id as any)}
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? "bg-emerald-700 text-white shadow-sm"
                      : "bg-white text-stone-600 hover:bg-emerald-100"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-yellow-100" : "text-emerald-600"}`} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Catalog Grid */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 space-y-5 text-left min-w-0 overflow-x-hidden">
        
        {/* SECTION 1: XE DI CHUYỂN & TAXI (LIMOUSINE, TAXI 4-16 CHỖ, THUÊ XE MÁY) */}
        {(selectedCategory === "all" || selectedCategory === "transport" || selectedCategory === "motorbike") && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-2">
              <h2 className="text-base sm:text-lg font-black text-stone-900 flex items-center gap-2">
                <Bus className="w-5 h-5 text-emerald-700" />
                <span>Dịch Vụ Vận Tải & Di Chuyển Mộc Châu</span>
              </h2>
              <span className="hidden sm:inline-flex text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                Gửi yêu cầu tư vấn
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Card 1: QT Limousine VIP 9 chỗ */}
              {(selectedCategory === "all" || selectedCategory === "transport") && (
                <div className="bg-white rounded-2xl p-4 border border-stone-200 hover:border-emerald-500 hover:shadow-lg transition-all flex flex-col justify-between group min-w-0 max-w-full overflow-hidden">
                  <div className="space-y-3">
                    <div className="flex flex-wrap justify-between items-start gap-2 min-w-0">
                      <span className="text-[10px] font-black uppercase text-amber-900 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-300">
                        ⭐ XE ĐÓN TRẢ TẬN NƠI VIP
                      </span>
                      <span className="font-sans font-black text-emerald-800 text-xs sm:text-sm break-words">Xem giá khi đặt</span>
                    </div>

                    <h3 className="font-black text-stone-900 text-base group-hover:text-emerald-800 transition-colors">
                      Xe QT Limousine VIP (DCar)
                    </h3>

                    <p className="text-[13px] sm:text-xs text-stone-600 font-sans leading-relaxed line-clamp-3 sm:line-clamp-none">
                      Chọn ngày đi để xem giờ xe và giá vé thực tế tuyến Hà Nội ⇌ Mộc Châu. Tiện nghi và điểm đón trả tùy từng chuyến, vui lòng kiểm tra trước khi đặt.
                    </p>

                    <div className="hidden sm:block bg-emerald-50/80 p-3 rounded-2xl border border-emerald-100 text-[11px] text-emerald-950 space-y-1">
                      <p>✓ Giờ xe được hiển thị khi tìm chuyến theo ngày đi.</p>
                      <p>✓ Điểm đón trả và chi phí phát sinh (nếu có) được kiểm tra trước khi xác nhận.</p>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-stone-100 flex gap-2">
                    <button
                      onClick={() => onSearchLimousine("Hà Nội", "Mộc Châu", getVietnamToday(), "all")}
                      className="flex-1 py-3 bg-[#1b4332] hover:bg-emerald-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer shadow-md text-center"
                    >
                      Đặt Vé Xe Ngay
                    </button>
                    <a
                      href="tel:0971050324"
                      className="p-3 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center"
                      title="Gọi tổng đài"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}

              {/* Card 2: Taxi & Xe Du Lịch 4 - 7 - 16 chỗ */}
              {(selectedCategory === "all" || selectedCategory === "transport") && (
                <div className="bg-white rounded-2xl p-4 border border-stone-200 hover:border-emerald-500 hover:shadow-lg transition-all flex flex-col justify-between group min-w-0 max-w-full overflow-hidden">
                  <div className="space-y-3">
                    <div className="flex flex-wrap justify-between items-start gap-2 min-w-0">
                      <span className="text-[10px] font-black uppercase text-teal-900 bg-teal-100 px-2.5 py-1 rounded-full border border-teal-300">
                        🚕 TAXI & XE HỢP ĐỒNG
                      </span>
                      <span className="font-sans font-black text-emerald-800 text-xs sm:text-sm break-words">Liên hệ báo giá</span>
                    </div>

                    <h3 className="font-black text-stone-900 text-base group-hover:text-emerald-800 transition-colors">
                      Taxi & xe du lịch 4 · 7 · 9 · 16 chỗ
                    </h3>

                    <p className="text-[13px] sm:text-xs text-stone-600 font-sans leading-relaxed line-clamp-3 sm:line-clamp-none">
                      Phục vụ tham quan đồi chè, hái mận Nà Ka, Cầu kính Bạch Long, Thác Dải Yếm và xe riêng đưa đón sân bay Nội Bài / Hà Nội về Mộc Châu.
                    </p>

                    <div className="hidden sm:block bg-teal-50/80 p-3 rounded-2xl border border-teal-100 text-[11px] text-teal-950 space-y-1">
                      <p>✓ Chọn chính xác xe 4, 7, 9 hoặc 16 chỗ</p>
                      <p>✓ Nhập điểm đón, điểm đến và thời gian sử dụng</p>
                      <p>✓ Giá sẽ được xác nhận sau khi đơn vị cung cấp báo giá</p>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-stone-100 flex gap-2">
                    <button
                      onClick={() => setIsTaxiModalOpen(true)}
                      className="flex-1 py-3 bg-[#1b4332] hover:bg-emerald-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer shadow-md text-center"
                    >
                      Yêu Cầu Báo Giá Taxi
                    </button>
                    <a
                      href="tel:0855368889"
                      className="p-3 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center"
                      title="Gọi hotline xe taxi"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}

              {/* Card 3: Thuê Xe Máy (Giao tận nơi) */}
              {(selectedCategory === "all" || selectedCategory === "motorbike") && (
                <div className="bg-white rounded-2xl p-4 border border-stone-200 hover:border-emerald-500 hover:shadow-lg transition-all flex flex-col justify-between group min-w-0 max-w-full overflow-hidden">
                  <div className="space-y-3">
                    <div className="flex flex-wrap justify-between items-start gap-2 min-w-0">
                      <span className="text-[10px] font-black uppercase text-indigo-900 bg-indigo-100 px-2.5 py-1 rounded-full border border-indigo-300">
                        🛵 GIAO XE TẬN NƠI FREE
                      </span>
                      <span className="font-sans font-black text-emerald-800 text-xs sm:text-sm break-words">Nhận báo giá theo ngày</span>
                    </div>

                    <h3 className="font-black text-stone-900 text-base group-hover:text-emerald-800 transition-colors">
                      Thuê Xe Máy Chinh Phục Mộc Châu
                    </h3>

                    <p className="text-[13px] sm:text-xs text-stone-600 font-sans leading-relaxed line-clamp-3 sm:line-clamp-none">
                      Xe Wave Alpha, RSX dẻo dai leo dốc khỏe & Xe Vision, Air Blade êm ái. Giao và nhận xe máy miễn phí tại Homestay, Khách sạn hoặc Bến xe.
                    </p>

                    <div className="hidden sm:block bg-indigo-50/80 p-3 rounded-2xl border border-indigo-100 text-[11px] text-indigo-950 space-y-1">
                      <p>🎁 Tặng kèm: 02 mũ bảo hiểm đạt chuẩn + 01 áo mưa tiện lợi</p>
                      <p>🎁 Tặng kèm: Bản đồ du lịch Mộc Châu cầm tay tiện lợi</p>
                      <p>✓ Thủ tục đơn giản: Chỉ cần ảnh chụp CCCD hoặc bằng lái xe</p>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-stone-100 flex gap-2">
                    <button
                      onClick={onOpenMotorbikeModal}
                      className="flex-1 py-3 bg-[#1b4332] hover:bg-emerald-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer shadow-md text-center"
                    >
                      Thuê Xe Máy Ngay
                    </button>
                    <a
                      href="https://zalo.me/0971050324"
                      target="_blank"
                      rel="noreferrer"
                      className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center"
                      title="Nhắn Zalo thuê xe"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION 2: LƯU TRÚ & HOMESTAY */}
        {(selectedCategory === "all" || selectedCategory === "accommodation") && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-2">
              <h2 className="text-base sm:text-lg font-black text-stone-900 flex items-center gap-2">
                <Hotel className="w-5 h-5 text-emerald-700" />
                <span>Homestay, Khách Sạn & Resort Xác Thực</span>
              </h2>
              <button
                onClick={() => setActiveTab("combo")}
                className="text-xs font-bold text-emerald-800 hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>Xem tất cả cơ sở lưu trú</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {accommodations.slice(0, 3).map((acc) => (
                <div key={acc.id} className="bg-white rounded-3xl overflow-hidden border border-stone-200 hover:shadow-lg transition-all flex flex-col justify-between">
                  <div>
                    <div className="relative h-44 overflow-hidden">
                      <img
                        src={acc.images?.[0] || "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"}
                        alt={acc.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-3 right-3 bg-amber-400 text-stone-950 font-black text-xs px-2.5 py-1 rounded-full shadow-md">
                        ★ {acc.rating ? acc.rating : 'Chưa có đánh giá'}
                      </span>
                      <span className="absolute bottom-3 left-3 bg-stone-900/80 text-white font-bold text-[10px] px-2.5 py-1 rounded-full backdrop-blur-xs">
                        📍 {acc.location}
                      </span>
                    </div>

                    <div className="p-4 space-y-2">
                      <h3 className="font-extrabold text-stone-900 text-base line-clamp-1">{acc.name}</h3>
                      <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">{acc.description}</p>
                      
                      <div className="flex flex-wrap gap-1 pt-1">
                        {acc.amenities?.slice(0, 3).map((am, i) => (
                          <span key={i} className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md font-medium">
                            {am}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-0 border-t border-stone-100 flex items-center justify-between mt-2">
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase font-bold block">Giá từ</span>
                      <span className="font-sans font-black text-emerald-800 text-xs sm:text-sm break-words">
                        {acc.roomTypes?.[0]?.pricePerNight ? `${acc.roomTypes[0].pricePerNight.toLocaleString('vi-VN')}đ / đêm` : 'Liên hệ để biết giá'}
                      </span>
                    </div>
                    <button
                      onClick={() => onSearchCombo(acc.id, getVietnamToday())}
                      className="px-4 py-2 bg-[#1b4332] text-white text-xs font-bold rounded-xl hover:bg-emerald-800 transition-colors cursor-pointer"
                    >
                      Xem combo xe + phòng
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 3: COMBO TIẾT KIỆM */}
        {(selectedCategory === "all" || selectedCategory === "combo") && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-2">
              <h2 className="text-base sm:text-lg font-black text-stone-900 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                <span>Gói Combo Tiết Kiệm (Xe Limousine VIP + Homestay)</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {combos.slice(0, 2).map((combo) => (
                <div key={combo.id} className="bg-gradient-to-br from-white to-emerald-50/40 rounded-3xl p-5 border border-emerald-200 hover:shadow-xl transition-all flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap justify-between items-start gap-2 min-w-0">
                      <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-full">
                        🔥 COMBO TIẾT KIỆM 20%
                      </span>
                      <div className="text-right">
                        <span className="text-xs text-stone-400 line-through font-mono block">
                          {combo.originalPrice?.toLocaleString()}đ
                        </span>
                        <span className="font-mono font-black text-emerald-900 text-lg">
                          {combo.pricePerPerson?.toLocaleString()}đ / người
                        </span>
                      </div>
                    </div>

                    <h3 className="font-extrabold text-stone-900 text-base">{combo.name}</h3>
                    <p className="text-xs text-stone-600 line-clamp-2">{combo.description}</p>

                    <div className="space-y-1 bg-white p-3 rounded-2xl border border-stone-200 text-xs">
                      {combo.highlights?.map((hl, i) => (
                        <p key={i} className="text-stone-700 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{hl}</span>
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-emerald-100 flex gap-2">
                    <button
                      onClick={() => onSearchCombo(combo.accommodationId || "all", getVietnamToday())}
                      className="flex-1 py-3 bg-[#1b4332] hover:bg-emerald-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer shadow-md text-center"
                    >
                      Đặt Combo Ngay
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 4: ẨM THỰC - ĐỊA ĐIỂM VÀ ĐẶC SẢN LÀ HAI MỤC RIÊNG */}
        {(selectedCategory === "all" || selectedCategory === "restaurant") && (
          <section className="space-y-4" id="mocchau_food_guide" aria-label="Khám phá ẩm thực Mộc Châu">
            <div className="border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-amber-700" />
                <h2 className="text-lg sm:text-xl font-black text-stone-900">Ăn gì ở Mộc Châu?</h2>
              </div>
              <p className="text-xs sm:text-sm mt-1 text-stone-600">Một bên khám phá nhà hàng, quán ăn, quán cà phê; một bên tìm hiểu những món ngon và đặc sản của cao nguyên.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(290px,0.8fr)] gap-4 sm:gap-5 items-start">
              {/* LEFT: DIRECTORY - chỉ giới thiệu, không có đặt bàn, không cam kết giảm giá */}
              <div className="bg-white border border-stone-200 rounded-2xl p-3 sm:p-5 shadow-sm space-y-4">
                <div className="flex items-start gap-2">
                  <Coffee className="w-5 h-5 shrink-0 text-emerald-700 mt-0.5" />
                  <div>
                    <h3 className="font-black text-base text-stone-900">Nhà hàng, quán ăn & quán cà phê</h3>
                    <p className="text-xs text-stone-500">Tìm địa điểm phù hợp, xem thông tin giới thiệu và khu vực.</p>
                  </div>
                </div>
                <div role="group" aria-label="Lọc loại địa điểm ăn uống" className="flex flex-wrap gap-2">
                  {[
                    {id:"all",label:"Tất cả"},
                    {id:"restaurant",label:"Nhà hàng · quán ăn"},
                    {id:"cafe",label:"Quán cà phê"},
                    {id:"grill",label:"Lẩu & nướng"},
                    {id:"snack",label:"Ăn vặt"}
                  ].map(item=><button key={item.id} type="button" aria-pressed={foodFilter===item.id} onClick={()=>setFoodFilter(item.id as typeof foodFilter)}
                    className={"rounded-full px-3 py-2 text-xs font-bold border transition-colors "+(foodFilter===item.id?"bg-emerald-700 border-emerald-700 text-white":"bg-white border-stone-200 text-stone-700 hover:bg-emerald-50")}>
                    {item.label}
                  </button>)}
                </div>
                {(() => {
                  const foodPlaces = [
                    {
                      id:"be-chao-64",category:"restaurant",label:"Nhà hàng · đặc sản",
                      name:"Nhà hàng Bê Chao 64 Mộc Châu",price:"150.000–300.000đ/người",
                      desc:"Gợi ý các món bê chao, cá suối và rau rừng trong thực đơn ẩm thực vùng cao.",
                      location:"Khu vực Chiềng Đi, Mộc Châu"
                    },
                    {
                      id:"dong-hai",category:"restaurant",label:"Nhà hàng · cơm gia đình",
                      name:"Nhà hàng Đông Hải Mộc Châu",price:"120.000–250.000đ/người",
                      desc:"Gợi ý điểm ăn cơm gia đình, đoàn khách và khám phá các món mang hương vị Tây Bắc.",
                      location:"Khu vực Trần Huy Liệu, Mộc Châu"
                    },
                    {
                      id:"moc-suong-cafe",category:"cafe",label:"Cà phê · ngắm cảnh",
                      name:"Quán Cafe View Đồi Chè Mộc Sương",price:"35.000–65.000đ/ly",
                      desc:"Gợi ý trải nghiệm thưởng trà, cà phê và ngắm cảnh đồi chè.",
                      location:"Khu vực đồi chè Tân Lập"
                    }
                  ] as const;
                  const visible = foodFilter==="all" ? foodPlaces : foodPlaces.filter(place=>place.category===foodFilter);
                  return visible.length ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {visible.map(place=><article key={place.id} className="border border-stone-200 bg-stone-50/70 rounded-2xl p-4 flex flex-col gap-2">
                        <span className="text-[10px] font-extrabold text-emerald-800 uppercase">{place.label}</span>
                        <h4 className="font-black text-sm text-stone-900">{place.name}</h4>
                        <p className="text-xs text-stone-600 leading-relaxed">{place.desc}</p>
                        <p className="mt-auto pt-2 text-xs text-emerald-900 font-bold">📍 {place.location}</p>
                        <p className="text-[11px] text-stone-600">Giá tham khảo: {place.price}</p>
                      </article>)}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-6 text-center">
                      <p className="font-bold text-sm text-stone-700">Đang cập nhật địa điểm thuộc danh mục này</p>
                      <p className="text-xs text-stone-500 mt-1">Danh sách sẽ được bổ sung khi có thông tin phù hợp.</p>
                    </div>
                  );
                })()}
                <p className="text-[11px] text-stone-500 leading-relaxed border-t border-stone-100 pt-3">
                  Thông tin địa điểm và mức giá chỉ mang tính gợi ý, có thể thay đổi. Mộc Châu Travel không nhận đặt bàn hoặc cam kết giảm giá tại các cơ sở này.
                </p>
              </div>

              {/* RIGHT: CUISINE GUIDE - không gắn món ăn với một nhà hàng cụ thể */}
              <div className="bg-gradient-to-b from-amber-50 to-white border border-amber-200 rounded-2xl p-3 sm:p-5 shadow-sm space-y-4">
                <div className="flex items-start gap-2">
                  <BookOpen className="w-5 h-5 shrink-0 text-amber-700 mt-0.5"/>
                  <div>
                    <h3 className="font-black text-base text-stone-900">Món ngon & đặc sản Mộc Châu</h3>
                    <p className="text-xs text-stone-600">Gợi ý tìm hiểu văn hóa ẩm thực địa phương.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                  {[
                    {name:"Bê chao Mộc Châu",tag:"Món mặn",detail:"Thịt bê non được tẩm ướp, chao nhanh trong dầu nóng; thường dùng nóng cùng rau thơm và gia vị."},
                    {name:"Cá suối Mộc Châu",tag:"Đặc sản vùng núi",detail:"Cá suối nhỏ thường được chiên giòn hoặc nướng, ăn cùng rau và các loại gia vị địa phương."},
                    {name:"Thịt trâu gác bếp",tag:"Món khô",detail:"Thịt trâu tẩm gia vị Tây Bắc, hun khói và sấy khô; hương vị đậm, thích hợp mua làm quà."},
                    {name:"Xôi ngũ sắc",tag:"Ẩm thực truyền thống",detail:"Xôi nếp nhiều màu, gắn với văn hóa ẩm thực của các cộng đồng dân tộc vùng Tây Bắc."},
                    {name:"Sữa và sữa chua Mộc Châu",tag:"Đặc sản cao nguyên",detail:"Các sản phẩm chế biến từ sữa bò, đặc trưng của vùng cao nguyên có nghề chăn nuôi bò sữa."},
                    {name:"Chè Mộc Châu",tag:"Đồ uống & quà",detail:"Trà làm từ vùng nguyên liệu chè Mộc Châu; có thể trải nghiệm thưởng trà hoặc mua về làm quà."}
                  ].map(dish=><article key={dish.name} className="rounded-xl border border-amber-100 bg-white p-3">
                    <div className="flex gap-2 items-start">
                      <Flame className="w-4 h-4 text-amber-600 shrink-0 mt-0.5"/>
                      <div>
                        <span className="block text-[10px] font-extrabold text-amber-700 uppercase">{dish.tag}</span>
                        <h4 className="font-black text-sm text-stone-900 mt-0.5">{dish.name}</h4>
                        <p className="text-xs text-stone-600 leading-relaxed mt-1">{dish.detail}</p>
                      </div>
                    </div>
                  </article>)}
                </div>
              </div>
            </div>
          </section>
        )}


        {/* SECTION 5: GIÁ VÉ THAM QUAN, CHỈ ĐỂ THAM KHẢO - KHÔNG BÁN VÉ */}
        {(selectedCategory === "all" || selectedCategory === "tour") && (
          <section className="space-y-4 scroll-mt-24" id="mocchau_attraction_ticket_prices" aria-label="Bảng giá vé tham quan Mộc Châu">
            <div className="flex items-start justify-between flex-wrap gap-2 border-b border-stone-200 pb-3">
              <div>
                <h2 className="font-black text-lg sm:text-xl text-[#1b4332] flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-700" />
                  Bảng giá vé các điểm tham quan Mộc Châu
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 mt-1">
                  So sánh giá vé theo địa điểm để dự trù chi phí trước chuyến đi.
                </p>
              </div>
              <span className="border border-amber-200 rounded-full bg-amber-50 text-amber-900 text-xs font-bold px-3 py-1.5">Giá tham khảo, không bán vé</span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
              <div className="hidden sm:grid grid-cols-[minmax(0,1.25fr)_minmax(145px,0.7fr)_minmax(165px,0.8fr)_minmax(0,1.7fr)] gap-3 bg-[#1b4332] text-white px-4 py-3 text-xs font-black">
                <span>Địa điểm</span><span>Vé người lớn</span><span>Vé trẻ em</span><span>Ghi chú và nguồn giá</span>
              </div>
              <div className="divide-y divide-stone-100">
                {(siteContent.attractionTickets||[]).filter(t=>t.visible).map(ticket=>(
                  <article className="p-4 sm:grid sm:grid-cols-[minmax(0,1.25fr)_minmax(145px,0.7fr)_minmax(165px,0.8fr)_minmax(0,1.7fr)] sm:gap-3 text-left" key={ticket.id}>
                    <h3 className="font-black text-sm text-stone-900">{ticket.name}</h3>
                    <div className="mt-2 sm:mt-0">
                      <span className="text-[10px] text-stone-400 sm:hidden block">Người lớn</span>
                      <p className="font-extrabold text-sm text-emerald-800">{ticket.adultPrice || 'Đang cập nhật'}</p>
                    </div>
                    <div className="mt-2 sm:mt-0">
                      <span className="text-[10px] text-stone-400 sm:hidden block">Trẻ em</span>
                      <p className="text-xs font-semibold text-stone-700">{ticket.childPrice || 'Theo chính sách tại điểm'}</p>
                    </div>
                    <div className="mt-2 sm:mt-0">
                      <p className="text-xs text-stone-600 leading-relaxed">{ticket.note}</p>
                      {ticket.sourceUrl && <a href={ticket.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-emerald-800 underline underline-offset-2">
                        Kiểm tra nguồn giá <ArrowRight className="w-3 h-3" />
                      </a>}
                    </div>
                  </article>
                ))}
                {!(siteContent.attractionTickets||[]).some(t=>t.visible) && (
                  <p className="p-6 text-center text-sm text-stone-600">Bảng giá đang được cập nhật từ các điểm tham quan.</p>
                )}
              </div>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed bg-amber-50 border border-amber-100 p-3 rounded-xl">
              Giá có thể thay đổi theo ngày thường, cuối tuần, ngày lễ, chiều cao và chương trình của khu du lịch.
              Mộc Châu Travel chỉ tổng hợp thông tin để tham khảo, không thu tiền hay nhận đặt vé tham quan trực tuyến.
              Trước khi đi, vui lòng kiểm tra nguồn giá của từng địa điểm.
            </p>
          </section>
        )}

      </div>

      {/* QUICK TAXI BOOKING MODAL */}
      {isTaxiModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[120] text-left">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90dvh] overflow-y-auto shadow-2xl border border-stone-200 animate-scale-up">
            <div className="bg-[#1b4332] text-white p-5 relative">
              <button
                onClick={() => setIsTaxiModalOpen(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
              <span className="text-[10px] bg-emerald-400 text-stone-950 font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                🚕 TAXI & XE DU LỊCH MỘC CHÂU
              </span>
              <h3 className="text-lg font-black tracking-tight mt-1 text-white">
                Đặt xe đưa đón Mộc Châu
              </h3>
              <p className="text-emerald-100 text-xs mt-0.5">
                Gửi yêu cầu để nhận tư vấn và báo giá. Chỉ xác nhận sau khi điều hành liên hệ.
              </p>
            </div>

            {taxiSubmitted ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                  ✓
                </div>
                <h4 className="text-base font-extrabold text-stone-900">Đã tiếp nhận yêu cầu taxi</h4>
                <p className="text-xs text-stone-500">
                  Mã yêu cầu: {taxiRequestId.slice(0, 12)}. Admin sẽ liên hệ báo giá và xác nhận; đây chưa phải chuyến xe đã được xác nhận.
                </p>
              </div>
            ) : (
              <form onSubmit={handleBookTaxiSubmit} className="p-5 space-y-3 text-xs">
                {taxiError && <p role="alert" className="bg-red-50 text-red-800 border border-red-200 rounded-xl p-3">{taxiError}</p>}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Số chỗ xe chọn</label>
                    <select aria-label="Loại xe taxi" value={taxiSeats} onChange={e=>setTaxiSeats(Number(e.target.value) as 4|7|9|16)} className="w-full p-2.5 border border-stone-200 rounded-xl bg-white font-bold text-sm">
                      {[4,7,9,16].map(n=><option value={n} key={n}>{n} chỗ</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Số điện thoại (*)</label>
                    <input
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      required
                      value={taxiPhone}
                      onChange={(e) => setTaxiPhone(e.target.value)}
                      placeholder="0971..."
                      className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Họ và tên (*)</label>
                  <input
                    type="text"
                    required
                    value={taxiName}
                    onChange={(e) => setTaxiName(e.target.value)}
                    placeholder="Nhập tên của bạn..."
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Điểm đón cụ thể</label>
                    <input
                      type="text"
                      value={taxiPickup}
                      onChange={(e) => setTaxiPickup(e.target.value)}
                      placeholder="Tên khách sạn/Homestay"
                      className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Điểm trả/đến</label>
                    <input
                      type="text"
                      value={taxiDropoff}
                      onChange={(e) => setTaxiDropoff(e.target.value)}
                      placeholder="Cầu kính / Đồi chè"
                      className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Ngày đi</label>
                    <input
                      type="date"
                      value={taxiDate}
                      onChange={(e) => setTaxiDate(e.target.value)}
                      className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Giờ đi đón</label>
                    <input
                      type="time"
                      value={taxiTime}
                      onChange={(e) => setTaxiTime(e.target.value)}
                      className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Ghi chú thêm</label>
                  <input
                    type="text"
                    value={taxiNotes}
                    onChange={(e) => setTaxiNotes(e.target.value)}
                    placeholder="Ví dụ: Khách 5 người có mang nhiều hành lý..."
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="submit" disabled={taxiSaving}
                    className="flex-1 py-3 bg-[#1b4332] hover:bg-emerald-800 text-white rounded-xl font-black text-xs uppercase tracking-wider cursor-pointer shadow-md"
                  >
                    {taxiSaving ? "Đang gửi yêu cầu..." : "Gửi yêu cầu báo giá"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsTaxiModalOpen(false)}
                    className="px-4 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold text-xs cursor-pointer"
                  >
                    Đóng
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
