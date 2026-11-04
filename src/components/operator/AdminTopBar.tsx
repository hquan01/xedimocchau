import React from "react";
import { Menu, RefreshCw, Bell, Shield, Lock, ExternalLink } from "lucide-react";
import { ALL_ADMIN_MODULES, ADMIN_NAV_GROUPS } from "./AdminNavStructure";

interface AdminTopBarProps {
  activeModuleId: string;
  onOpenMobileDrawer: () => void;
  pendingBookingsCount: number;
  onRefresh?: () => void;
  onSelectModule?: (moduleId: string) => void;
}

export default function AdminTopBar({
  activeModuleId,
  onOpenMobileDrawer,
  pendingBookingsCount,
  onRefresh,
  onSelectModule
}: AdminTopBarProps) {
  const currentModule = ALL_ADMIN_MODULES.find(m => m.id === activeModuleId) || ALL_ADMIN_MODULES[0];
  const currentGroup = ADMIN_NAV_GROUPS.find(g => g.id === currentModule.group);

  return (
    <header className="bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-2xs text-left">
      {/* Left: Mobile hamburger + Breadcrumbs */}
      <div className="flex items-center space-x-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileDrawer}
          className="md:hidden p-2 text-stone-700 hover:text-emerald-800 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
          title="Mở menu quản trị"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="hidden sm:flex items-center space-x-1.5 text-[11px] text-stone-400 font-sans truncate">
            <span>Mộc Châu Travel 2.0</span>
            <span>/</span>
            <span className="text-stone-600 font-semibold truncate">{currentGroup?.title.replace(/^\d+\.\s*/, "")}</span>
            <span>/</span>
            <span className="text-emerald-800 font-bold truncate">{currentModule.name}</span>
          </div>
          <h2 className="text-sm sm:text-base font-black text-stone-900 tracking-tight truncate">
            {currentModule.name}
          </h2>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center space-x-2 shrink-0">
        {pendingBookingsCount > 0 && onSelectModule && (
          <button
            onClick={() => onSelectModule("limousine_bookings")}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            title="Đơn đặt xe mới cần gọi điện xác nhận"
          >
            <Bell className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
            <span className="hidden sm:inline">Chờ xử lý:</span>
            <span className="font-mono">{pendingBookingsCount}</span>
          </button>
        )}

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="p-2 text-stone-600 hover:text-emerald-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
            title="Làm mới dữ liệu từ máy chủ"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        <div className="hidden sm:flex items-center space-x-1 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold font-mono">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span>Admin PIN: 2025</span>
        </div>
      </div>
    </header>
  );
}
