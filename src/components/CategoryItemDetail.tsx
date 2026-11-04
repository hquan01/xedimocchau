import React from "react";
import { X, MapPin, ShieldCheck, Clock, Phone, Sparkles, Check, Compass, CalendarDays } from "lucide-react";

interface CategoryItemDetailProps {
  item: any;
  categoryTitle: string;
  onClose: () => void;
  onSelectBooking: () => void;
}

export default function CategoryItemDetail({
  item,
  categoryTitle,
  onClose,
  onSelectBooking
}: CategoryItemDetailProps) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-[120] font-sans text-left animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-stone-100 flex flex-col max-h-[90vh]">
        {/* Header Image */}
        <div className="relative aspect-[16/9] bg-stone-900 shrink-0">
          <img
            src={item.image || item.photo || "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80"}
            alt={item.name || item.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent" />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-6 right-6">
            <span className="bg-emerald-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
              {item.tag || categoryTitle}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-2 tracking-tight">
              {item.name || item.title}
            </h2>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
            <div className="flex items-center space-x-2 text-emerald-900">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span className="text-xs font-bold">Xác thực chính hãng bởi Mộc Châu Travel & QT Limousine</span>
            </div>
            {item.price && (
              <div className="text-right">
                <span className="text-[10px] text-stone-500 uppercase block font-bold">Giá tham khảo</span>
                <span className="text-base font-black text-[#1b4332] font-mono">{item.price}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-black text-stone-400 uppercase tracking-widest">Mô tả chi tiết</h4>
            <p className="text-stone-700 text-sm leading-relaxed font-sans">
              {item.description || item.snippet || item.details || "Địa điểm và dịch vụ chất lượng cao tại Mộc Châu, được kiểm duyệt kỹ lưỡng để mang lại trải nghiệm tuyệt vời nhất cho du khách."}
            </p>
          </div>

          {item.bestTime && (
            <div className="flex items-center space-x-3 text-xs text-stone-600 bg-stone-50 p-4 rounded-2xl border border-stone-200">
              <Clock className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <span className="font-extrabold text-stone-800 block">Thời điểm lý tưởng:</span>
                <span>{item.bestTime}</span>
              </div>
            </div>
          )}

          {item.tips && (
            <div className="flex items-center space-x-3 text-xs text-stone-600 bg-amber-50/60 p-4 rounded-2xl border border-amber-200">
              <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <span className="font-extrabold text-stone-800 block">Bí kíp trải nghiệm:</span>
                <span className="italic">"{item.tips}"</span>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                onClose();
                onSelectBooking();
              }}
              className="flex-1 bg-[#1b4332] hover:bg-emerald-800 text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-lg shadow-emerald-900/15"
            >
              <Compass className="w-4 h-4 text-amber-300" />
              <span>Đặt Xe Limousine Đưa Đón Tận Nơi</span>
            </button>
            
            <a
              href="tel:0971050324"
              className="px-6 py-3.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center space-x-2 transition-colors"
            >
              <Phone className="w-4 h-4 text-emerald-600" />
              <span>0971.050.324</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
