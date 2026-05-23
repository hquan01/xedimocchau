import React, { useState, useEffect } from "react";
import { Bell, X, Check, Calendar, Clock, User, ArrowRight, Settings } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AppNotification } from "../types";

interface NotificationCenterProps {
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  onRequestPermission?: () => void;
}

export default function NotificationCenter({ notifications, onMarkAsRead, onClearAll, onRequestPermission }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const [permissionState, setPermissionState] = useState<string>("default");

  useEffect(() => {
    if ("Notification" in window) {
      setPermissionState(Notification.permission);
    }
  }, []);

  const handleRequestPermission = () => {
    if (onRequestPermission) onRequestPermission();
    // Small delay to let the browser state update
    setTimeout(() => {
      if ("Notification" in window) setPermissionState(Notification.permission);
    }, 1000);
  };

  const formatTimestamp = (iso: string) => {
    const d = new Date(iso);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} - ${d.getDate()}/${d.getMonth() + 1}`;
  };

  return (
    <div className="fixed bottom-6 right-4 sm:bottom-8 sm:right-8 z-[100]" id="notification_center_root">
      {/* Badge Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-3.5 sm:p-4 rounded-full shadow-2xl transition-all cursor-pointer group active:scale-90 ${
          isOpen ? 'bg-stone-900 text-white' : 'bg-[#1b4332] text-white hover:scale-110'
        }`}
      >
        <Bell className={`w-5 h-5 sm:w-6 sm:h-6 ${unreadCount > 0 && !isOpen ? 'animate-bounce' : ''}`} />
        {unreadCount > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white animate-pulse shadow-lg">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-stone-900/10 backdrop-blur-[2px] z-[-1]"
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95, transformOrigin: 'bottom right' }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="absolute bottom-20 right-0 w-[90vw] max-w-[400px] bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col"
            >
              <div className="bg-stone-50 px-6 py-5 border-b border-stone-100 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-black text-stone-900 uppercase tracking-tighter">Thông báo mới</h3>
                  <p className="text-[10px] text-stone-500 font-bold">Quản lý các lượt đặt vé gần nhất</p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleRequestPermission}
                    title="Cài đặt thông báo điện thoại"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                      permissionState === "granted" 
                        ? "bg-stone-100 text-stone-400 cursor-not-allowed" 
                        : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 active:scale-95"
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase">Cài đặt</span>
                  </button>
                  {unreadCount > 0 && (
                    <button 
                      onClick={onClearAll}
                      className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-wider cursor-pointer"
                    >
                      Đánh dấu tất cả
                    </button>
                  )}
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 hover:bg-stone-200 rounded-full transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4 text-stone-400" />
                  </button>
                </div>
              </div>

              <div className="max-h-[60vh] overflow-y-auto overflow-x-hidden">
                {notifications.length === 0 ? (
                  <div className="p-12 text-center text-stone-300">
                    <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-xs font-bold uppercase tracking-widest text-stone-400">Không có thông báo nào</p>
                  </div>
                ) : (
                  <div className="divide-y divide-stone-100">
                    {notifications.map((n) => (
                      <div 
                        key={n.id}
                        onClick={() => onMarkAsRead(n.id)}
                        className={`p-4 transition-all cursor-pointer hover:bg-stone-50 relative group ${!n.isRead ? 'bg-emerald-50/30' : ''}`}
                      >
                        {!n.isRead && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-600" />}
                        <div className="flex gap-3">
                          <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${
                            n.type === 'booking_new' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-600'
                          }`}>
                            {n.type === 'booking_new' ? <Calendar className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <h4 className={`text-xs uppercase tracking-tight truncate pr-4 ${!n.isRead ? 'font-black text-stone-900' : 'font-bold text-stone-500'}`}>
                                {n.title}
                              </h4>
                              <span className="text-[9px] text-stone-400 font-bold whitespace-nowrap">{formatTimestamp(n.timestamp)}</span>
                            </div>
                            <p className="text-xs text-stone-600 mt-1 line-clamp-2 leading-relaxed">
                              {n.message}
                            </p>
                            {n.metadata?.customerName && (
                              <div className="flex items-center gap-3 mt-2">
                                <div className="flex items-center gap-1 text-[10px] text-stone-400 font-bold uppercase">
                                  <User className="w-3 h-3" />
                                  {n.metadata.customerName}
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-black uppercase">
                                  <ArrowRight className="w-3 h-3" />
                                  Mới đặt
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-stone-50 px-6 py-4 border-t border-stone-100 text-center">
                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Trung tâm vận hành Xe Đi Mộc Châu</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
