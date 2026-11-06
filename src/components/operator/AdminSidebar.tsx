import React, { useState } from "react";
import { 
  Bus, Lock, Clock, Banknote, UserCheck, MapPin, User, Tag, FileText, 
  Compass, Star, DollarSign, CalendarDays, Newspaper, MessageSquare, 
  Award, Layers, TrendingUp, Shield, ChevronDown, ChevronRight, Search, ShieldCheck 
} from "lucide-react";
import { ADMIN_NAV_GROUPS, AdminModuleItem } from "./AdminNavStructure";

interface AdminSidebarProps {
  activeModuleId: string;
  onSelectModule: (moduleId: string) => void;
  pendingBookingsCount: number;
  pendingServiceOrdersCount: number;
}

export default function AdminSidebar({
  activeModuleId,
  onSelectModule,
  pendingBookingsCount,
  pendingServiceOrdersCount
}: AdminSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    ops_transport: true,
    travel_ecosystem: true,
    content_community: true,
    tech_live_data: true,
    partners_finance: true
  });

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const renderIcon = (iconName: string, className = "w-4 h-4") => {
    switch (iconName) {
      case "Bus": return <Bus className={className} />;
      case "Lock": return <Lock className={className} />;
      case "Clock": return <Clock className={className} />;
      case "Banknote": return <Banknote className={className} />;
      case "UserCheck": return <UserCheck className={className} />;
      case "MapPin": return <MapPin className={className} />;
      case "User": return <User className={className} />;
      case "Tag": return <Tag className={className} />;
      case "FileText": return <FileText className={className} />;
      case "Compass": return <Compass className={className} />;
      case "Star": return <Star className={className} />;
      case "DollarSign": return <DollarSign className={className} />;
      case "CalendarDays": return <CalendarDays className={className} />;
      case "Newspaper": return <Newspaper className={className} />;
      case "MessageSquare": return <MessageSquare className={className} />;
      case "Award": return <Award className={className} />;
      case "Layers": return <Layers className={className} />;
      case "TrendingUp": return <TrendingUp className={className} />;
      case "Shield": return <Shield className={className} />;
      default: return <Compass className={className} />;
    }
  };

  // Filter groups and modules based on search term
  const term = searchTerm.toLowerCase().trim();
  const filteredGroups = ADMIN_NAV_GROUPS.map(group => {
    const matchedModules = group.modules.filter(m => {
      if (!term) return true;
      return (
        m.name.toLowerCase().includes(term) ||
        m.shortName.toLowerCase().includes(term) ||
        m.keywords.some(k => k.includes(term))
      );
    });
    return {
      ...group,
      modules: matchedModules
    };
  }).filter(group => group.modules.length > 0);

  return (
    <aside className="w-64 bg-stone-900 text-stone-200 flex flex-col h-full border-r border-stone-800 select-none shrink-0 text-left">
      {/* Brand Header */}
      <div className="p-4 border-b border-stone-800/80 bg-stone-950/40">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-[#1b4332] flex items-center justify-center text-white shadow-md border border-emerald-500/30 shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-200" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="font-black text-sm text-white tracking-tight">Mộc Châu Travel</span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.2 rounded border border-emerald-400/30">2.0</span>
            </div>
            <p className="text-[10px] text-stone-400 truncate">Trung Tâm Điều Hành & Vận Tải</p>
          </div>
        </div>

        {/* Quick Search Input */}
        <div className="mt-3 relative">
          <Search className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm nhanh phân hệ..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1.5 bg-stone-800/80 hover:bg-stone-800 border border-stone-700/60 focus:border-emerald-500 rounded-lg text-xs text-white placeholder-stone-500 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4 custom-scrollbar">
        {filteredGroups.map(group => {
          const isExpanded = term ? true : (expandedGroups[group.id] ?? true);

          return (
            <div key={group.id} className="space-y-1">
              {/* Group Header Button */}
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] font-black uppercase tracking-wider text-stone-400 hover:text-stone-200 transition-colors cursor-pointer rounded-lg hover:bg-stone-800/40"
              >
                <div className="flex items-center space-x-1.5 truncate">
                  <span className="truncate">{group.title}</span>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                )}
              </button>

              {/* Modules list under group */}
              {isExpanded && (
                <div className="space-y-0.5 pl-1">
                  {group.modules.map(module => {
                    const isActive = activeModuleId === module.id;
                    const badgeCount = module.id === "limousine_bookings" ? pendingBookingsCount : (module.id === "service_orders" ? pendingServiceOrdersCount : 0);
                    const hasPendingBadge = badgeCount > 0;

                    return (
                      <button
                        key={module.id}
                        type="button"
                        onClick={() => onSelectModule(module.id)}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isActive
                            ? "bg-[#1b4332] text-white shadow-md font-bold"
                            : "text-stone-300 hover:bg-stone-800 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 truncate">
                          <span className={`${isActive ? "text-emerald-300" : "text-stone-400"}`}>
                            {renderIcon(module.icon, "w-4 h-4 shrink-0")}
                          </span>
                          <span className="truncate">{module.name}</span>
                        </div>

                        {hasPendingBadge && (
                          <span className="ml-1.5 px-1.5 py-0.5 bg-amber-500 text-stone-950 text-[10px] font-black rounded-full animate-pulse shrink-0">
                            {badgeCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-stone-800 bg-stone-950/60 text-[11px] text-stone-400 flex items-center justify-between font-sans">
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-stone-300">Live Sync</span>
        </div>
        <span className="text-[10px] text-stone-500">v2.0 • Admin</span>
      </div>
    </aside>
  );
}
