import React from "react";
import { Phone, MapPin, Compass, Sparkles, Ticket, CalendarDays, Menu, X, BookOpen, Bus, Shield, Award, LogOut, LogIn, Users, Search, Sun, Moon, Monitor, User as UserIcon } from "lucide-react";
import { motion } from "motion/react";
import { User } from "../types";
import {useSiteContent} from "../lib/siteContent";
import { useAppearance } from "../hooks/useAppearance";

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
  const {content:siteContent} = useSiteContent();
  // Respect custom logos uploaded in Admin; migrate only the former default.
  const isWideBrandLogo = siteContent.logoUrl === "/brand-xedimocchau-header.png" ||
    siteContent.logoUrl === "/mocchau-logo-v4.png";
  const visibleBrandLogo = isWideBrandLogo
    ? "/brand-xedimocchau-header.png"
    : siteContent.logoUrl;
  const { preference, dayPart, effective, cyclePreference } = useAppearance(activeTab);
  const appearanceLabel = preference === 'auto' ? 'Tự động' : preference === 'dark' ? 'Tối' : 'Sáng';
  const appliedLabel = effective === 'night' ? 'tối' : effective === 'afternoon' ? 'dịu chiều' : 'sáng';
  const AppearanceIcon = preference === 'auto' ? Monitor : preference === 'dark' ? Moon : Sun;
  const appearanceHelp = `Giao diện ${appearanceLabel.toLowerCase()} (hiện ${appliedLabel}). Bấm để đổi giữa Tự động, Tối và Sáng.`;

  const menuItems = [
    { id: "explore", label: "Khám Phá", icon: MapPin },
    { id: "trip", label: "Chuyến Đi", icon: Compass, badge: "AI" },
    { id: "community", label: "Cộng Đồng", icon: Users },
    { id: "services", label: "Dịch Vụ", icon: Ticket },
    ...(currentUser?.role === "operator" ? [{ id: "operator", label: "Quản Lý", icon: Shield, badge: "Ad" }] : []),
    ...(currentUser?.role === "customer" ? [{ id: "member", label: "VIP", icon: Award }] : [])
  ];

  const handleMobileSearchClick = () => {
    // Search belongs to the new Explore landing, not the legacy Limousine hero.
    setActiveTab("explore");
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.dispatchEvent(new Event("mocchau:open-ai"));
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-stone-200/80 shadow-xs" id="main_header">
      {/* Top Banner Contact bar - Slim and sleek */}
      <div className="hidden sm:block bg-[#1b4332] text-white py-2 px-4 sm:px-8 text-[11px] backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-[10px] sm:text-xs">
          <div className="flex items-center space-x-1.5 truncate">
            <MapPin className="w-3 h-3 text-rose-100 shrink-0" />
            <span className="hidden sm:inline font-sans tracking-wide">Văn phòng: Thị trấn Mộc Châu, Huyện Mộc Châu, Tỉnh Sơn La</span>
            <span className="sm:hidden font-sans text-stone-50 truncate">VP: TT. Mộc Châu, Sơn La</span>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            <span className="text-stone-50 hidden xs:inline">Hotline 24/7:</span>
            <a 
              href="tel:0971050324" 
              className="flex items-center space-x-1 text-white font-mono font-bold hover:underline active:text-white"
            >
              <Phone className="w-3 h-3 text-yellow-200 animate-pulse shrink-0" />
              <span>0971.050.324</span>
            </a>
            <span className="text-rose-200 hidden sm:inline">|</span>
            <a href="tel:0855368889" className="hover:underline hidden sm:inline font-mono text-white">
              0855.368.889
            </a>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center">
        <div className="flex justify-between w-full items-center">
          {/* Brand Logo - Mộc Châu Travel */}
          <div className="flex items-center min-w-0 pr-2 max-w-[235px] lg:max-w-[180px] xl:max-w-[250px]">
            <button 
              onClick={() => {
                setActiveTab("explore");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }} 
              className="flex items-center space-x-2 sm:space-x-2.5 cursor-pointer text-left min-w-0"
              id="logo_btn"
              aria-label="Về trang chủ Mộc Châu Travel"
            >
              {isWideBrandLogo ? (
                <img
                  src={visibleBrandLogo}
                  alt="Xe Đi Mộc Châu – QT Limousine"
                  width={520}
                  height={114}
                  className="w-[185px] sm:w-[216px] lg:w-[172px] xl:w-[224px] h-auto max-h-[58px] object-contain"
                />
              ) : (
                <>
                  <img
                    src={visibleBrandLogo}
                    alt="Logo Xe Đi Mộc Châu"
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl object-contain shadow-xs shrink-0"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="font-extrabold text-xs sm:text-base text-rose-700 tracking-tight leading-none uppercase truncate">{siteContent.siteName}</span>
                    <span className="text-[8px] sm:text-[9.5px] font-bold text-rose-500 uppercase tracking-wider mt-0.5 leading-none font-sans truncate">{siteContent.tagline}</span>
                  </div>
                </>
              )
            </button>
          </div>

          {/* Desktop Navigation - 4 clean unboxed tabs */}
          <div className="hidden lg:flex items-center space-x-1 lg:space-x-1.5">
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
                  className={`relative flex items-center space-x-1.5 px-3.5 py-2 rounded-2xl font-bold text-xs lg:text-sm transition-all cursor-pointer ${
                    isActive
                      ? "text-rose-700 bg-rose-50 shadow-2xs"
                      : "text-stone-600 hover:text-rose-700 hover:bg-rose-50"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-rose-600' : 'text-stone-400'}`} />
                  <span className="whitespace-nowrap">{item.label}</span>
                  {item.badge && (
                    <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-amber-400 text-white ml-1">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>


          {/* Right Action buttons for Desktop */}
          <div className="hidden lg:flex items-center space-x-2.5">
            <button
              type="button"
              id="appearance_desktop_btn"
              onClick={cyclePreference}
              aria-label={appearanceHelp}
              title={appearanceHelp}
              className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-bold text-stone-700 hover:border-emerald-500 transition-colors"
            >
              <AppearanceIcon className="h-4 w-4" aria-hidden="true" />
              <span>{appearanceLabel}</span>
            </button>
            <button
              id="my_bookings_btn"
              onClick={openBookingList}
              className="relative flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-stone-200 text-stone-700 hover:border-emerald-500 hover:text-[#1b4332] hover:bg-emerald-50/50 transition-all text-xs font-bold cursor-pointer"
            >
              <CalendarDays className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="whitespace-nowrap">Vé của tôi</span>
              {bookingCount > 0 && (
                <span className="min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center px-1 font-bold">
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
                      <span className="text-[9px] text-amber-800 font-extrabold block leading-none">NHÀ XE</span>
                      <span className="text-[11px] font-bold text-stone-800 block mt-0.5 leading-none">{currentUser.name.split(" ")[0]}</span>
                    </div>
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveTab("member")}
                    className="flex items-center space-x-1.5 p-1.5 bg-emerald-50 rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-colors text-left cursor-pointer"
                    title={`Thành viên: ${currentUser.name}`}
                  >
                    <div className="w-6 h-6 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                      <Award className="w-3.5 h-3.5 text-stone-100" />
                    </div>
                    <div className="text-left font-sans">
                      <span className="text-[9px] text-emerald-800 font-extrabold block leading-none">VIP</span>
                      <span className="text-[11px] font-bold text-[#1b4332] mt-0.5 block leading-none">{currentUser.points} điểm</span>
                    </div>
                  </button>
                )}
                <button
                  onClick={onSignOut}
                  className="p-2 bg-stone-50 hover:bg-red-50 text-stone-500 hover:text-red-600 border border-stone-200 rounded-lg transition-colors cursor-pointer shrink-0"
                  title="Đăng xuất"
                  id="signout_desktop_btn"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="relative flex items-center space-x-1 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-[#1b4332] hover:bg-emerald-100 font-bold text-xs cursor-pointer transition-colors shrink-0"
                id="login_desktop_btn"
              >
                <LogIn className="w-3.5 h-3.5 text-emerald-700" />
                <span className="whitespace-nowrap">Đăng nhập</span>
              </button>
            )}

            <a
              href="https://zalo.me/0971050324"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 bg-[#1b4332] text-white hover:bg-emerald-900 transition-all rounded-xl font-bold text-xs flex items-center space-x-1 shadow-xs shrink-0"
              id="advisor_btn"
            >
              <span>Zalo</span>
            </a>
          </div>

          {/* Dedicated Mobile Header Controls - Clean, uncluttered, touch-friendly */}
          <div className="flex items-center lg:hidden space-x-1 sm:space-x-1.5 shrink-0">
            {/* Quick Search Button */}
            <button
              onClick={handleMobileSearchClick}
              className="p-2 rounded-xl text-stone-600 hover:text-[#1b4332] hover:bg-stone-100 transition-colors cursor-pointer"
              aria-label="Tìm kiếm Mộc Châu"
              id="mobile_search_btn"
            >
              <Search className="w-5 h-5 text-emerald-800" />
            </button>

            {/* My Bookings / Tickets Button */}
            <button
              onClick={openBookingList}
              className="relative p-2 rounded-xl text-stone-600 hover:text-[#1b4332] hover:bg-stone-100 transition-colors cursor-pointer"
              aria-label="Vé & Phòng của tôi"
              id="my_bookings_mobile"
            >
              <CalendarDays className="w-5 h-5 text-emerald-800" />
              {bookingCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[15px] h-[15px] bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-0.5">
                  {bookingCount}
                </span>
              )}
            </button>

            {/* Mobile Account / Auth Button */}
            <button
              onClick={() => {
                if (currentUser) {
                  if (currentUser.role === "operator") {
                    setActiveTab("operator");
                  } else {
                    setActiveTab("member");
                  }
                } else {
                  onOpenAuth();
                }
              }}
              className="p-2 rounded-xl text-stone-600 hover:text-[#1b4332] hover:bg-stone-100 transition-colors cursor-pointer relative"
              aria-label="Tài khoản khách hàng"
              id="mobile_account_btn"
            >
              <UserIcon className="w-5 h-5 text-emerald-800" />
              {currentUser && (
                <span className="absolute bottom-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full border border-white" />
              )}
            </button>

            {/* Mobile Menu Dropdown Toggle */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl text-stone-700 hover:bg-stone-100 cursor-pointer"
              aria-label="Mở menu tùy chọn"
              id="mobile_menu_trigger"
            >
              {isOpen ? <X className="w-5.5 h-5.5 text-stone-900" /> : <Menu className="w-5.5 h-5.5 text-stone-900" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Dropdown Drawer */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="lg:hidden border-t border-stone-200 bg-white px-4 py-4 space-y-3 shadow-xl"
          id="mobile_menu_panel"
        >
          {/* User Account Bar in Mobile Drawer */}
          {currentUser ? (
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between" id="header_auth_user_wrapper_mobile">
              <button
                onClick={() => {
                  if (currentUser.role === "operator") {
                    setActiveTab("operator");
                  } else {
                    setActiveTab("member");
                  }
                  setIsOpen(false);
                }}
                className="flex items-center space-x-2.5 text-left flex-1"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 ${currentUser.role === 'operator' ? 'bg-amber-500' : 'bg-[#1b4332]'}`}>
                  {currentUser.role === 'operator' ? <Shield className="w-4.5 h-4.5" /> : <Award className="w-4.5 h-4.5" />}
                </div>
                <div className="text-left min-w-0">
                  <p className="text-xs font-black text-stone-900 leading-tight truncate">{currentUser.name}</p>
                  <p className="text-[10px] text-stone-500 mt-0.5 leading-none">
                    {currentUser.role === 'operator' ? "Quản trị viên nhà xe" : `${currentUser.points} điểm tích lũy`}
                  </p>
                </div>
              </button>
              <button
                onClick={() => {
                  onSignOut();
                  setIsOpen(false);
                }}
                className="p-2 border border-stone-200 rounded-xl text-stone-500 hover:text-red-500 bg-white ml-2 shrink-0 cursor-pointer"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                onOpenAuth();
                setIsOpen(false);
              }}
              className="w-full py-2.5 bg-emerald-50 text-[#1b4332] border border-emerald-200 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
              id="login_mobile_btn"
            >
              <LogIn className="w-4 h-4 text-emerald-700" />
              <span>Đăng nhập thành viên / Quản trị</span>
            </button>
          )}

          {/* Keep the mobile header uncluttered: appearance control lives in the menu. */}
          <button
            type="button"
            id="appearance_mobile_btn"
            onClick={cyclePreference}
            aria-label={appearanceHelp}
            title={appearanceHelp}
            className="flex w-full items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-left text-xs font-bold text-stone-700"
          >
            <AppearanceIcon className="h-5 w-5 text-emerald-700" aria-hidden="true" />
            <span className="flex-1">Giao diện: {appearanceLabel}</span>
            <span className="text-[10px] font-medium text-stone-500">Đang {appliedLabel} · Chạm để đổi</span>
          </button>

          {/* Quick Action Grid */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <a
              href="tel:0971050324"
              className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-[#1b4332] text-white font-bold text-xs shadow-xs active:bg-emerald-900"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Gọi 0971.050.324</span>
            </a>
            <a
              href="https://zalo.me/0971050324"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-[#0068ff] text-white font-bold text-xs shadow-xs active:bg-blue-700"
            >
              <span>Nhắn Zalo QT</span>
            </a>
          </div>

          {/* Navigation Links in Mobile Drawer */}
          <div className="space-y-1 pt-2 border-t border-stone-100">
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
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left font-bold text-xs transition-all ${
                    isActive
                      ? "text-[#1b4332] bg-emerald-50"
                      : "text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700' : 'text-stone-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] font-extrabold bg-amber-500 text-white px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>
      )}
    </header>
  );
}
