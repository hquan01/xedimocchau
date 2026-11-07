import React from "react";
import { Coffee, ShieldCheck, CreditCard, Flame, MapPin, Phone, Mail, Award } from "lucide-react";

interface FooterProps {
  setActiveTab?: (tab: string) => void;
  onSelectService?: (tab: string, subTab?: "limousine" | "shared" | "charter") => void;
  onOpenMotorbike?: () => void;
}

export default function Footer({ setActiveTab, onSelectService, onOpenMotorbike }: FooterProps) {
  return (
    <footer className="bg-[#10271e] text-emerald-50/80 pt-14 sm:pt-16 pb-9 border-t border-emerald-900" id="main_footer">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-9 sm:gap-11">
        {/* Brand Info */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <img src="/brand-xedimocchau-icon-192.png" width="44" height="44" alt="" loading="lazy" className="w-11 h-11 rounded-xl object-cover border border-emerald-100/15"/>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-tight text-white uppercase">XE ĐI MỘC CHÂU</span>
              <span className="text-[9px] font-sans text-stone-400 tracking-wider">Limousine & Combo Cao Cấp</span>
            </div>
          </div>
          <p className="text-xs text-stone-400 leading-relaxed">
            Tìm lịch xe QT Limousine, kiểm tra thông tin chuyến đi và khám phá cẩm nang du lịch Mộc Châu. Chọn dịch vụ phù hợp với nhu cầu của bạn.
          </p>
          <div className="flex items-center space-x-2 bg-stone-900 border border-stone-800 p-2.5 rounded-lg">
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
            <div className="text-[11px] leading-tight text-stone-400">
              <span className="font-bold text-stone-200 block">Kiểm tra chuyến đi trước khi đặt</span>
              Xem lịch trình, điểm đón trả và thông tin vé trong hệ thống.
            </div>
          </div>
        </div>

        {/* Popular Services */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold tracking-wide text-white uppercase border-l-2 border-emerald-500 pl-2">Dịch Vụ Nổi Bật</h4>
          <ul className="space-y-2.5 text-xs">
            <li>
              <a 
                href="#limousine" 
                onClick={(e) => {
                  e.preventDefault();
                  if (onSelectService) {
                    onSelectService("limousine", "limousine");
                  } else if (setActiveTab) {
                    setActiveTab("limousine");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
                className="hover:text-amber-400 transition-colors block"
              >
                ✦ Xe VIP Limousine khứ hồi Hà Nội - Mộc Châu
              </a>
            </li>
            <li>
              <a 
                href="#shared" 
                onClick={(e) => {
                  e.preventDefault();
                  if (onSelectService) {
                    onSelectService("limousine", "shared");
                  } else if (setActiveTab) {
                    setActiveTab("limousine");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
                className="hover:text-amber-400 transition-colors block"
              >
                ✦ Xe Ghép Đưa Đón Tận Nơi
              </a>
            </li>
            <li>
              <a 
                href="#combo" 
                onClick={(e) => {
                  e.preventDefault();
                  if (onSelectService) {
                    onSelectService("combo");
                  } else if (setActiveTab) {
                    setActiveTab("combo");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
                className="hover:text-amber-400 transition-colors block"
              >
                ✦ Combo Xe & Phòng Hà Nội - Mộc Châu
              </a>
            </li>
            <li>
              <a 
                href="#motorbike" 
                onClick={(e) => {
                  e.preventDefault();
                  if (onOpenMotorbike) {
                    onOpenMotorbike();
                  } else {
                    alert("Liên hệ QT Limousine để kiểm tra dịch vụ thuê xe máy: 0971.050.324");
                  }
                }}
                className="hover:text-amber-400 transition-colors block"
              >
                ✦ Dịch Vụ Thuê Xe Máy Giao Tận Nơi
              </a>
            </li>
            <li>
              <a 
                href="#ai" 
                onClick={(e) => {
                  e.preventDefault();
                  if (onSelectService) {
                    onSelectService("ai");
                  } else if (setActiveTab) {
                    setActiveTab("ai");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
                className="hover:text-amber-400 transition-colors block"
              >
                ✦ Thiết Kế Du Lịch Doanh Nghiệp / Team Building Bằng AI
              </a>
            </li>
          </ul>
        </div>

        {/* Booking Terms & Certs */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold tracking-wide text-white uppercase border-l-2 border-emerald-500 pl-2">Chính Sách & Thanh Toán</h4>
          <ul className="space-y-2 text-xs text-stone-400">
            <li className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Thông tin thanh toán được hiển thị theo từng đơn đặt xe.</span>
            </li>
            <li className="flex items-center space-x-2">
              <Coffee className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Điều kiện thay đổi hoặc hủy vé cần được nhà xe xác nhận theo từng chuyến.</span>
            </li>
            <li className="flex items-center space-x-2">
              <Award className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Yêu cầu đặt ghế được kiểm tra và xác nhận bởi nhà xe.</span>
            </li>
            <li className="flex items-center space-x-2">
              <Flame className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Giá, dịch vụ bao gồm và điều kiện combo được xác nhận trước khi đặt.</span>
            </li>
          </ul>
        </div>

        {/* Physical Office Address */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold tracking-wide text-white uppercase border-l-2 border-emerald-500 pl-2">Thông Tin Liên Hệ</h4>
          <ul className="space-y-2.5 text-xs text-stone-400">
            <li className="flex items-start space-x-2">
              <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><a href="https://maps.google.com/?q=Mộc+Châu,+Sơn+La" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">Thị trấn Mộc Châu, Huyện Mộc Châu, Tỉnh Sơn La</a></span>
            </li>
            <li className="flex items-start space-x-2">
              <MapPin className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
              <span className="text-stone-400">Điểm đón/trả thực tế tùy chuyến và khu vực phục vụ; vui lòng kiểm tra khi chọn vé.</span>
            </li>
            <li className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="font-mono text-white">
                <a href="tel:0971050324" className="hover:text-emerald-400 transition-colors">0971.050.324</a> - <a href="tel:0855368889" className="hover:text-emerald-400 transition-colors">0855.368.889</a>
              </span>
            </li>
            <li className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="font-mono">
                <a href="mailto:booking@xedimocchau.vn" className="hover:text-emerald-400 transition-colors">booking@xedimocchau.vn</a>
              </span>
            </li>
          </ul>
        </div>
      </div>

      <nav aria-label="Đường dẫn cẩm nang và dịch vụ xe" className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 mt-10 pt-5 border-t border-emerald-900/60">
        <p className="text-sm font-bold text-white mb-3">Xem hướng dẫn và dịch vụ chi tiết</p>
        <div className="flex flex-wrap gap-x-5 gap-y-3 text-xs">
          <a href="/dich-vu/xe-limousine-ha-noi-moc-chau" className="hover:text-amber-300 underline underline-offset-4">Xe Limousine Hà Nội – Mộc Châu</a>
          <a href="/dich-vu/xe-ghep-ha-noi-moc-chau" className="hover:text-amber-300 underline underline-offset-4">Xe ghép Hà Nội – Mộc Châu</a>
          <a href="/dich-vu/thue-xe-may-moc-chau" className="hover:text-amber-300 underline underline-offset-4">Thuê xe máy Mộc Châu</a>
          <a href="/cam-nang/kinh-nghiem-du-lich-moc-chau-tu-tuc" className="hover:text-amber-300 underline underline-offset-4">Cẩm nang Mộc Châu tự túc</a>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-9 pt-8 border-t border-stone-800">
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-[10px] text-stone-600 uppercase tracking-widest font-bold">
          <span>Xe Limousine Mộc Châu</span>
          <span>•</span>
          <span>Combo du lịch Mộc Châu</span>
          <span>•</span>
          <span>Xe ghép Hà Nội Mộc Châu</span>
          <span>•</span>
          <span>Thuê xe máy Mộc Châu</span>
          <span>•</span>
          <span>Khách sạn Mộc Châu</span>
          <span>•</span>
          <span>Xe Hà Nội Sơn La</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 text-center text-[11px] text-stone-500 space-y-2">
        <p>© 2026 QT Limousine – Xe Đi Mộc Châu.</p>
        <p>Thông tin điều hành, điều kiện đặt vé và hồ sơ doanh nghiệp: liên hệ trực tiếp QT Limousine để được xác nhận trước khi thanh toán.</p>
        <p>Nền tảng tìm chuyến xe, gửi yêu cầu dịch vụ và tham khảo cẩm nang du lịch Mộc Châu.</p>
      </div>
    </footer>
  );
}
