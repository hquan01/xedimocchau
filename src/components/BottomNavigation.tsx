import React from "react";
import { Compass, Car, Users, LayoutGrid, CalendarDays } from "lucide-react";

interface BottomNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openBookingList: () => void;
  bookingCount: number;
}

export default function BottomNavigation({
  activeTab,
  setActiveTab,
  openBookingList,
  bookingCount
}: BottomNavigationProps) {
  // Determine if a category is currently active
  const isCategoryActive = activeTab.startsWith("cat:");
  
  // Navigation tabs configuration
  const navTabs = [
    {
      id: "explore",
      label: "Khám phá",
      icon: Compass,
      isActive: activeTab === "explore" || activeTab === "explore_around" || activeTab === "moc_chau_today",
      onClick: () => {
        setActiveTab("explore");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    {
      id: "trip",
      label: "Chuyến đi",
      icon: Car,
      isActive: activeTab === "trip" || activeTab === "limousine" || activeTab === "combo" || activeTab === "trip_prep" || activeTab === "ai",
      onClick: () => {
        setActiveTab("trip");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    {
      id: "community",
      label: "Cộng đồng",
      icon: Users,
      isActive: activeTab === "community",
      onClick: () => {
        setActiveTab("community");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    {
      id: "services",
      label: "Dịch vụ",
      icon: LayoutGrid,
      isActive: activeTab === "services" || isCategoryActive,
      onClick: () => {
        setActiveTab("services");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  ];

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden bg-white/95 backdrop-blur-md border-t border-emerald-100 shadow-2xl px-2 pb-[env(safe-area-inset-bottom,12px)] pt-1.5"
      id="mobile_bottom_nav"
      role="navigation"
      aria-label="Thanh điều hướng dưới điện thoại"
    >
      <div className="grid grid-cols-4 items-center justify-around h-14 max-w-md mx-auto">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.isActive;
          return (
            <button
              key={tab.id}
              onClick={tab.onClick}
              className={`flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] py-1 px-1 rounded-xl transition-all select-none cursor-pointer ${
                active 
                  ? "text-emerald-700" 
                  : "text-stone-400 hover:text-emerald-600"
              }`}
              id={`bottom_nav_${tab.id}`}
              aria-current={active ? "page" : undefined}
            >
              <div className="relative">
                <Icon 
                  className={`w-5 h-5 transition-transform ${
                    active ? "scale-110 text-emerald-700 stroke-[2.4]" : "stroke-[1.8]"
                  }`} 
                />
                {tab.id === "trip" && bookingCount > 0 && (
                  <span className="absolute -top-1 -right-2.5 min-w-[14px] h-[14px] bg-emerald-600 text-white text-[9px] font-black rounded-full flex items-center justify-center px-0.5">
                    {bookingCount}
                  </span>
                )}
              </div>
              <span 
                className={`text-[10px] mt-1 tracking-tight leading-none whitespace-nowrap ${
                  active ? "font-extrabold text-emerald-700" : "font-semibold"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
