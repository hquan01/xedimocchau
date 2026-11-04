import React from "react";
import { X, Sparkles, Sun, Home, Car, Utensils, MapPin, CalendarDays, ArrowRight, Compass, ShieldCheck } from "lucide-react";

interface AIAdvisorResultViewProps {
  question: string;
  result: {
    intents: string[];
    extractedParams?: {
      partySize?: string;
      budget?: string;
      dates?: string;
      location?: string;
    };
    replyText: string;
  };
  onClose: () => void;
  onSelectBooking: () => void;
  onOpenItinerary: () => void;
  onOpenCategory: (catKey: string) => void;
}

export default function AIAdvisorResultView({
  question,
  result,
  onClose,
  onSelectBooking,
  onOpenItinerary,
  onOpenCategory
}: AIAdvisorResultViewProps) {
  const intents = result.intents || ["GENERAL"];
  const params = result.extractedParams || {};

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-[130] font-sans text-left animate-fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-stone-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#1b4332] text-white p-6 relative flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-400/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] bg-emerald-800 text-emerald-200 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Trợ lý AI Đa Năng Mộc Châu Travel
              </span>
              <h3 className="text-base sm:text-lg font-black mt-1 text-white line-clamp-1">
                "{question}"
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-300 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
          {/* AI Conversational Response */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-5 text-xs sm:text-sm text-stone-800 leading-relaxed space-y-3 font-sans">
            <div className="flex items-center space-x-2 text-emerald-900 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Gợi ý thông minh từ Trợ lý Mộc Châu Travel:</span>
            </div>
            <p className="whitespace-pre-line">{result.replyText}</p>
          </div>

          {/* Extracted Parameters Badge Bar */}
          {(params.partySize || params.budget || params.dates || params.location) && (
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="text-stone-400 font-bold self-center">Ngữ cảnh nhận diện:</span>
              {params.partySize && (
                <span className="bg-stone-100 text-stone-700 px-3 py-1 rounded-full font-bold">👥 {params.partySize} người</span>
              )}
              {params.budget && (
                <span className="bg-stone-100 text-stone-700 px-3 py-1 rounded-full font-bold">💰 Ngân sách: {params.budget}</span>
              )}
              {params.dates && (
                <span className="bg-stone-100 text-stone-700 px-3 py-1 rounded-full font-bold">📅 Thời gian: {params.dates}</span>
              )}
              {params.location && (
                <span className="bg-stone-100 text-stone-700 px-3 py-1 rounded-full font-bold">📍 Địa điểm: {params.location}</span>
              )}
            </div>
          )}

          {/* Dynamic Cards Based on Intents */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-stone-400 uppercase tracking-widest">Nội dung & Dịch vụ phù hợp yêu cầu</h4>

            {intents.includes("WEATHER") && (
              <div className="bg-gradient-to-r from-teal-900 to-[#1b4332] text-white p-5 rounded-2xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                    <Sun className="w-4 h-4 text-amber-300" /> <span>Dự báo thời tiết trực tuyến Mộc Châu</span>
                  </div>
                  <h4 className="text-base font-black mt-1">Dữ liệu khí tượng Open-Meteo cập nhật thời gian thực</h4>
                  <p className="text-xs text-stone-200 mt-1">Xem chi tiết nhiệt độ, khả năng mưa theo giờ & 7 ngày tới, kèm lời khuyên du lịch an toàn.</p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onOpenCategory("thoi-tiet");
                  }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs rounded-xl shadow-md cursor-pointer whitespace-nowrap transition-colors"
                >
                  Xem thời tiết trực tiếp →
                </button>
              </div>
            )}

            {(intents.includes("TRANSPORT") || question.toLowerCase().includes("xe") || question.toLowerCase().includes("limousine")) && (
              <div className="bg-stone-900 text-white p-5 rounded-2xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] bg-emerald-500 text-stone-950 font-black px-2.5 py-0.5 rounded-full uppercase">Đề xuất di chuyển</span>
                  <h4 className="font-black text-base mt-2">Xe Limousine VIP Hà Nội ⇌ Mộc Châu</h4>
                  <p className="text-xs text-stone-300 mt-0.5">Đón trả tận nhà, ghế massage êm ái, cam kết giữ chỗ 100%.</p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onSelectBooking();
                  }}
                  className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs px-5 py-3 rounded-xl transition-colors shrink-0 cursor-pointer"
                >
                  Mở form đặt xe ngay →
                </button>
              </div>
            )}

            {(intents.includes("ACCOMMODATION") || question.toLowerCase().includes("homestay") || question.toLowerCase().includes("khách sạn")) && (
              <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] bg-amber-500 text-white font-black px-2.5 py-0.5 rounded-full uppercase">Lưu trú xác thực</span>
                  <h4 className="font-black text-stone-900 text-base mt-2">Khám phá danh sách Homestay & Khách sạn Mộc Châu</h4>
                  <p className="text-xs text-stone-600 mt-0.5">View đồi chè, thung lũng mận, giá niêm yết chuẩn xác.</p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onOpenCategory("homestay");
                  }}
                  className="w-full sm:w-auto bg-[#1b4332] text-white font-black text-xs px-5 py-3 rounded-xl transition-colors shrink-0 cursor-pointer"
                >
                  Xem danh sách Homestay →
                </button>
              </div>
            )}

            {(intents.includes("FOOD") || question.toLowerCase().includes("quán ăn") || question.toLowerCase().includes("nhà hàng") || question.toLowerCase().includes("ăn")) && (
              <div className="bg-stone-50 border border-stone-200 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] bg-rose-500 text-white font-black px-2.5 py-0.5 rounded-full uppercase">Ẩm thực Tây Bắc</span>
                  <h4 className="font-black text-stone-900 text-base mt-2">Nhà Hàng & Đặc Sản Bê Chao, Cá Suối</h4>
                  <p className="text-xs text-stone-600 mt-0.5">Khám phá các địa chỉ ẩm thực uy tín nhất tại thị trấn Mộc Châu.</p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onOpenCategory("nha-hang");
                  }}
                  className="w-full sm:w-auto bg-[#1b4332] text-white font-black text-xs px-5 py-3 rounded-xl transition-colors shrink-0 cursor-pointer"
                >
                  Xem nhà hàng →
                </button>
              </div>
            )}

            {(intents.includes("ITINERARY") || question.toLowerCase().includes("lịch trình")) && (
              <div className="bg-teal-50 border border-teal-200 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] bg-teal-600 text-white font-black px-2.5 py-0.5 rounded-full uppercase">Lập kế hoạch AI</span>
                  <h4 className="font-black text-stone-900 text-base mt-2">Công cụ Trợ lý Lịch Trình Tự Động</h4>
                  <p className="text-xs text-stone-600 mt-0.5">Tạo lịch trình chi tiết theo số ngày và ngân sách của bạn.</p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onOpenItinerary();
                  }}
                  className="w-full sm:w-auto bg-teal-700 text-white font-black text-xs px-5 py-3 rounded-xl transition-colors shrink-0 cursor-pointer"
                >
                  Mở công cụ lịch trình →
                </button>
              </div>
            )}

            {(intents.includes("DESTINATION") || question.toLowerCase().includes("điểm") || question.toLowerCase().includes("bạch long") || question.toLowerCase().includes("thác")) && (
              <div className="bg-indigo-50 border border-indigo-200 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] bg-indigo-600 text-white font-black px-2.5 py-0.5 rounded-full uppercase">Điểm đến hấp dẫn</span>
                  <h4 className="font-black text-stone-900 text-base mt-2">Danh Thắng & Tọa Độ Check-in Mộc Châu</h4>
                  <p className="text-xs text-stone-600 mt-0.5">Cầu kính Bạch Long, Đồi chè Trái Tim, Thác Dải Yếm, Rừng thông Bản Áng.</p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onOpenCategory("dia-diem");
                  }}
                  className="w-full sm:w-auto bg-indigo-700 text-white font-black text-xs px-5 py-3 rounded-xl transition-colors shrink-0 cursor-pointer"
                >
                  Xem các điểm đến →
                </button>
              </div>
            )}

            {(intents.includes("FLOWER_SEASON") || question.toLowerCase().includes("hoa") || question.toLowerCase().includes("mận")) && (
              <div className="bg-pink-50 border border-pink-200 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] bg-pink-600 text-white font-black px-2.5 py-0.5 rounded-full uppercase">Lịch hoa nở rộ</span>
                  <h4 className="font-black text-stone-900 text-base mt-2">Mùa Hoa Mộc Châu & Thời Điểm Đẹp Nhất</h4>
                  <p className="text-xs text-stone-600 mt-0.5">Cập nhật thời gian hoa mận nở trắng, hoa cải Bản Áng, mùa mận chín.</p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onOpenCategory("mua-hoa");
                  }}
                  className="w-full sm:w-auto bg-pink-700 text-white font-black text-xs px-5 py-3 rounded-xl transition-colors shrink-0 cursor-pointer"
                >
                  Xem lịch mùa hoa →
                </button>
              </div>
            )}

            {(intents.includes("COMMUNITY") || question.toLowerCase().includes("zalo") || question.toLowerCase().includes("cộng đồng")) && (
              <div className="bg-blue-50 border border-blue-200 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] bg-blue-600 text-white font-black px-2.5 py-0.5 rounded-full uppercase">Cộng đồng Zalo & Diễn đàn</span>
                  <h4 className="font-black text-stone-900 text-base mt-2">Hỏi Đáp Cùng Người Bản Địa Mộc Châu</h4>
                  <p className="text-xs text-stone-600 mt-0.5">Tham gia 5 nhóm Zalo chuyên biệt theo chủ đề để được hỗ trợ tức thì.</p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onOpenCategory("cong-dong");
                  }}
                  className="w-full sm:w-auto bg-blue-700 text-white font-black text-xs px-5 py-3 rounded-xl transition-colors shrink-0 cursor-pointer"
                >
                  Vào trang cộng đồng →
                </button>
              </div>
            )}

            {(intents.includes("BUDGET") || question.toLowerCase().includes("chi phí") || question.toLowerCase().includes("giá")) && (
              <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] bg-emerald-600 text-white font-black px-2.5 py-0.5 rounded-full uppercase">Dự toán ngân sách</span>
                  <h4 className="font-black text-stone-900 text-base mt-2">Bảng Giá Vé & Chi Phí Du Lịch Chi Tiết</h4>
                  <p className="text-xs text-stone-600 mt-0.5">Dự toán trọn gói xe Limousine, khách sạn, ăn uống và vé vào cổng.</p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onOpenCategory("chi-phi");
                  }}
                  className="w-full sm:w-auto bg-emerald-700 text-white font-black text-xs px-5 py-3 rounded-xl transition-colors shrink-0 cursor-pointer"
                >
                  Xem bảng chi phí →
                </button>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-stone-200 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-[#1b4332] text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-emerald-800 transition-colors cursor-pointer"
            >
              Đóng và tiếp tục khám phá
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
