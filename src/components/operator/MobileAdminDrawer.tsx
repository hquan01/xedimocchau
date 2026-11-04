import React, { useState } from "react";
import { 
  X, Search, ShieldCheck, Bus, Lock, Clock, Banknote, UserCheck, MapPin, 
  User, Tag, FileText, Compass, Star, DollarSign, CalendarDays, Newspaper, 
  MessageSquare, Award, Layers, TrendingUp, Shield, ChevronDown, ChevronRight 
} from "lucide-react";
import { ADMIN_NAV_GROUPS, AdminModuleItem } from "./AdminNavStructure";

interface MobileAdminDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeModuleId: string;
  onSelectModule: (moduleId: string) => void;
  pendingBookingsCount: number;
}

export default function MobileAdminDrawer({
  isOpen,
  onClose,
  activeModuleId,
  onSelectModule,
  pendingBookingsCount
}: MobileAdminDrawerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    ops_transport: true,
    travel_ecosystem: true,
    content_community: false,
    tech_live_data: false,
    partners_finance: false
  });

  if (!isOpen) return null;

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const renderIcon = (iconName: string, className = "w-5 h-5") => {
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

  const handleSelect = (moduleId: string) => {
    onSelectModule(moduleId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex text-left" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer panel */}
      <div className="relative w-full max-w-xs bg-stone-900 text-stone-200 flex flex-col h-full shadow-2xl z-10">
        {/* Header */}
        <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-950/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1b4332] flex items-center justify-center text-white border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
            </div>
            <div>
              <span className="font-black text-sm text-white block">Quản Trị Mộc Châu</span>
              <span className="text-[10px] text-stone-400 block font-mono">16 Phân hệ vận hành</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white rounded-xl hover:bg-stone-800 transition-colors cursor-pointer"
            title="Đóng menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-stone-800/80">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm phân hệ (vé xe, hoa, khóa ghế...)"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-stone-800 border border-stone-700 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
          {filteredGroups.map(group => {
            const isExpanded = term ? true : (expandedGroups[group.id] ?? true);

            return (
              <div key={group.id} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between py-2 px-2 text-xs font-black uppercase tracking-wider text-stone-400 hover:text-stone-200 transition-colors"
                >
                  <span>{group.title}</span>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-stone-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-stone-500" />
                  )}
                </button>

                {isExpanded && (
                  <div className="space-y-1 pl-1">
                    {group.modules.map(module => {
                      const isActive = activeModuleId === module.id;
                      const hasPending = module.id === "limousine_bookings" && pendingBookingsCount > 0;

                      return (
                        <button
                          key={module.id}
                          type="button"
                          onClick={() => handleSelect(module.id)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[44px] cursor-pointer ${
                            isActive
                              ? "bg-[#1b4332] text-white shadow-md"
                              : "text-stone-300 hover:bg-stone-800 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center space-x-3 truncate">
                            <span className={isActive ? "text-emerald-300" : "text-stone-400"}>
                              {renderIcon(module.icon)}
                            </span>
                            <span className="truncate">{module.name}</span>
                          </div>

                          {hasPending && (
                            <span className="ml-2 px-2 py-0.5 bg-amber-500 text-stone-950 text-[10px] font-black rounded-full">
                              {pendingBookingsCount}
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

        {/* Mobile footer */}
        <div className="p-3 border-t border-stone-800 text-[11px] text-stone-400 flex justify-between items-center bg-stone-950/80">
          <span>● Đang kết nối Firestore</span>
          <span className="font-mono text-emerald-400 font-bold">PIN: 2025</span>
        </div>
      </div>
    </div>
  );
}
