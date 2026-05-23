import React from "react";
import { Phone, MapPin, Compass, Sparkles, Ticket, CalendarDays, Menu, X, BookOpen, Bus, Shield, Award, LogOut, LogIn } from "lucide-react";
import { motion } from "motion/react";
import { User } from "../types";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  bookingCount: number;
  openBookingList: () => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
}

export default function Header({
  activeTab,
  setActiveTab,
  bookingCount,
  openBookingList,
  currentUser,
  onOpenAuth,
  onSignOut
}: HeaderProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const menuItems = [
    { id: "limousine", label: "Đặt Xe", icon: Compass },
    { id: "combo", label: "Combo Xe + Phòng", icon: Ticket },
    { id: "explore", label: "Khám Phá Mộc Châu", icon: MapPin },
    { id: "guide", label: "Cẩm Nang Du Lịch", icon: BookOpen },
    { id: "ai", label: "AI Lên Lịch Trình", icon: Sparkles, badge: "Hot" },
    ...(currentUser?.role === "operator" ? [{ id: "operator", label: "Quản Lý Nhà Xe", icon: Shield, badge: "Ad" }] : []),
    ...(currentUser?.role === "customer" ? [{ id: "member", label: "Thành Viên VIP", icon: Award }] : [])
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-stone-100 shadow-sm" id="main_header">
      {/* Top Banner Contact bar */}
      <div className="bg-[#1b4332] text-stone-100 text-xs py-2 px-4 flex justify-between items-center max-w-7xl mx-auto rounded-b-md sm:px-6 lg:px-8">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline font-sans text-[11px] tracking-wide">Văn phòng: Thị trấn Mộc Châu, Huyện Mộc Châu, Tỉnh Sơn La</span>
            <span className="sm:hidden font-sans text-[11px]">VP: Mộc Châu, Sơn La</span>
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1 font-mono font-medium hover:text-emerald-300 transition-colors text-[11px] sm:text-xs">
            <Phone className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" />
            <a href="tel:0971050324" className="hover:underline">0971.050.324</a>
            <span className="mx-1 text-stone-500">|</span>
            <a href="tel:0855368889" className="hover:underline">0855.368.889</a>
          </span>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand Logo - Xe Đi Mộc Châu */}
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setActiveTab("limousine")} 
              className="flex items-center space-x-2 cursor-pointer pb-1"
              id="logo_btn"
            >
              <img 
                src="/logo.png" 
                alt="Xe Đi Mộc Châu Logo" 
                className="w-10 h-10 rounded-xl object-contain shadow-md shadow-emerald-900/10"
              />
              <div className="flex flex-col text-left">
                <span className="font-extrabold text-base sm:text-lg text-[#1b4332] tracking-normal leading-none uppercase">
                  Xe Đi Mộc Châu
                </span>
                <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5 leading-none font-sans">
                  Limousine & Combo Cao Cấp
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav_tab_${item.id}`}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsOpen(false);
                  }}
                  className={`relative flex items-center space-x-1.5 px-4 py-2 rounded-lg font-medium text-sm transition-all cursor-pointer ${
                    isActive
                      ? "text-[#1b4332] bg-emerald-50"
                      : "text-stone-600 hover:text-[#1b4332] hover:bg-stone-50"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-stone-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="absolute -top-1 right-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500 text-white animate-bounce">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Action buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <button
              id="my_bookings_btn"
              onClick={openBookingList}
              className="relative flex items-center space-x-2 px-3.5 py-1.5 rounded-lg border border-stone-200 text-stone-700 hover:border-emerald-500 hover:text-[#1b4332] hover:bg-emerald-50/50 transition-all text-sm font-medium cursor-pointer"
            >
              <CalendarDays className="w-4 h-4 text-emerald-600" />
              <span>Vé & Phòng của tôi</span>
              {bookingCount > 0 && (
                <span className="absolute -top-2 -right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center px-1 font-bold">
                  {bookingCount}
                </span>
              )}
            </button>

            {currentUser ? (
              <div className="flex items-center space-x-2" id="header_auth_user_wrapper">
                {currentUser.role === "operator" ? (
                  <button
                    onClick={() => setActiveTab("operator")}
                    className="flex items-center space-x-1.5 p-1.5 bg-amber-50 rounded-xl border border-amber-200 hover:bg-amber-100 transition-colors text-left"
                    title="Bấm để vào Bảng quản trị nhà xe"
                  >
                    <div className="w-6 h-6 rounded-lg bg-amber-500 flex items-center justify-center text-white">
                      <Shield className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-left font-sans">
                      <span className="text-[10px] text-amber-800 font-extrabold block leading-none">NHÀ XE</span>
                      <span className="text-[11px] font-bold text-stone-800 block mt-0.5 leading-none">{currentUser.name.split(" ")[0]} ⚙️</span>
                    </div>
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveTab("member")}
                    className="flex items-center space-x-1.5 p-1.5 bg-emerald-50 rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-colors text-left cursor-pointer"
                    title={`Thành viên: ${currentUser.name} - Bấm để vào Trang cá nhân VIP`}
                  >
                    <div className="w-6 h-6 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                      <Award className="w-3.5 h-3.5 text-stone-100" />
                    </div>
                    <div className="text-left font-sans">
                      <span className="text-[10px] text-emerald-800 font-extrabold block leading-none">TÍCH ĐIỂM VÉ</span>
                      <span className="text-[11px] font-bold text-[#1b4332] mt-0.5 block leading-none">{currentUser.points} điểm ({ (currentUser.points * 1000).toLocaleString() }đ)</span>
                    </div>
                  </button>
                )}
                <button
                  onClick={onSignOut}
                  className="p-2 bg-stone-50 hover:bg-red-50 text-stone-500 hover:text-red-600 border border-stone-200 hover:border-red-200 rounded-lg transition-colors cursor-pointer shrink-0"
                  title="Đăng xuất tài khoản"
                  id="signout_desktop_btn"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="relative flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-50/50 border border-emerald-200 text-[#1b4332] hover:bg-emerald-100 font-bold text-xs cursor-pointer shadow-xs transition-colors shrink-0"
                id="login_desktop_btn"
              >
                <LogIn className="w-4 h-4 text-emerald-600" />
                <span>Đăng nhập</span>
              </button>
            )}

            <a
              href="https://zalo.me/0971050324"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-[#1b4332] text-white hover:from-emerald-700 hover:to-[#122e22] hover:scale-[1.03] active:scale-95 transition-all rounded-lg font-semibold shadow-md shadow-emerald-800/15 text-sm flex items-center space-x-1"
              id="advisor_btn"
            >
              <span>Zalo</span>
            </a>
          </div>

          {/* Mobile menu toggle */}
          <div className="flex items-center md:hidden space-x-2">
            <button
              onClick={openBookingList}
              className="relative p-2 rounded-lg text-stone-600 hover:bg-stone-50"
              id="my_bookings_mobile"
            >
              <CalendarDays className="w-5.5 h-5.5" />
              {bookingCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-[16px] bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center px-1 font-bold">
                  {bookingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-stone-600 hover:bg-stone-50 hover:text-stone-900 cursor-pointer"
              aria-label="Toggle Menu"
              id="mobile_menu_trigger"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden border-t border-stone-100 bg-white px-4 py-4 space-y-2 shadow-inner"
          id="mobile_menu_panel"
        >
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left font-medium text-sm transition-all ${
                  isActive
                    ? "text-[#1b4332] bg-emerald-50 font-semibold"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-50"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#1b4332]' : 'text-stone-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500 text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-4 border-t border-stone-100 space-y-3">
            {currentUser ? (
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between" id="header_auth_user_wrapper_mobile">
                <button
                  onClick={() => {
                    if (currentUser.role === "operator") {
                      setActiveTab("operator");
                    } else {
                      setActiveTab("member");
                    }
                    setIsOpen(false);
                  }}
                  className="flex items-center space-x-2 text-left flex-1"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 ${currentUser.role === 'operator' ? 'bg-amber-500' : 'bg-[#1b4332]'}`}>
                    {currentUser.role === 'operator' ? <Shield className="w-4 h-4" /> : <Award className="w-4 h-4" />}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-black text-stone-850 leading-none">{currentUser.name}</p>
                    <p className="text-[10px] text-stone-500 mt-1.5 leading-none">
                      {currentUser.role === 'operator' ? "Nhà xe điều hành" : `${currentUser.points} điểm tích lũy (${(currentUser.points * 1000).toLocaleString()}đ)`}
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    onSignOut();
                    setIsOpen(false);
                  }}
                  className="p-2 border border-stone-200 rounded-lg text-stone-500 hover:text-red-500 bg-white ml-2 shrink-0"
                >
                  <LogOut className="w-4.5 h-4.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  onOpenAuth();
                  setIsOpen(false);
                }}
                className="w-full py-2.5 bg-emerald-50 text-[#1b4332] border border-emerald-200 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5"
                id="login_mobile_btn"
              >
                <LogIn className="w-4.5 h-4.5 text-emerald-600" />
                <span>Đăng nhập thành viên</span>
              </button>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  openBookingList();
                  setIsOpen(false);
                }}
                className="flex items-center justify-center space-x-2 px-3 py-2.5 rounded-lg border border-stone-200 text-stone-700 bg-stone-50 font-semibold text-xs"
              >
                <CalendarDays className="w-4 h-4 text-emerald-600" />
                <span>Yêu cầu đặt ({bookingCount})</span>
              </button>

              <a
                href="tel:0971050324"
                className="flex items-center justify-center space-x-2 px-3 py-2.5 rounded-lg bg-[#1b4332] text-white font-semibold text-xs shadow-sm active:bg-emerald-800 transition-colors"
              >
                <Phone className="w-4 h-4 text-emerald-400" />
                <span>Gọi tư vấn</span>
              </a>
            </div>
          </div>
        </motion.div>
      )}
    </header>
  );
}
