import React, { useState } from "react";
import { Sun, CloudRain, Wind, Thermometer, CalendarDays, Sparkles, MapPin, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import MocChauWeatherSection from "./MocChauWeatherSection";

interface MocChauTodayViewProps {
  setActiveTab: (tab: string) => void;
}

export default function MocChauTodayView({ setActiveTab }: MocChauTodayViewProps) {
  const [selectedSeasonTab, setSelectedSeasonTab] = useState<"weather" | "flowers" | "events">("weather");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-xs text-stone-500 mb-6">
        <button onClick={() => { setActiveTab("explore"); window.scrollTo({top: 0, behavior: "smooth"}); }} className="hover:text-emerald-700">Trang chủ</button>
        <span>/</span>
        <span className="text-emerald-800 font-bold">Mộc Châu hôm nay có gì?</span>
      </div>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-950 via-[#1b4332] to-emerald-900 rounded-3xl p-6 sm:p-10 text-white shadow-2xl relative overflow-hidden mb-8">
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-900/80 border border-teal-400/30 text-teal-300 text-xs font-extrabold uppercase tracking-widest mb-3">
            🌸 Thời Tiết Trực Tuyến & Mùa Hoa Mộc Châu
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
            Mộc Châu Hôm Nay Có Gì?
          </h1>
          <p className="text-stone-200 text-xs sm:text-sm leading-relaxed">
            Dự báo thời tiết cập nhật từ nguồn khí tượng trực tuyến. Lịch mùa hoa là thông tin tham khảo theo mùa, không phải xác nhận tình trạng hoa nở tại vườn.
          </p>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 bg-stone-100 p-2 rounded-2xl border border-stone-200">
        <button
          onClick={() => setSelectedSeasonTab("weather")}
          className={`px-5 py-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${selectedSeasonTab === "weather" ? "bg-[#1b4332] text-white shadow-md" : "text-stone-700 hover:bg-stone-200"}`}
        >
          🌤️ Thời tiết & Khí hậu hôm nay
        </button>
        <button
          onClick={() => setSelectedSeasonTab("flowers")}
          className={`px-5 py-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${selectedSeasonTab === "flowers" ? "bg-[#1b4332] text-white shadow-md" : "text-stone-700 hover:bg-stone-200"}`}
        >
          🌸 Tình trạng các mùa hoa & Săn mây
        </button>
        <button
          onClick={() => setSelectedSeasonTab("events")}
          className={`px-5 py-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${selectedSeasonTab === "events" ? "bg-[#1b4332] text-white shadow-md" : "text-stone-700 hover:bg-stone-200"}`}
        >
          🎉 Sự kiện & Hoạt động địa phương
        </button>
      </div>

      {/* Content based on sub-tab */}
      {selectedSeasonTab === "weather" && (
        <MocChauWeatherSection onBookingClick={() => setActiveTab("limousine")} />
      )}

      {selectedSeasonTab === "flowers" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { name: "Mùa Hoa Mận Trắng", time: "Tháng 1 - Tháng 2", status: "Theo mùa", desc: "Thông thường có thể ngắm hoa mận tại Nà Ka, Ba Phách vào mùa nở. Tình trạng hoa thực tế tùy thời tiết.", verified: false },
            { name: "Mùa Mận Hậu Chín", time: "Tháng 4 - Tháng 6", status: "Theo mùa", desc: "Mận hậu thường vào vụ trong khoảng tháng 4–6; thời gian thu hoạch thay đổi theo năm.", verified: false },
            { name: "Mùa Cải Trắng & Dã Quỳ", time: "Tháng 11 - Tháng 12", status: "Theo mùa", desc: "Hoa cải trắng và dã quỳ thường xuất hiện vào cuối năm; nên liên hệ điểm tham quan trước khi đi.", verified: false },
          ].map((flower, idx) => (
            <div key={idx} className="bg-white rounded-3xl p-6 shadow-xl border border-stone-200 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start gap-2 mb-3">
                  <h3 className="font-black text-stone-900 text-base">{flower.name}</h3>
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${flower.status === 'Đang diễn ra' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-stone-100 text-stone-600'}`}>
                    {flower.status}
                  </span>
                </div>
                <p className="text-xs font-bold text-amber-700 mb-2">⏱️ Thời gian: {flower.time}</p>
                <p className="text-xs text-stone-600 leading-relaxed">{flower.desc}</p>
              </div>

              <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Thời gian tham khảo</span>
                </span>
                <button
                  onClick={() => setActiveTab("limousine")}
                  className="px-3 py-1.5 bg-[#1b4332] text-white text-xs font-bold rounded-xl hover:bg-emerald-800 cursor-pointer"
                >
                  Đặt xe đi ngay
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedSeasonTab === "events" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-stone-200 space-y-4">
          <h3 className="font-black text-stone-900 text-lg mb-2">🎉 Sự kiện văn hóa & Lễ hội Mộc Châu</h3>
          <div className="border-l-4 border-emerald-600 pl-4 py-2 space-y-1">
            <h4 className="font-extrabold text-stone-900 text-sm">Hội Chợ TẾT ĐỘC LẬP & Khám phá Bản Làng H'Mông</h4>
            <span className="text-xs text-stone-500 font-bold block">📅 Định kỳ tháng 9 hàng năm tại Trung tâm huyện Mộc Châu</span>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              Tập trung hàng vạn bà con dân tộc mặc trang phục truyền thống rực rỡ, tham gia các trò chơi dân gian ném pa pao, đánh cù, múa khèn và thưởng thức ẩm thực thắng cố, cơm lam suối mơ.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
