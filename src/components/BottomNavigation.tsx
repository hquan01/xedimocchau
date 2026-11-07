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
      className="fixed bottom-0 left-0 right-0 z-50 flex xl:hidden bg-white/95 backdrop-blur-xl border-t border-emerald-100 shadow-[0_-7px_24px_rgba(17,55,38,.10)] px-2 pt-1.5 pb-[max(8px,env(safe-area-inset-bottom))]"
      id="mobile_bottom_nav"
      role="navigation"
      aria-label="Thanh điều hướng dưới điện thoại"
    >
      <div className="grid grid-cols-4 items-center gap-1.5 min-h-[68px] max-w-xl mx-auto w-full">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.isActive;
          return (
            <button
              key={tab.id}
              onClick={tab.onClick}
              className={`flex flex-col gap-1 items-center justify-center min-h-[68px] min-w-0 px-0.5 rounded-[18px] transition-[transform,background-color,color] select-none cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-600 ${
                active 
                  ? "text-emerald-900 bg-emerald-100/75 border border-emerald-200 shadow-sm" 
                  : "text-stone-700 hover:text-emerald-700 hover:bg-emerald-50"
              }`}
              id={`bottom_nav_${tab.id}`}
              aria-current={active ? "page" : undefined}
            >
              <div className="relative">
                <Icon 
                  className={`w-7 h-7 transition-transform ${
                    active ? "scale-105 text-emerald-800 stroke-[2.5]" : "stroke-[2] text-stone-600"
                  }`} 
                />
                {tab.id === "trip" && bookingCount > 0 && (
                  <span className="absolute -top-1 -right-2.5 min-w-[18px] h-[18px] bg-emerald-600 text-white text-[10px] font-black rounded-full flex items-center justify-center px-0.5">
                    {bookingCount}
                  </span>
                )}
              </div>
              <span 
                className={`text-[12px] sm:text-[13px] tracking-normal leading-tight whitespace-nowrap ${
                  active ? "font-black text-emerald-800" : "font-bold text-stone-600"
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
