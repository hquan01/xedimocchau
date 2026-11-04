import React, { useState } from "react";
import { Compass, CalendarDays, Users, Sparkles, MapPin, Ticket, Hotel, Calculator, Bus, CheckCircle2, ArrowRight, Plus, Minus, DollarSign } from "lucide-react";
import { TourCombo, Accommodation, Destination } from "../types";

interface TripPrepViewProps {
  setActiveTab: (tab: string) => void;
  accommodations: Accommodation[];
  destinations: Destination[];
  combos: TourCombo[];
  onSearchLimousine: (from: string, to: string, date: string, time?: string) => void;
  onSearchCombo: (hotelId: string, date: string, from?: string, to?: string, time?: string) => void;
}

export default function TripPrepView({
  setActiveTab,
  accommodations,
  destinations,
  combos,
  onSearchLimousine,
  onSearchCombo
}: TripPrepViewProps) {
  const [departure, setDeparture] = useState("Hà Nội");
  const [showDepartureSuggestions, setShowDepartureSuggestions] = useState(false);
  const [travelDate, setTravelDate] = useState(new Date().toISOString().split('T')[0]);
  const [partyCount, setPartyCount] = useState<number>(3);
  const [duration, setDuration] = useState("3 ngày 2 đêm");
  
  const [budgetType, setBudgetType] = useState<"per_person" | "total" | "unknown">("total");
  const [budgetAmount, setBudgetAmount] = useState<number | "">(4200000);
  
  const [style, setStyle] = useState("Khám phá thiên nhiên & Săn mây");
  const [accommodationNeed, setAccommodationNeed] = useState("Homestay view đồi chè");
  const [transportNeed, setTransportNeed] = useState("Xe QT Limousine VIP đón trả tận nơi");

  const [activeTool, setActiveTool] = useState<"overview" | "itinerary" | "calculator" | "accommodations" | "attractions">("overview");
  const [calculatedCost, setCalculatedCost] = useState<{ transport: number; stay: number; food: number; total: number } | null>(null);

  const SUGGESTED_PROVINCES = [
    "Hà Nội", "Thanh Hóa", "Nghệ An", "Hồ Chí Minh (TP.HCM)", "Hải Phòng", 
    "Quảng Ninh", "Bắc Ninh", "Đà Nẵng", "Ninh Bình", "Hà Nam", "Nam Định", "Phú Thọ"
  ];

  const filteredProvinces = SUGGESTED_PROVINCES.filter(p => 
    p.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(
      departure.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    )
  );

  const numericBudget = typeof budgetAmount === "number" ? budgetAmount : 0;
  const calculatedTotal = budgetType === "per_person" ? numericBudget * partyCount : numericBudget;
  const calculatedPerPerson = budgetType === "total" ? Math.round(numericBudget / Math.max(1, partyCount)) : numericBudget;

  const handleCalculateCost = () => {
    const transportPerPerson = 600000; // Khứ hồi Limousine
    const stayPerNight = accommodationNeed.includes("Resort") ? 1200000 : 500000;
    const nights = duration.includes("3 ngày") ? 2 : 1;
    const foodPerDay = 350000;

    const transport = transportPerPerson * partyCount;
    const stay = stayPerNight * nights;
    const food = foodPerDay * nights * partyCount;
    const total = transport + stay + food;

    setCalculatedCost({ transport, stay, food, total });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans">
      {/* Breadcrumb & Header */}
      <div className="flex items-center space-x-2 text-xs text-stone-500 mb-6">
        <button onClick={() => { setActiveTab("explore"); window.scrollTo({top: 0, behavior: "smooth"}); }} className="hover:text-emerald-700">Trang chủ</button>
        <span>/</span>
        <span className="text-emerald-800 font-bold">Chuẩn bị chuyến đi Mộc Châu</span>
      </div>

      <div className="bg-gradient-to-r from-[#1b4332] to-emerald-900 rounded-3xl p-6 sm:p-10 text-white shadow-2xl relative overflow-hidden mb-8">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800/80 border border-emerald-400/30 text-emerald-300 text-xs font-extrabold uppercase tracking-widest mb-4">
            🎒 Cổng Chuẩn Bị Thông Minh
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
            Lên Kế Hoạch Chuyến Đi Mộc Châu Hoàn Hảo
          </h1>
          <p className="text-stone-200 text-sm sm:text-base leading-relaxed">
            Điền thông tin hành trình của bạn để hệ thống tự động đồng bộ sang công cụ lập lịch trình AI, dự toán chi phí, tìm homestay và đặt xe QT Limousine chính xác 100%.
          </p>
        </div>
      </div>

      {/* Main Form & Tools Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Trip Parameters Form */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-stone-200 space-y-5 text-left">
          <h2 className="font-extrabold text-stone-900 text-lg flex items-center gap-2">
            ⚙️ Thông tin hành trình
          </h2>

          {/* 1. Departure */}
          <div className="relative">
            <label className="block text-xs font-bold text-stone-700 uppercase mb-1.5 flex items-center justify-between">
              <span>Điểm xuất phát</span>
              <span className="text-[10px] text-emerald-700 font-medium">Nhập tự do bất kỳ</span>
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-emerald-600 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={departure}
                onChange={(e) => {
                  setDeparture(e.target.value);
                  setShowDepartureSuggestions(true);
                }}
                onFocus={() => setShowDepartureSuggestions(true)}
                placeholder="Nhập Thanh Hóa, TP.HCM, Hà Nội, Nghệ An..."
                className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-semibold text-stone-800 focus:outline-none focus:border-emerald-600 focus:bg-white"
              />
            </div>
            {showDepartureSuggestions && (
              <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-stone-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                <div className="p-2 text-[10px] font-bold text-stone-400 uppercase tracking-wider bg-stone-50 border-b border-stone-100">
                  Gợi ý điểm xuất phát
                </div>
                {filteredProvinces.map((prov, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setDeparture(prov);
                      setShowDepartureSuggestions(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-stone-700 hover:bg-emerald-50 hover:text-emerald-900 transition-colors flex items-center space-x-2"
                  >
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    <span>{prov}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2. Travel Date */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase mb-1.5">Ngày khởi hành dự kiến</label>
            <input
              type="date"
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-semibold text-stone-800 focus:outline-none focus:border-emerald-600"
            />
          </div>

          {/* 3. Guest Counter & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1.5">Số lượng khách</label>
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => setPartyCount(prev => Math.max(1, prev - 1))}
                  className="w-10 h-10 bg-stone-100 hover:bg-emerald-100 text-stone-800 rounded-xl flex items-center justify-center font-bold transition-colors border border-stone-200 cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={partyCount}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val > 0) setPartyCount(val);
                  }}
                  className="w-full text-center py-2 border border-stone-200 rounded-xl text-sm font-bold bg-stone-50 text-stone-900 focus:outline-none focus:border-emerald-600"
                />
                <button
                  type="button"
                  onClick={() => setPartyCount(prev => prev + 1)}
                  className="w-10 h-10 bg-stone-100 hover:bg-emerald-100 text-stone-800 rounded-xl flex items-center justify-center font-bold transition-colors border border-stone-200 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1.5">Thời gian</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-semibold text-stone-800 focus:outline-none focus:border-emerald-600 cursor-pointer"
              >
                <option value="1 ngày khứ hồi">1 ngày khứ hồi</option>
                <option value="2 ngày 1 đêm">2 ngày 1 đêm</option>
                <option value="3 ngày 2 đêm">3 ngày 2 đêm</option>
                <option value="4 ngày 3 đêm">4 ngày 3 đêm</option>
              </select>
            </div>
          </div>

          {/* 4. Custom VNĐ Budget */}
          <div className="space-y-2 bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
            <label className="block text-xs font-bold text-stone-700 uppercase">Ngân sách dự kiến (VNĐ)</label>
            <div className="grid grid-cols-3 gap-1 text-[11px]">
              <button
                type="button"
                onClick={() => setBudgetType("per_person")}
                className={`py-1.5 px-2 rounded-lg font-bold border transition-all cursor-pointer ${
                  budgetType === "per_person"
                    ? "bg-[#1b4332] text-white border-[#1b4332]"
                    : "bg-white text-stone-700 border-stone-200 hover:bg-stone-100"
                }`}
              >
                Mỗi người
              </button>
              <button
                type="button"
                onClick={() => setBudgetType("total")}
                className={`py-1.5 px-2 rounded-lg font-bold border transition-all cursor-pointer ${
                  budgetType === "total"
                    ? "bg-[#1b4332] text-white border-[#1b4332]"
                    : "bg-white text-stone-700 border-stone-200 hover:bg-stone-100"
                }`}
              >
                Tổng đoàn
              </button>
              <button
                type="button"
                onClick={() => setBudgetType("unknown")}
                className={`py-1.5 px-2 rounded-lg font-bold border transition-all cursor-pointer ${
                  budgetType === "unknown"
                    ? "bg-amber-600 text-white border-amber-600"
                    : "bg-white text-stone-700 border-stone-200 hover:bg-stone-100"
                }`}
              >
                Chưa biết
              </button>
            </div>

            {budgetType !== "unknown" && (
              <div className="space-y-1 pt-1">
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-emerald-600 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="number"
                    step="50000"
                    value={budgetAmount}
                    onChange={(e) => {
                      const val = e.target.value === "" ? "" : Number(e.target.value);
                      setBudgetAmount(val);
                    }}
                    placeholder="Nhập số tiền VNĐ..."
                    className="w-full pl-9 pr-12 py-2 border border-stone-200 rounded-xl text-xs font-bold bg-white text-stone-900 focus:outline-none focus:border-emerald-600"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-stone-400 font-semibold">VNĐ</span>
                </div>
                <div className="text-[11px] text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex justify-between font-medium">
                  <span>Quy đổi:</span>
                  <span className="font-bold text-[#1b4332]">
                    {budgetType === "per_person"
                      ? `Tổng: ${calculatedTotal.toLocaleString("vi-VN")} đ`
                      : `~${calculatedPerPerson.toLocaleString("vi-VN")} đ/người`}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase mb-1.5">Phong cách chuyến đi</label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-semibold text-stone-800 focus:outline-none focus:border-emerald-600"
            >
              <option value="Khám phá thiên nhiên & Săn mây">Khám phá thiên nhiên & Săn mây</option>
              <option value="Nghỉ dưỡng & Chữa lành (Wellness)">Nghỉ dưỡng & Chữa lành</option>
              <option value="Check-in sống ảo & Mùa hoa">Check-in sống ảo & Mùa hoa</option>
              <option value="Ẩm thực & Trải nghiệm bản làng">Ẩm thực & Trải nghiệm bản làng</option>
            </select>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                onSearchLimousine(departure, "Mộc Châu", travelDate, "06:30");
              }}
              className="w-full py-4 bg-[#1b4332] hover:bg-emerald-800 text-white rounded-2xl font-black text-sm tracking-wide shadow-lg flex items-center justify-center space-x-2 transition-colors cursor-pointer"
            >
              <Bus className="w-5 h-5 text-amber-300" />
              <span>Đặt Xe QT Limousine Phù Hợp Ngay</span>
            </button>
          </div>
        </div>

        {/* Right Column: Interactive Tools Hub */}
        <div className="lg:col-span-2 space-y-6">
          {/* Navigation Tool Tabs */}
          <div className="flex flex-wrap gap-2 bg-stone-100 p-2 rounded-2xl border border-stone-200">
            <button
              onClick={() => setActiveTool("overview")}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${activeTool === "overview" ? "bg-[#1b4332] text-white shadow-md" : "text-stone-600 hover:bg-stone-200"}`}
            >
              📋 Tổng quan kế hoạch
            </button>
            <button
              onClick={() => { setActiveTab("ai"); }}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer text-stone-600 hover:bg-stone-200 flex items-center gap-1`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>1. AI Lập Lịch Trình</span>
            </button>
            <button
              onClick={() => { setActiveTool("calculator"); handleCalculateCost(); }}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${activeTool === "calculator" ? "bg-[#1b4332] text-white shadow-md" : "text-stone-600 hover:bg-stone-200"}`}
            >
              💰 2. Tính Chi Phí
            </button>
            <button
              onClick={() => setActiveTool("accommodations")}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${activeTool === "accommodations" ? "bg-[#1b4332] text-white shadow-md" : "text-stone-600 hover:bg-stone-200"}`}
            >
              🏨 3. Tìm Homestay
            </button>
            <button
              onClick={() => setActiveTool("attractions")}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${activeTool === "attractions" ? "bg-[#1b4332] text-white shadow-md" : "text-stone-600 hover:bg-stone-200"}`}
            >
              📍 4. Điểm Tham Quan
            </button>
          </div>

          {/* Active Tool Content */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-stone-200 min-h-[420px]">
            {activeTool === "overview" && (
              <div className="space-y-6">
                <div className="border-b border-stone-200 pb-4">
                  <h3 className="text-lg font-black text-stone-900">✨ Tóm tắt cấu hình chuyến đi của bạn</h3>
                  <p className="text-xs text-stone-500 mt-1">Hệ thống đã lưu thông tin và sẵn sàng hỗ trợ các bước tiếp theo.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl">
                    <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block mb-1">Hành trình</span>
                    <span className="text-sm font-extrabold text-stone-900">{departure} ➔ Mộc Châu ({travelDate})</span>
                  </div>
                  <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-2xl">
                    <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider block mb-1">Quy mô đoàn</span>
                    <span className="text-sm font-extrabold text-stone-900">{partyCount} khách • {duration}</span>
                  </div>
                  <div className="bg-teal-50/70 border border-teal-200 p-4 rounded-2xl">
                    <span className="text-[10px] font-extrabold text-teal-800 uppercase tracking-wider block mb-1">Phong cách & Ngân sách</span>
                    <span className="text-sm font-extrabold text-stone-900">{style}</span>
                    <span className="text-xs text-stone-600 block mt-0.5">
                      {budgetType === 'unknown' ? 'Chưa xác định ngân sách' : `${calculatedTotal.toLocaleString("vi-VN")} đ (${budgetType === 'total' ? 'Tổng đoàn' : 'Mỗi người'})`}
                    </span>
                  </div>
                  <div className="bg-indigo-50/70 border border-indigo-200 p-4 rounded-2xl">
                    <span className="text-[10px] font-extrabold text-indigo-800 uppercase tracking-wider block mb-1">Dịch vụ đề xuất</span>
                    <span className="text-sm font-extrabold text-stone-900">QT Limousine VIP 9 chỗ đón tận nơi</span>
                  </div>
                </div>

                <div className="pt-4 flex flex-wrap gap-3">
                  <button
                    onClick={() => setActiveTab("ai")}
                    className="px-6 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Mở AI Tạo Lịch Trình Chi Tiết</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setActiveTool("calculator"); handleCalculateCost(); }}
                    className="px-6 py-3.5 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer transition-colors"
                  >
                    <Calculator className="w-4 h-4 text-emerald-400" />
                    <span>Xem Dự Toán Chi Phí Chi Tiết</span>
                  </button>
                </div>
              </div>
            )}

            {activeTool === "calculator" && (
              <div className="space-y-6">
                <div className="border-b border-stone-200 pb-4">
                  <h3 className="text-lg font-black text-stone-900">💰 Bảng dự toán chi phí du lịch Mộc Châu</h3>
                  <p className="text-xs text-stone-500 mt-1">Tính toán dựa trên số lượng khách ({partyCount} người) và thời gian ({duration}).</p>
                </div>

                {calculatedCost ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
                        <span className="text-xs text-stone-500 font-bold uppercase block">Di chuyển (Limousine)</span>
                        <span className="text-lg font-black text-emerald-800 font-mono mt-1 block">
                          {calculatedCost.transport.toLocaleString()} đ
                        </span>
                      </div>
                      <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
                        <span className="text-xs text-stone-500 font-bold uppercase block">Lưu trú (Homestay)</span>
                        <span className="text-lg font-black text-amber-700 font-mono mt-1 block">
                          {calculatedCost.stay.toLocaleString()} đ
                        </span>
                      </div>
                      <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
                        <span className="text-xs text-stone-500 font-bold uppercase block">Ẩm thực & Tham quan</span>
                        <span className="text-lg font-black text-indigo-700 font-mono mt-1 block">
                          {calculatedCost.food.toLocaleString()} đ
                        </span>
                      </div>
                    </div>

                    <div className="bg-emerald-900 text-white p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                      <div>
                        <span className="text-xs uppercase tracking-wider text-emerald-300 font-bold">Tổng chi phí dự kiến cho đoàn</span>
                        <div className="text-2xl sm:text-3xl font-black font-mono text-amber-300 mt-1">
                          {calculatedCost.total.toLocaleString()} VNĐ
                        </div>
                        <p className="text-[11px] text-stone-200 mt-1">Đã bao gồm xe Limousine khứ hồi và phòng nghỉ tiêu chuẩn.</p>
                      </div>
                      <button
                        onClick={() => setActiveTab("combo")}
                        className="px-6 py-3.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-black rounded-2xl text-xs tracking-wide shadow-md transition-colors cursor-pointer shrink-0"
                      >
                        Đặt Combo Tiết Kiệm 20% Ngay
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {activeTool === "accommodations" && (
              <div className="space-y-6">
                <div className="border-b border-stone-200 pb-4">
                  <h3 className="text-lg font-black text-stone-900">🏨 Gợi ý Homestay & Khách sạn tốt nhất</h3>
                  <p className="text-xs text-stone-500 mt-1">Cơ sở lưu trú đã xác thực, view đồi chè và rừng thông.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {accommodations.slice(0, 4).map((acc) => (
                    <div key={acc.id} className="border border-stone-200 rounded-2xl p-4 hover:shadow-lg transition-shadow flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <h4 className="font-extrabold text-stone-900 text-sm">{acc.name}</h4>
                          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            ★ {acc.rating || 4.8}
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 line-clamp-2 mb-3">{acc.description}</p>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                        <span className="font-mono font-black text-emerald-800 text-xs">{acc.roomTypes?.[0]?.pricePerNight?.toLocaleString() || "500.000"}đ / đêm</span>
                        <button
                          onClick={() => setActiveTab("combo")}
                          className="px-3 py-1.5 bg-[#1b4332] text-white text-xs font-bold rounded-lg hover:bg-emerald-800 cursor-pointer"
                        >
                          Đặt kèm xe
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTool === "attractions" && (
              <div className="space-y-6">
                <div className="border-b border-stone-200 pb-4">
                  <h3 className="text-lg font-black text-stone-900">📍 Điểm tham quan không thể bỏ lỡ</h3>
                  <p className="text-xs text-stone-500 mt-1">Cập nhật tọa độ và mùa hoa đẹp nhất.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {destinations.slice(0, 4).map((dest) => (
                    <div key={dest.id} className="border border-stone-200 rounded-2xl p-4 flex gap-4 items-center">
                      <img src={dest.image} alt={dest.name} className="w-20 h-20 rounded-xl object-cover shrink-0" />
                      <div>
                        <h4 className="font-extrabold text-stone-900 text-sm">{dest.name}</h4>
                        <p className="text-xs text-stone-500 mt-0.5">{dest.distance}</p>
                        <span className="inline-block mt-2 text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200">
                          {dest.tag}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
