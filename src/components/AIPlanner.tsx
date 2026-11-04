import React, { useState } from "react";
import { Sparkles, Printer, Copy, RefreshCw, Compass, ShieldCheck, CheckCheck, MapPin, Users, Calendar, DollarSign, Plus, Minus, Car, Check, ArrowRight, MessageSquare, ListFilter } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Localized fun loading phrases
const LOADING_PHRASES = [
  "Trợ lý Xe Đi Mộc Châu đang sải bước trên đồi chè Trái Tim lộng gió...",
  "Đang dầm sương sớm trên thung lũng mận Nà Ka tuyển mộ địa điểm đỉnh...",
  "Hỏi ý kiến bản làng Đông Sang sắp xếp bữa tối cá suối nướng ngon lành...",
  "Liên hệ điều hành DCar Limousine 9 chỗ bố trí lộ trình di chuyển mượt mà nhất...",
  "Hoàn thiện cẩm nang đặc sản cải mèo, trâu gác bếp và bê chao nóng hổi...",
  "Khắc họa bản đồ tọa độ check-in sống ảo, cầu kính Bạch Long kỷ lục..."
];

const COMMON_DEPARTURES = [
  "Hà Nội",
  "Thanh Hóa",
  "Nghệ An",
  "Hồ Chí Minh (TP.HCM)",
  "Hải Phòng",
  "Quảng Ninh",
  "Bắc Ninh",
  "Đà Nẵng",
  "Ninh Bình",
  "Hà Nam",
  "Nam Định",
  "Phú Thọ",
  "Thái Nguyên",
  "Bắc Giang",
  "Lào Cai"
];

const TRAVEL_STYLES_LIST = [
  "Sống ảo check-in (Đồi chè, thung lũng hoa, cầu kính)",
  "Nghỉ dưỡng ẩm thực thư thái (Homestay, đặc sản bản địa)",
  "Văn hóa dân tộc Thái & H'Mông",
  "Khám phá thiên nhiên & Săn mây",
  "Phượt mạo hiểm (Đỉnh Pha Luông, cung đường đèo)"
];

