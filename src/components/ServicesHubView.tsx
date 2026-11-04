import React, { useState } from "react";
import {submitServiceInquiry} from "../lib/serviceRequests";
import { 
  Bus, Car, Bike, Hotel, Star, DollarSign, Sparkles, MapPin, Phone, 
  Search, CheckCircle2, ChevronRight, ShieldCheck, Clock, CalendarDays, 
  MessageSquare, User, Filter, ArrowRight, Award, Tag, Heart
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
  const [selectedCategory, setSelectedCategory] = useState<"all" | "transport" | "motorbike" | "accommodation" | "combo" | "restaurant" | "tour">("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Quick Taxi Booking Modal State
  const [isTaxiModalOpen, setIsTaxiModalOpen] = useState(false);
  const [taxiSeats, setTaxiSeats] = useState<4 | 7 | 9 | 16>(7);
  const [taxiPickup, setTaxiPickup] = useState("Khách sạn / Homestay Mộc Châu");
  const [taxiDropoff, setTaxiDropoff] = useState("Điểm tham quan Mộc Châu");
  const [taxiDate, setTaxiDate] = useState(() => new Date().toISOString().substring(0, 10));
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
    <div className="min-h-screen bg-[#f7faf7] pb-20 font-sans" id="services_hub_root">
      {/* Hero Header Banner */}
      <div className="bg-gradient-to-br from-[#1b4332] via-emerald-700 to-emerald-600 text-white pt-8 pb-10 px-4 sm:px-6 lg:px-8 shadow-lg relative overflow-hidden rounded-b-[2rem]">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/20 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <span className="inline-flex items-center space-x-2 bg-white/20 border border-white/30 px-3 py-1 rounded-full text-[11px] font-extrabold text-white uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-yellow-100" />
            <span>Mộc Châu Travel Của Bạn</span>
          </span>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white mb-2">
            Khám Phá Mộc Châu
          </h1>
          <p className="text-emerald-50 text-xs sm:text-sm max-w-2xl mx-auto font-sans leading-relaxed">
            Đặt xe, thuê xe máy và tìm Homestay êm ái, xinh xắn nhất.
          </p>

          {/* Quick Search bar */}
          <div className="mt-5 max-w-md mx-auto relative">
            <Search className="w-4 h-4 text-emerald-600 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Bạn muốn đi đâu hôm nay?..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white text-stone-900 rounded-3xl text-sm font-bold shadow-md focus:outline-none focus:ring-4 focus:ring-emerald-200 placeholder:text-stone-400"
            />
          </div>
        </div>
      </div>

      {/* Category Filter Chips Bar */}
      <div className="sticky top-14 sm:top-16 z-30 bg-white border-b border-stone-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5">
          <div className="flex space-x-2 overflow-x-auto custom-tab-scrollbar pb-1.5 pt-0.5">
            {[
              { id: "all", label: "Tất Cả Dịch Vụ", icon: Sparkles },
              { id: "transport", label: "Xe Limousine & Taxi", icon: Bus },
              { id: "motorbike", label: "Thuê Xe Máy", icon: Bike },
              { id: "accommodation", label: "Lưu Trú & Homestay", icon: Hotel },
              { id: "combo", label: "Combo Xe + Phòng", icon: Star },
              { id: "restaurant", label: "Nhà Hàng & Đặc Sản", icon: DollarSign },
              { id: "tour", label: "Tour & Vé Tham Quan", icon: MapPin }
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
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-6 space-y-8 text-left">
        
        {/* SECTION 1: XE DI CHUYỂN & TAXI (LIMOUSINE, TAXI 4-16 CHỖ, THUÊ XE MÁY) */}
        {(selectedCategory === "all" || selectedCategory === "transport" || selectedCategory === "motorbike") && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
                <Bus className="w-5 h-5 text-emerald-700" />
                <span>Dịch Vụ Vận Tải & Di Chuyển Mộc Châu</span>
              </h2>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                Phục vụ 24/7
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: QT Limousine VIP 9 chỗ */}
              {(selectedCategory === "all" || selectedCategory === "transport") && (
                <div className="bg-white rounded-3xl p-5 border border-stone-200 hover:border-emerald-500 hover:shadow-lg transition-all flex flex-col justify-between group">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-black uppercase text-amber-900 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-300">
                        ⭐ XE ĐÓN TRẢ TẬN NƠI VIP
                      </span>
                      <span className="font-mono font-black text-emerald-800 text-sm">300.000đ / ghế</span>
                    </div>

                    <h3 className="font-black text-stone-900 text-base group-hover:text-emerald-800 transition-colors">
                      Xe QT Limousine 9 Chỗ VIP (DCar)
                    </h3>

                    <p className="text-xs text-stone-600 font-sans leading-relaxed">
                      Chạy liên tục từ 06h30 đến 18h30 hàng ngày hai chiều Hà Nội ⇌ Mộc Châu. Ghế massage êm ái, wifi miễn phí, nước uống & cổng sạc điện thoại.
                    </p>

                    <div className="bg-emerald-50/80 p-3 rounded-2xl border border-emerald-100 text-[11px] text-emerald-950 space-y-1">
                      <p>✓ Khung giờ: 06:30, 07:30, 08:30, 09:30, 11:30, 13:30, 15:30, 17:30, 18:30</p>
                      <p>✓ Đón tận nơi phố cổ, Mỹ Đình, BigC Thăng Long & Homestay Mộc Châu</p>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-stone-100 flex gap-2">
                    <button
                      onClick={() => onSearchLimousine("Hà Nội", "Mộc Châu", new Date().toISOString().split("T")[0], "06:30")}
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
                <div className="bg-white rounded-3xl p-5 border border-stone-200 hover:border-emerald-500 hover:shadow-lg transition-all flex flex-col justify-between group">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-black uppercase text-teal-900 bg-teal-100 px-2.5 py-1 rounded-full border border-teal-300">
                        🚕 TAXI & XE HỢP ĐỒNG
                      </span>
                      <span className="font-mono font-black text-emerald-800 text-sm">Từ 200.000đ / chuyến</span>
                    </div>

                    <h3 className="font-black text-stone-900 text-base group-hover:text-emerald-800 transition-colors">
                      Taxi & Xe Du Lịch 4 - 7 - 16 Chỗ
                    </h3>

                    <p className="text-xs text-stone-600 font-sans leading-relaxed">
                      Phục vụ tham quan đồi chè, hái mận Nà Ka, Cầu kính Bạch Long, Thác Dải Yếm và xe riêng đưa đón sân bay Nội Bài / Hà Nội về Mộc Châu.
                    </p>

                    <div className="bg-teal-50/80 p-3 rounded-2xl border border-teal-100 text-[11px] text-teal-950 space-y-1">
                      <p>✓ Xe 4 chỗ Vios/City: 200.000đ / chuyến nội thành</p>
                      <p>✓ Xe 7 chỗ Innova/Fortuner: 350.000đ / chuyến tham quan</p>
                      <p>✓ Xe 16 chỗ Solati/Ford Transit: Trọn gói tour 1.800.000đ</p>
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
                <div className="bg-white rounded-3xl p-5 border border-stone-200 hover:border-emerald-500 hover:shadow-lg transition-all flex flex-col justify-between group">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-black uppercase text-indigo-900 bg-indigo-100 px-2.5 py-1 rounded-full border border-indigo-300">
                        🛵 GIAO XE TẬN NƠI FREE
                      </span>
                      <span className="font-mono font-black text-emerald-800 text-sm">150.000đ - 200.000đ / ngày</span>
                    </div>

                    <h3 className="font-black text-stone-900 text-base group-hover:text-emerald-800 transition-colors">
                      Thuê Xe Máy Chinh Phục Mộc Châu
                    </h3>

                    <p className="text-xs text-stone-600 font-sans leading-relaxed">
                      Xe Wave Alpha, RSX dẻo dai leo dốc khỏe & Xe Vision, Air Blade êm ái. Giao và nhận xe máy miễn phí tại Homestay, Khách sạn hoặc Bến xe.
                    </p>

                    <div className="bg-indigo-50/80 p-3 rounded-2xl border border-indigo-100 text-[11px] text-indigo-950 space-y-1">
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
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
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
                        ★ {acc.rating || 4.9}
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
                      <span className="font-mono font-black text-emerald-800 text-sm">
                        {acc.roomTypes?.[0]?.pricePerNight?.toLocaleString() || "600.000"}đ / đêm
                      </span>
                    </div>
                    <button
                      onClick={() => onSearchCombo(acc.id, new Date().toISOString().split("T")[0])}
                      className="px-4 py-2 bg-[#1b4332] text-white text-xs font-bold rounded-xl hover:bg-emerald-800 transition-colors cursor-pointer"
                    >
                      Đặt Kèm Xe (-20%)
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
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                <span>Gói Combo Tiết Kiệm (Xe Limousine VIP + Homestay)</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {combos.slice(0, 2).map((combo) => (
                <div key={combo.id} className="bg-gradient-to-br from-white to-emerald-50/40 rounded-3xl p-5 border border-emerald-200 hover:shadow-xl transition-all flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
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
                      onClick={() => onSearchCombo(combo.accommodationId || "all", new Date().toISOString().split("T")[0])}
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

        {/* SECTION 4: NHÀ HÀNG & ẨM THỰC */}
        {(selectedCategory === "all" || selectedCategory === "restaurant") && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-600" />
                <span>Nhà Hàng & Ẩm Thực Đặc Sản Mộc Châu</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  name: "Nhà hàng Bê Chao 64 Mộc Châu",
                  type: "Đặc sản Tây Bắc",
                  price: "150.000đ - 300.000đ / người",
                  desc: "Món bê chao mềm thơm ngậy, cá suối chiên giòn, lẩu nấm và rau rừng tươi sạch.",
                  location: "Tiểu khu Chiềng Đi, Mộc Châu"
                },
                {
                  name: "Nhà hàng Đông Hải Mộc Châu",
                  type: "Cơm đoàn & Gia đình",
                  price: "120.000đ - 250.000đ / người",
                  desc: "Gà đồi nướng mắc khén, xôi ngũ sắc, trâu gác bếp và lợn mán nướng than hoa.",
                  location: "Trần Huy Liệu, TT. Mộc Châu"
                },
                {
                  name: "Quán Cafe View Đồi Chè Mộc Sương",
                  type: "Cà phê & Check-in",
                  price: "35.000đ - 65.000đ / ly",
                  desc: "Thưởng thức chè ô long thơm ngát, sinh tố mận tươi và ngắm bình minh trên đồi chè.",
                  location: "Thung lũng đồi chè Tân Lập"
                }
              ].map((res, i) => (
                <div key={i} className="bg-white rounded-3xl p-5 border border-stone-200 hover:border-emerald-500 hover:shadow-lg transition-all flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md">
                      {res.type}
                    </span>
                    <h3 className="font-extrabold text-stone-900 text-sm mt-1">{res.name}</h3>
                    <p className="text-xs text-stone-500 line-clamp-2">{res.desc}</p>
                    <p className="text-[11px] text-emerald-800 font-bold">💰 {res.price}</p>
                    <p className="text-[10px] text-stone-400">📍 {res.location}</p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-stone-100">
                    <a
                      href="tel:0971050324"
                      className="block w-full py-2 bg-stone-100 hover:bg-emerald-50 text-stone-800 hover:text-emerald-800 rounded-xl text-xs font-bold text-center transition-colors"
                    >
                      Gọi Đặt Bàn Giảm 10%
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