export default function AIPlanner() {
  // Dual mode: "natural" (Hỏi tự nhiên) or "form" (Biểu mẫu chi tiết)
  const [plannerMode, setPlannerMode] = useState<"natural" | "form">("natural");
  const [naturalQuery, setNaturalQuery] = useState("");
  const [isParsingNatural, setIsParsingNatural] = useState(false);

  // Form States
  const [departure, setDeparture] = useState("Hà Nội");
  const [showDepartureDropdown, setShowDepartureDropdown] = useState(false);
  
  const [partySize, setPartySize] = useState<number>(3);
  
  const [budgetType, setBudgetType] = useState<"per_person" | "total" | "unknown">("total");
  const [budgetAmount, setBudgetAmount] = useState<number | "">(4200000);
  
  const [departureDate, setDepartureDate] = useState<string>("");
  const [isDateUnknown, setIsDateUnknown] = useState<boolean>(true);
  
  const [duration, setDuration] = useState("2 ngày 1 đêm");
  
  const [selectedStyles, setSelectedStyles] = useState<string[]>([
    "Sống ảo check-in (Đồi chè, thung lũng hoa, cầu kính)"
  ]);
  
  const [transport, setTransport] = useState("Limousine");
  const [notes, setNotes] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [itinerary, setItinerary] = useState<string | null>(null);
  const [groundingSources, setGroundingSources] = useState<{title: string, uri: string}[]>([]);
  const [copied, setCopied] = useState(false);

  // Filter departure suggestions
  const filteredDepartures = COMMON_DEPARTURES.filter(loc => 
    loc.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(
      departure.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    )
  );

  const handlePartySizeChange = (delta: number) => {
    setPartySize(prev => Math.max(1, Math.min(100, prev + delta)));
  };

  const toggleStyle = (styleName: string) => {
    setSelectedStyles(prev => 
      prev.includes(styleName) 
        ? prev.filter(s => s !== styleName)
        : [...prev, styleName]
    );
  };

  const handleNaturalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!naturalQuery.trim()) return;

    setIsParsingNatural(true);
    try {
      const res = await fetch("/api/ai/parse-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: naturalQuery })
      });
      const data = await res.json();
      if (data.success && data.params) {
        const p = data.params;
        if (p.departure) setDeparture(p.departure);
        if (p.partySize) setPartySize(p.partySize);
        if (p.duration) setDuration(p.duration);
        if (p.budgetAmount) setBudgetAmount(p.budgetAmount);
        if (p.budgetType) setBudgetType(p.budgetType);
        if (p.styles && Array.isArray(p.styles)) setSelectedStyles(p.styles);
        if (p.notes) setNotes(p.notes);

        // Switch to form or directly generate itinerary
        setPlannerMode("form");
        // Automatically trigger itinerary generation
        await executeGeneration({
          departure: p.departure || departure,
          partySize: p.partySize || partySize,
          budgetType: p.budgetType || budgetType,
          budgetAmount: p.budgetAmount || budgetAmount,
          departureDate: isDateUnknown ? "" : departureDate,
          isDateUnknown,
          duration: p.duration || duration,
          styles: p.styles || selectedStyles,
          transport,
          notes: p.notes || notes
        });
      }
    } catch (err) {
      console.error("Natural prompt parse error:", err);
      // Fallback: switch to form with notes
      setNotes(naturalQuery);
      setPlannerMode("form");
    } finally {
      setIsParsingNatural(false);
    }
  };

  const executeGeneration = async (payload: any) => {
    setIsLoading(true);
    setItinerary(null);
    setGroundingSources([]);
    setCopied(false);

    let index = 0;
    setProgressText(LOADING_PHRASES[0]);
    const phraseInterval = setInterval(() => {
      index = (index + 1) % LOADING_PHRASES.length;
      setProgressText(LOADING_PHRASES[index]);
    }, 2800);

    try {
      const response = await fetch("/api/generate-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Lỗi máy chủ: ${response.status}`);
      }
      
      const data = await response.json();
      clearInterval(phraseInterval);
      
      if (data.success && data.itinerary) {
        setItinerary(data.itinerary);
        
        if (data.groundingMetadata?.groundingChunks) {
          const sources = data.groundingMetadata.groundingChunks
            .filter((chunk: any) => chunk.web)
            .map((chunk: any) => ({
              title: chunk.web.title,
              uri: chunk.web.uri
            }));
          setGroundingSources(sources);
        }
      } else {
        throw new Error(data.message || "Không có dữ liệu lịch trình trả về.");
      }
    } catch (error: any) {
      clearInterval(phraseInterval);
      console.error("Failed to generate AI itinerary:", error);
      
      let errorDisplay = `❌ Lỗi: ${error.message}`;
      if (error.message?.includes("429") || error.message?.includes("Quota")) {
        errorDisplay = "⚠️ Hệ thống đang đạt giới hạn lượt yêu cầu miễn phí (Quota Limit). Quý khách vui lòng đợi khoảng 60 giây và nhấn thử lại.";
      }
      setItinerary(errorDisplay);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeGeneration({
      departure: departure.trim() || "Hà Nội",
      partySize: Number(partySize) || 1,
      budgetType,
      budgetAmount: typeof budgetAmount === "number" ? budgetAmount : 0,
      departureDate: isDateUnknown ? "" : departureDate,
      isDateUnknown,
      duration,
      styles: selectedStyles.length > 0 ? selectedStyles : ["Khám phá chung"],
      transport,
      notes
    });
  };

  const handleCopy = () => {
    if (!itinerary) return;
    navigator.clipboard.writeText(itinerary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const renderFormattedItinerary = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, index) => {
      const trimmed = line.trim();
      
      if (trimmed.startsWith("###")) {
        return (
          <h4 key={index} className="text-base font-extrabold text-[#1b4332] mt-6 mb-2 border-b border-stone-100 pb-1 font-sans">
            {trimmed.replace("###", "").trim()}
          </h4>
        );
      }
      if (trimmed.startsWith("##")) {
        return (
          <h3 key={index} className="text-lg font-extrabold text-[#1b4332] mt-8 mb-3 flex items-center space-x-1.5 font-sans">
            <span className="w-2.5 h-2.5 bg-emerald-600 rounded-full inline-block" />
            <span>{trimmed.replace("##", "").trim()}</span>
          </h3>
        );
      }
      if (trimmed.startsWith("#")) {
        return (
          <h2 key={index} className="text-xl font-extrabold text-[#1b4332] mt-10 mb-4 border-l-4 border-emerald-600 pl-3.5 pb-0.5 font-sans">
            {trimmed.replace("#", "").trim()}
          </h2>
        );
      }

      if (trimmed.startsWith("*") || trimmed.startsWith("-")) {
        let content = trimmed.slice(1).trim();
        const formatted = replaceBoldMarkdown(content);
        return (
          <li key={index} className="ml-5 list-disc text-xs text-stone-600 leading-relaxed py-1 font-sans">
            {formatted}
          </li>
        );
      }

      if (trimmed.length > 0) {
        return (
          <p key={index} className="text-xs text-stone-600 leading-relaxed py-1.5 font-sans">
            {replaceBoldMarkdown(trimmed)}
          </p>
        );
      }

      return <div key={index} className="h-1.5" />;
    });
  };

  const replaceBoldMarkdown = (text: string) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    if (parts.length === 1) return text;
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="font-extrabold text-stone-900">{part}</strong>;
      }
      return part;
    });
  };

  const numericBudget = typeof budgetAmount === "number" ? budgetAmount : 0;
  const calculatedTotal = budgetType === "per_person" ? numericBudget * partySize : numericBudget;
  const calculatedPerPerson = budgetType === "total" ? Math.round(numericBudget / Math.max(1, partySize)) : numericBudget;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10" id="ai_itinerary_planner_section">
      <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
        <span className="relative inline-flex items-center space-x-1 border border-emerald-500/20 bg-emerald-50 text-emerald-800 text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full">
          <Sparkles className="w-3 h-3 text-emerald-600 animate-pulse" />
          <span>Mộc Châu Travel AI Assistant</span>
        </span>
        <h2 className="text-xl sm:text-3xl font-extrabold text-[#1b4332] tracking-tight mt-2.5">
          Trợ Lý Ảo Thiết Kế Lịch Trình Mộc Châu
        </h2>
        <p className="text-stone-500 mt-2 text-xs sm:text-sm font-sans">
          Trải nghiệm tư vấn thông minh: Bạn có thể nhắn nhu cầu tự nhiên hoặc chọn biểu mẫu chi tiết.
        </p>

        {/* Dual Mode Switcher */}
        <div className="flex items-center justify-center space-x-2 mt-6">
          <button
            type="button"
            onClick={() => setPlannerMode("natural")}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all cursor-pointer border ${
              plannerMode === "natural"
                ? "bg-[#1b4332] text-white border-[#1b4332] shadow-md"
                : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Cách 1: Hỏi tự nhiên (Chat thông minh)</span>
          </button>
          <button
            type="button"
            onClick={() => setPlannerMode("form")}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all cursor-pointer border ${
              plannerMode === "form"
                ? "bg-[#1b4332] text-white border-[#1b4332] shadow-md"
                : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>Cách 2: Biểu mẫu chi tiết</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left Input / Form controls */}
        <div className="lg:col-span-5 bg-white border border-stone-200 p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-xs text-left">
          {plannerMode === "natural" ? (
            <form onSubmit={handleNaturalSubmit} className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-stone-900 flex items-center space-x-2">
                  <Sparkles className="w-4.5 h-4.5 text-emerald-600" />
                  <span>Nói cho AI biết mong muốn của bạn</span>
                </h3>
                <p className="text-xs text-stone-500 font-sans leading-relaxed">
                  Ví dụ: <i>"Tôi ở Thanh Hóa, đi Mộc Châu 5 người, 3 ngày, khoảng 8 triệu, thích săn mây."</i>
                </p>
              </div>

              <textarea
                value={naturalQuery}
                onChange={(e) => setNaturalQuery(e.target.value)}
                placeholder="Nhập yêu cầu chuyến đi theo cách của bạn..."
                rows={5}
                className="w-full p-3.5 border border-stone-200 rounded-2xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-emerald-600 bg-stone-50/50 focus:bg-white font-sans"
              />

              <button
                type="submit"
                disabled={isParsingNatural || !naturalQuery.trim()}
                className={`w-full py-3.5 bg-gradient-to-r from-emerald-600 to-[#1b4332] text-white rounded-xl font-bold text-sm tracking-wide shadow-md shadow-emerald-800/20 hover:from-emerald-700 hover:to-[#122e22] transition-colors flex items-center justify-center space-x-2 cursor-pointer ${
                  isParsingNatural ? "opacity-75 cursor-not-allowed" : ""
                }`}
              >
                {isParsingNatural ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                )}
                <span>{isParsingNatural ? "AI đang phân tích..." : "Phân Tích & Lên Lịch Trình Ngay"}</span>
              </button>

              <div className="pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setPlannerMode("form")}
                  className="text-xs text-emerald-700 font-bold hover:underline flex items-center space-x-1"
                >
                  <span>Hoặc chuyển sang điền biểu mẫu chi tiết từng bước</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <h3 className="text-xs font-bold text-stone-800 uppercase tracking-widest flex items-center space-x-1.5">
                  <Compass className="w-4.5 h-4.5 text-emerald-600" />
                  <span>Biểu mẫu chi tiết</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setPlannerMode("natural")}
                  className="text-[11px] text-emerald-700 font-bold hover:underline"
                >
                  ← Quay lại hỏi tự nhiên
                </button>
              </div>

              {/* 1. Departure Location */}
              <div className="space-y-1.5 relative">
                <label className="text-xs text-stone-800 font-bold flex items-center justify-between">
                  <span>1. Điểm xuất phát:</span>
                  <span className="text-[10px] text-emerald-700 font-medium">Nhập tự do bất kỳ</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                  </div>
                  <input
                    type="text"
                    value={departure}
                    onChange={(e) => {
                      setDeparture(e.target.value);
                      setShowDepartureDropdown(true);
                    }}
                    onFocus={() => setShowDepartureDropdown(true)}
                    placeholder="Hà Nội, Thanh Hóa, TP.HCM, Hải Phòng..."
                    className="w-full pl-9 pr-3.5 py-2.5 border border-stone-200 rounded-xl text-xs sm:text-sm bg-stone-50/50 text-stone-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all font-medium"
                  />
                </div>
                {showDepartureDropdown && (
                  <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-stone-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    <div className="p-2 text-[10px] font-bold text-stone-400 uppercase tracking-wider bg-stone-50 border-b border-stone-100">
                      Gợi ý địa điểm thường đi
                    </div>
                    {filteredDepartures.length > 0 ? (
                      filteredDepartures.map((loc, idx) => (
                        <button
                          type="button"
                          key={idx}
                          onClick={() => {
                            setDeparture(loc);
                            setShowDepartureDropdown(false);
                          }}
                          className="w-full text-left px-3.5 py-2 text-xs text-stone-700 hover:bg-emerald-50 hover:text-emerald-900 transition-colors flex items-center space-x-2 font-medium"
                        >
                          <MapPin className="w-3.5 h-3.5 text-stone-400" />
                          <span>{loc}</span>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2.5 text-xs text-stone-500 italic">
                        Dùng điểm xuất phát tùy chỉnh: "{departure}"
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 2. Party Size */}
              <div className="space-y-1.5">
                <label className="text-xs text-stone-800 font-bold flex items-center justify-between">
                  <span>2. Số lượng khách:</span>
                  <span className="text-[10px] text-emerald-700 font-medium">Từ 1 đến 100 khách</span>
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handlePartySizeChange(-1)}
                    className="w-11 h-11 bg-stone-100 hover:bg-emerald-100 text-stone-800 rounded-xl flex items-center justify-center font-bold text-lg transition-colors border border-stone-200 cursor-pointer active:scale-95 shrink-0"
                    aria-label="Giảm số người"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Users className="w-4 h-4 text-emerald-600" />
                    </div>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={partySize}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val) && val > 0) {
                          setPartySize(val);
                        } else if (e.target.value === "") {
                          setPartySize(1);
                        }
                      }}
                      className="w-full text-center pl-8 pr-3 py-2.5 border border-stone-200 rounded-xl text-sm font-bold bg-stone-50/50 text-stone-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handlePartySizeChange(1)}
                    className="w-11 h-11 bg-stone-100 hover:bg-emerald-100 text-stone-800 rounded-xl flex items-center justify-center font-bold text-lg transition-colors border border-stone-200 cursor-pointer active:scale-95 shrink-0"
                    aria-label="Tăng số người"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 3. Budget */}
              <div className="space-y-2 bg-stone-50/70 p-3.5 rounded-2xl border border-stone-200/80">
                <label className="text-xs text-stone-800 font-bold block">
                  3. Ngân sách dự kiến (VNĐ):
                </label>
                
                <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setBudgetType("per_person")}
                    className={`py-2 px-2 rounded-xl font-bold border transition-all cursor-pointer ${
                      budgetType === "per_person"
                        ? "bg-[#1b4332] text-white border-[#1b4332] shadow-xs"
                        : "bg-white text-stone-700 border-stone-200 hover:bg-stone-100"
                    }`}
                  >
                    Mỗi người
                  </button>
                  <button
                    type="button"
                    onClick={() => setBudgetType("total")}
                    className={`py-2 px-2 rounded-xl font-bold border transition-all cursor-pointer ${
                      budgetType === "total"
                        ? "bg-[#1b4332] text-white border-[#1b4332] shadow-xs"
                        : "bg-white text-stone-700 border-stone-200 hover:bg-stone-100"
                    }`}
                  >
                    Tổng chuyến đi
                  </button>
                  <button
                    type="button"
                    onClick={() => setBudgetType("unknown")}
                    className={`py-2 px-2 rounded-xl font-bold border transition-all cursor-pointer ${
                      budgetType === "unknown"
                        ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                        : "bg-white text-stone-700 border-stone-200 hover:bg-stone-100"
                    }`}
                  >
                    Chưa biết (AI tư vấn)
                  </button>
                </div>

                {budgetType !== "unknown" && (
                  <div className="space-y-1.5 pt-1">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                      </div>
                      <input
                        type="number"
                        step="50000"
                        min="0"
                        value={budgetAmount}
                        onChange={(e) => {
                          const val = e.target.value === "" ? "" : Number(e.target.value);
                          setBudgetAmount(val);
                        }}
                        placeholder="Nhập số tiền VNĐ..."
                        className="w-full pl-9 pr-12 py-2.5 border border-stone-200 rounded-xl text-xs sm:text-sm font-bold bg-white text-stone-900 focus:outline-none focus:border-emerald-600"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-xs text-stone-400 font-semibold">
                        VNĐ
                      </div>
                    </div>

                    <div className="text-[11px] text-emerald-900 bg-emerald-50/80 px-3 py-1.5 rounded-xl border border-emerald-200/60 flex items-center justify-between font-medium">
                      <span>Ngân sách quy đổi:</span>
                      <span className="font-bold text-[#1b4332]">
                        {budgetType === "per_person" 
                          ? `Tổng đoàn: ${calculatedTotal.toLocaleString("vi-VN")} đ` 
                          : `Khoảng ${calculatedPerPerson.toLocaleString("vi-VN")} đ/người`}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Departure Date */}
              <div className="space-y-1.5">
                <label className="text-xs text-stone-800 font-bold flex items-center justify-between">
                  <span>4. Ngày đi:</span>
                  <label className="flex items-center space-x-1.5 text-[11px] font-normal text-stone-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isDateUnknown}
                      onChange={(e) => setIsDateUnknown(e.target.checked)}
                      className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                    />
                    <span>Chưa xác định ngày</span>
                  </label>
                </label>
                
                {!isDateUnknown && (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                    </div>
                    <input
                      type="date"
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 border border-stone-200 rounded-xl text-xs sm:text-sm font-medium bg-stone-50/50 text-stone-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                    />
                  </div>
                )}
              </div>

              {/* 5. Duration */}
              <div className="space-y-1.5">
                <label className="text-xs text-stone-800 font-bold block">
                  5. Thời gian du lịch:
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-xs sm:text-sm bg-stone-50/50 text-stone-900 focus:outline-none focus:border-emerald-600 cursor-pointer font-medium"
                >
                  <option value="1 ngày khứ hồi">1 ngày khứ hồi</option>
                  <option value="2 ngày 1 đêm">2 ngày 1 đêm</option>
                  <option value="3 ngày 2 đêm">3 ngày 2 đêm</option>
                  <option value="4 ngày 3 đêm">4 ngày 3 đêm</option>
                  <option value="5 ngày 4 đêm">Thời gian khác (tư vấn thêm)</option>
                </select>
              </div>

              {/* 6. Travel Styles (Multi-select) */}
              <div className="space-y-2">
                <label className="text-xs text-stone-800 font-bold block">
                  6. Phong cách (chọn nhiều):
                </label>
                <div className="space-y-1.5">
                  {TRAVEL_STYLES_LIST.map((styleName, idx) => {
                    const isSelected = selectedStyles.includes(styleName);
                    return (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => toggleStyle(styleName)}
                        className={`w-full text-left px-3.5 py-2 rounded-xl text-xs transition-all flex items-center justify-between border cursor-pointer ${
                          isSelected
                            ? "bg-emerald-50 text-emerald-950 border-emerald-300 font-bold shadow-2xs"
                            : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50 font-medium"
                        }`}
                      >
                        <span className="flex items-center space-x-2">
                          <span className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-stone-300 bg-white'}`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </span>
                          <span>{styleName}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 7. Transport Preference */}
              <div className="space-y-1.5">
                <label className="text-xs text-stone-800 font-bold block">
                  7. Phương tiện:
                </label>
                <select
                  value={transport}
                  onChange={(e) => setTransport(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-xs sm:text-sm bg-stone-50/50 text-stone-900 focus:outline-none focus:border-emerald-600 cursor-pointer font-medium"
                >
                  <option value="Limousine">Limousine VIP (Đón trả tận nơi)</option>
                  <option value="Xe riêng">Xe riêng nguyên chuyến</option>
                  <option value="Xe khách">Xe khách giường nằm</option>
                  <option value="Thuê xe">Thuê xe / Xe máy</option>
                  <option value="Chưa quyết định">Chưa quyết định</option>
                </select>
              </div>

              {/* 8. Additional notes */}
              <div className="space-y-1.5">
                <label className="text-xs text-stone-800 font-bold block">
                  8. Yêu cầu đặc biệt (có trẻ nhỏ, người lớn tuổi, thú cưng...):
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ví dụ: Đoàn có 2 trẻ nhỏ dưới 5 tuổi, thích ăn món dân tộc..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:border-emerald-600 bg-stone-50/50 focus:bg-white font-sans"
                />
              </div>

              {/* Trigger Button */}
              <button
                type="submit"
                id="ai_build_itinerary_btn"
                disabled={isLoading}
                className={`w-full py-4 bg-gradient-to-r from-emerald-600 to-[#1b4332] text-white rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-emerald-800/25 hover:from-emerald-700 hover:to-[#122e22] transition-colors flex items-center justify-center space-x-2 cursor-pointer ${
                  isLoading ? "opacity-75 cursor-not-allowed" : ""
                }`}
              >
                {isLoading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                )}
                <span>{isLoading ? "AI đang lập lịch trình..." : "Kiểm tra thông tin hành trình"}</span>
              </button>
            </form>
          )}
        </div>

        {/* Right Output details */}
        <div className="lg:col-span-7">
          <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm min-h-[500px] flex flex-col justify-between print:border-none print:shadow-none bg-radial from-slate-50/50 to-white">
            
            {/* Top Toolbar */}
            <div className="px-6 py-4 bg-stone-50/80 border-b border-stone-100 flex justify-between items-center print:hidden">
              <span className="text-xs font-bold text-[#1b4332] tracking-wider uppercase">Lịch trình cá nhân hóa</span>
              {itinerary && (
                <div className="flex space-x-2">
                  <button
                    onClick={handleCopy}
                    id="copy_itinerary_btn"
                    className="p-2 rounded-lg border border-stone-200 text-stone-600 hover:text-emerald-700 hover:bg-emerald-50 transition-all text-xs flex items-center space-x-1 cursor-pointer"
                    title="Sao chép toàn bộ"
                  >
                    {copied ? <CheckCheck className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span className="hidden sm:inline font-semibold">{copied ? "Đã chép" : "Chép"}</span>
                  </button>

                  <button
                    onClick={handlePrint}
                    id="print_itinerary_btn"
                    className="p-2 rounded-lg border border-stone-200 text-stone-600 hover:text-emerald-700 hover:bg-emerald-50 transition-all text-xs flex items-center space-x-1 cursor-pointer"
                    title="In bản cứng / Tải PDF"
                  >
                    <Printer className="w-4 h-4" />
                    <span className="hidden sm:inline font-semibold">In Tour</span>
                  </button>
                </div>
              )}
            </div>

            {/* Inner Content Block */}
            <div className="p-6 md:p-8 flex-1 flex flex-col justify-center text-left" id="print_area">
              <AnimatePresence mode="wait">
                {isLoading && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-16 space-y-6 max-w-sm mx-auto"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-[#1b4332] flex items-center justify-center text-white mx-auto shadow-md shadow-emerald-500/20">
                      <RefreshCw className="w-8 h-8 animate-spin" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-extrabold text-[#1b4332] text-sm sm:text-base animate-pulse">Trợ lý AI đang xử lý yêu cầu...</h4>
                      <p className="text-stone-500 text-xs leading-relaxed font-sans min-h-[40px]">
                        {progressText}
                      </p>
                    </div>
                  </motion.div>
                )}

                {!isLoading && !itinerary && (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16 text-stone-400 space-y-4 max-w-sm mx-auto"
                    id="planner_empty_view"
                  >
                    <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mx-auto">
                      <Sparkles className="w-7 h-7 text-emerald-600 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-[#1b4332] text-sm">Chưa Có Bản Lịch Trình Nào</h4>
                      <p className="text-stone-400 text-xs mt-1 max-w-xs mx-auto font-sans">
                        Hãy chọn <b>Cách 1 (Hỏi tự nhiên)</b> hoặc <b>Cách 2 (Biểu mẫu chi tiết)</b> ở phía trên để AI lập lịch trình hoàn hảo cho bạn.
                      </p>
                    </div>
                  </motion.div>
                )}

                {!isLoading && itinerary && (
                  <motion.div
                    key="output"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="prose max-w-none text-stone-800"
                    id="compiled_itinerary_output"
                  >
                    {!itinerary.startsWith("❌") && (
                      <div className="border bg-emerald-50/50 p-4 rounded-2xl border-emerald-100 flex items-start space-x-3 text-emerald-800 text-xs leading-relaxed mb-6 print:hidden">
                        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-extrabold block text-emerald-950">Lịch trình đã được thiết kế thành công!</span>
                          Phù hợp chính xác với điểm xuất phát <b>{departure}</b> cho đoàn <b>{partySize} khách</b>. Bạn có thể nhấn <b>In Tour</b> hoặc lưu lại để chuẩn bị cho chuyến đi.
                        </div>
                      </div>
                    )}

                    <div className={`space-y-1 ${itinerary.startsWith("❌") ? "text-red-600 bg-red-50 p-4 rounded-xl border border-red-100" : ""}`}>
                      {renderFormattedItinerary(itinerary)}
                    </div>

                    {itinerary && !itinerary.startsWith("❌") && groundingSources.length > 0 && (
                      <div className="mt-10 pt-8 border-t border-stone-100 print:block">
                        <div className="flex items-center space-x-2 mb-4">
                          <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                          <h5 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.1em]">
                            Nguồn tham khảo thời gian thực từ Google Search
                          </h5>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {groundingSources.map((source, idx) => (
                            <a 
                              key={idx}
                              href={source.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] bg-white text-stone-500 px-4 py-2 rounded-xl border border-stone-100 shadow-sm hover:border-blue-300 hover:text-blue-600 hover:shadow-md transition-all flex items-center space-x-2 group"
                            >
                              <span className="truncate max-w-[180px] font-bold">{source.title}</span>
                              <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Support Callout */}
            {itinerary && !isLoading && (
              <div className="px-6 py-4 bg-[#1b4332] text-stone-100 text-xs rounded-b-3xl flex flex-wrap justify-between items-center gap-2 print:hidden">
                <span className="font-sans font-medium">Cần hỗ trợ chi tiết hoặc đặt xe theo lịch trình này? Liên hệ điều hành viên</span>
                <a
                  href="tel:0971050324"
                  className="px-4 py-1.5 bg-amber-500 font-bold hover:bg-amber-600 transition-colors rounded-lg text-stone-900"
                >
                  Gọi Điều Hành: 0971.050.324
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
