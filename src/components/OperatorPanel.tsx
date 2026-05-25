import React, { useState, useEffect } from "react";
import { BlockedSeat, Booking, Seat, LimousineTrip, TourCombo, LimousineConfig, SharedCarConfig, Coupon, LocationPoint, Accommodation, Destination, GuideArticle, User as UserType, AppNotification } from "../types";
import { Check, X, Shield, Calendar, Clock, ArrowRight, User, Phone, Tag, Trash2, ListFilter, Search, Award, Lock, Unlock, Compass, ShieldCheck, Newspaper, MapPin } from "lucide-react";
import { motion } from "motion/react";
import { getOfficialSchedulesForRoute } from "./LimousineBooking";
import { getSharedCarSchedules } from "./SharedCarBooking";
import ComboManagement from "./operator/ComboManagement";
import PricingManagement from "./operator/PricingManagement";
import CouponManagement from "./operator/CouponManagement";
import LocationManagement from "./operator/LocationManagement";
import AccommodationComboManagement from "./operator/AccommodationComboManagement";
import DestinationManagement from "./operator/DestinationManagement";
import ArticleManagement from "./operator/ArticleManagement";
import ScheduleManagement from "./operator/ScheduleManagement";
import ReviewManagement from "./operator/ReviewManagement";

interface OperatorPanelProps {
  users: UserType[];
  bookings: Booking[];
  onUpdateBookingStatus: (bookingId: string, status: "pending" | "success" | "completed" | "cancelled") => void;
  onDeleteBooking: (bookingId: string) => void;
  onBulkDeleteBookings: (bookingIds: string[]) => void;
  blockedSeats: BlockedSeat[];
  onToggleBlockedSeat: (seatId: string, travelDate: string, tripId: string, customerPhone?: string) => void;
  onRemoveBlockedSeat: (seat: BlockedSeat) => void;
  combos: TourCombo[];
  onUpdateCombos: (updated: TourCombo[]) => void;
  limousineConfig: LimousineConfig;
  onUpdateLimousineConfig: (updated: LimousineConfig) => void;
  sharedCarConfig: SharedCarConfig;
  onUpdateSharedCarConfig: (updated: SharedCarConfig) => void;
  coupons: Coupon[];
  onUpdateCoupons: (updated: Coupon[]) => void;
  locations: LocationPoint[];
  onUpdateLocations: (updated: LocationPoint[]) => void;
  accommodations: Accommodation[];
  onUpdateAccommodations: (updated: Accommodation[]) => void;
  destinations: Destination[];
  onUpdateDestinations: (updated: Destination[]) => void;
  articles: GuideArticle[];
  onUpdateArticles: (updated: GuideArticle[]) => void;
  notifications: AppNotification[];
  onUpdateNotifications: (updated: AppNotification[]) => void;
  onSendNotification: (title: string, message: string) => void;
}

const INITIAL_SEATS_TEMPLATE: Seat[] = [
  { id: "s1", number: "A1", type: "front", price: 300000, isBooked: false },
  { id: "s2", number: "A2", type: "front", price: 300000, isBooked: false },
  { id: "s3", number: "A3", type: "vip_massage", price: 330000, isBooked: false },
  { id: "s4", number: "A4", type: "vip_massage", price: 330000, isBooked: false },
  { id: "s5", number: "A5", type: "vip_massage", price: 330000, isBooked: false },
  { id: "s6", number: "A6", type: "vip_massage", price: 330000, isBooked: false },
  { id: "s7", number: "A7", type: "standard", price: 300000, isBooked: false },
  { id: "s8", number: "A8", type: "standard", price: 300000, isBooked: false },
  { id: "s9", number: "A9", type: "standard", price: 300000, isBooked: false },
];

const INITIAL_SEATS_SHARED: Seat[] = [
  { id: "s1", number: "A1", type: "front", price: 350000, isBooked: false },
  { id: "s2", number: "B1", type: "vip_massage", price: 350000, isBooked: false },
  { id: "s3", number: "B2", type: "vip_massage", price: 350000, isBooked: false },
  { id: "s4", number: "B3", type: "vip_massage", price: 350000, isBooked: false },
  { id: "s5", number: "C1", type: "standard", price: 350000, isBooked: false },
  { id: "s6", number: "C2", type: "standard", price: 350000, isBooked: false },
];

export default function OperatorPanel({
  users,
  bookings,
  onUpdateBookingStatus,
  onDeleteBooking,
  onBulkDeleteBookings,
  blockedSeats,
  onToggleBlockedSeat,
  onRemoveBlockedSeat,
  combos,
  onUpdateCombos,
  limousineConfig,
  onUpdateLimousineConfig,
  sharedCarConfig,
  onUpdateSharedCarConfig,
  coupons,
  onUpdateCoupons,
  locations,
  onUpdateLocations,
  accommodations,
  onUpdateAccommodations,
  destinations,
  onUpdateDestinations,
  articles,
  onUpdateArticles
}: OperatorPanelProps) {
  // Navigation tabs inside Operator view
  const [panelTab, setPanelTab] = useState<"bookings" | "seatLock" | "customers" | "overview" | "travelServices" | "pricing" | "coupons" | "locations" | "content" | "schedules" | "reviews">("bookings");
  const [activeContentTab, setActiveContentTab] = useState<"destinations" | "articles">("destinations");
  const [userToDelete, setUserToDelete] = useState<any>(null);

  // Selection states for bulk actions
  const [selectedBookingIds, setSelectedBookingIds] = useState<string[]>([]);
  // Dual-state verification for deletions to avoid window.confirm
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  // Booking filtering states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "success" | "completed" | "cancelled">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "limousine" | "shared_car" | "private_charter" | "combo">("all");
  const [dateFilter, setDateFilter] = useState("");

  // Seat Locking custom states
  const [lockService, setLockService] = useState<"limousine" | "shared_car">("limousine");
  const [lockFrom, setLockFrom] = useState("Hà Nội");
  const [lockTo, setLockTo] = useState("Mộc Châu");
  const [lockDate, setLockDate] = useState(() => new Date().toISOString().substring(0, 10));
  
  const activeDepartureHours = lockService === "limousine"
    ? getOfficialSchedulesForRoute(lockFrom, lockTo, lockDate, limousineConfig)
    : getSharedCarSchedules();
  const [lockTime, setLockTime] = useState("06:00");
  const [lockPhone, setLockPhone] = useState("");

  // Dynamic feedback update on hour change mapping safety
  useEffect(() => {
    const hours = lockService === "limousine"
      ? getOfficialSchedulesForRoute(lockFrom, lockTo, lockDate, limousineConfig)
      : getSharedCarSchedules();
    if (!hours.includes(lockTime)) {
      setLockTime(hours[0] || "06:00");
    }
  }, [lockFrom, lockTo, lockService, lockDate, limousineConfig]);

  // Statistics calculation helpers
  const today = new Date().toISOString().substring(0, 10);
  
  const todayBookings = bookings.filter(b => b.travelDate === today && b.status !== "cancelled");
  const todayLimousine = todayBookings.filter(b => b.type === "limousine" || b.type === "shared_car");
  const todayCombos = todayBookings.filter(b => b.type === "combo");

  // Group limousine by trip for reminder
  const tripGroups: Record<string, { count: number, time: string, route: string }> = {};
  todayLimousine.forEach(b => {
    const key = `${b.routeSelection}_${b.departureTime}`;
    if (!tripGroups[key]) {
      tripGroups[key] = { count: 0, time: b.departureTime || "", route: b.routeSelection || "" };
    }
    tripGroups[key].count += (b.seatNumbers?.length || b.seatCount || 1);
  });

  const totalRevenue = bookings
    .filter((b) => b.status === "success" || b.status === "completed")
    .reduce((val, b) => val + b.totalPrice, 0);

  const pendingBookingsCount = bookings.filter((b) => b.status === "pending").length;
  const activeBookedSeatsCount = bookings
    .filter((b) => (b.status === "success" || b.status === "completed") && b.seatNumbers)
    .reduce((sum, b) => sum + (b.seatNumbers?.length || 0), 0);

  // Directional Booking count metrics (Professional Bento statistics)
  const hnMcCount = bookings.filter(b => b.type === "limousine" && (b.routeSelection || "").includes("Hà Nội") && (b.status === "success" || b.status === "completed")).length;
  const mcHnCount = bookings.filter(b => b.type === "limousine" && (b.routeSelection || "").includes("Mộc Châu") && (b.status === "success" || b.status === "completed")).length;
  const comboCount = bookings.filter(b => b.type === "combo" && (b.status === "success" || b.status === "completed")).length;

  // Filtered booking lists
  const filteredBookings = bookings.filter((bk) => {
    const sTerm = searchTerm.toLowerCase();
    const matchesSearch =
      (bk.passengerName || "").toLowerCase().includes(sTerm) ||
      (bk.passengerPhone || "").includes(sTerm) ||
      (bk.seatNumbers && bk.seatNumbers.join(", ").toLowerCase().includes(sTerm)) ||
      ((bk.id || "").toLowerCase().includes(sTerm));

    const matchesStatus = statusFilter === "all" || bk.status === statusFilter;
    const matchesType = typeFilter === "all" || bk.type === typeFilter;
    const matchesDate = !dateFilter || bk.travelDate === dateFilter;

    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  // Handle professional dispatch sheet export (UTF-8 Excel CSV Compatible)
  const handleExportCSV = () => {
    const activeBookings = filteredBookings.filter(b => b.status === "success" || b.status === "completed" || b.status === "pending");
    if (activeBookings.length === 0) {
      alert("Không có dữ liệu hành khách hoạt động trong bộ lọc hiện tại để xuất danh sách!");
      return;
    }
    
    let csvContent = "\uFEFF"; // UTF-8 BOM so Vietnamese displays perfectly in Excel!
    csvContent += "Mã Vé,Họ Tên Khách,Số Điện Thoại,Loại Hình,Hành Trình,Chi Tiết Ghế/Phòng,Ngày Khởi Hành,Giờ Chạy,Đón Khách,Trả Khách,Tổng Tiền,Trạng Thái\n";
    
    activeBookings.forEach(b => {
      const seatOrRooms = (b.type === "limousine" || b.type === "shared_car")
        ? (b.seatNumbers?.join("; ") || `${b.seatCount || 1} ghế`)
        : b.type === "private_charter"
        ? `Nguyên xe (${b.seatCount || "7"} chỗ)`
        : `${b.roomTypeName} (${b.roomQuantity} phòng)`;
      const route = (b.type === "limousine" || b.type === "shared_car") ? b.routeSelection : b.type === "private_charter" ? `${b.pickupPoint} - ${b.dropoffPoint}` : `${b.accommodationName}`;
      const serviceType = b.type === "limousine" ? "Xe Limousine VIP" : b.type === "shared_car" ? "Xe Ghép 7 Chỗ" : b.type === "private_charter" ? "Thuê Xe Riêng" : "Combo Du Lịch";
      
      csvContent += `"${(b.id || "").toUpperCase()}","${b.passengerName}","${b.passengerPhone}","${serviceType}","${route}","${seatOrRooms}","${b.travelDate}","${b.departureTime || '-'}","${b.pickupPoint}","${b.dropoffPoint}","${b.totalPrice}","${b.status === 'success' ? 'Đã duyệt (OK)' : b.status === 'completed' ? 'Đã hoàn thành' : 'Chờ xử lý'}"\n`;
    });
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Bieu-Khoi-Hanh-XeDimocchau_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle single status updates (Accept Payment / Cancel bookings)
  const handleUpdateStatus = (bookingId: string, nextStatus: 'pending' | 'success' | 'completed' | 'cancelled') => {
    onUpdateBookingStatus(bookingId, nextStatus);
  };

  // Handle booking deletion to free up storage
  const handleDeleteBooking = (bookingId: string) => {
    onDeleteBooking(bookingId);
    setDeleteConfirmId(null);
    setSelectedBookingIds(prev => prev.filter(id => id !== bookingId));
  };

  // Bulk deletion of multiple selected bookings
  const handleBulkDeleteBookings = () => {
    onBulkDeleteBookings(selectedBookingIds);
    setSelectedBookingIds([]);
    setBulkDeleteConfirm(false);
  };

  // Toggle seat blocking:
  const getBlockedItemForSeat = (seatId: string) => {
    const pathTripId = lockService === "limousine" 
      ? `trip_custom_${lockTime.replace(":", "_")}` 
      : `shared_car_trip_custom_${lockTime.replace(":", "_")}`;
    return blockedSeats.find(
      (b) => b.seatId === seatId && b.travelDate === lockDate && b.tripId === pathTripId
    );
  };

  const isSeatBlocked = (seatId: string) => {
    return !!getBlockedItemForSeat(seatId);
  };

  const getOnlineBookingForSeat = (seatNumber: string) => {
    return bookings.find(
      (b) =>
        b.type === lockService &&
        b.status !== "cancelled" &&
        b.travelDate === lockDate &&
        b.departureTime === lockTime &&
        b.seatNumbers?.includes(seatNumber)
    );
  };

  const handleToggleBlockSeat = (seatId: string) => {
    const pathTripId = lockService === "limousine" 
      ? `trip_custom_${lockTime.replace(":", "_")}` 
      : `shared_car_trip_custom_${lockTime.replace(":", "_")}`;
    onToggleBlockedSeat(seatId, lockDate, pathTripId, lockPhone.trim());
  };

  const renderSeatMapButton = (seat: Seat, isVip: boolean) => {
    const onlineBooking = getOnlineBookingForSeat(seat.number);
    const blockedItem = getBlockedItemForSeat(seat.id);

    if (onlineBooking) {
      return (
        <div
          key={seat.id}
          className={`px-1 rounded-xl border border-indigo-700 bg-indigo-600 text-white font-sans text-center flex flex-col items-center justify-center gap-0.5 shrink-0 select-none shadow-md ${
            isVip ? "h-24 py-4" : "h-20 py-3"
          }`}
          title={`Đã Đặt Online: ${onlineBooking.passengerName} (${onlineBooking.passengerPhone})`}
        >
          <User className="w-3.5 h-3.5 text-indigo-200" />
          <span className="text-[10px] font-black block leading-none">Ghế {seat.number} {isVip ? "(VIP)" : ""}</span>
          <span className="text-[9px] bg-indigo-800/80 px-1 py-0.5 rounded-md font-bold truncate max-w-full text-indigo-100 font-mono mt-0.5">
            📞 {onlineBooking.passengerPhone}
          </span>
          <span className="text-[8px] opacity-80 leading-none truncate max-w-full block font-semibold">Khách: {onlineBooking.passengerName}</span>
        </div>
      );
    }

    if (blockedItem) {
      return (
        <button
          key={seat.id}
          type="button"
          onClick={() => handleToggleBlockSeat(seat.id)}
          className={`px-1 rounded-xl border border-red-700 bg-red-600 text-white font-sans text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 shrink-0 shadow-md ${
            isVip ? "h-24 py-4" : "h-20 py-3"
          }`}
          title={`Nhấn vào để HỦY khóa ghế`}
        >
          <Lock className="w-3.5 h-3.5 text-red-200" />
          <span className="text-[10px] font-black block leading-none">Ghế {seat.number} {isVip ? "(VIP)" : ""}</span>
          {blockedItem.customerPhone ? (
            <span className="text-[9px] bg-red-800/80 px-1 py-0.5 rounded-md font-extrabold text-red-100 font-mono mt-0.5">
              📞 {blockedItem.customerPhone}
            </span>
          ) : (
            <span className="text-[9px] bg-red-800/80 px-1 py-0.5 rounded-md font-bold text-red-200 mt-0.5">
              ĐÃ KHÓA
            </span>
          )}
          <span className="text-[8px] opacity-80 leading-none block font-mono font-bold">Mở Khóa</span>
        </button>
      );
    }

    return (
      <button
        key={seat.id}
        type="button"
        onClick={() => handleToggleBlockSeat(seat.id)}
        className={`px-1 rounded-xl border font-sans text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 shrink-0 ${
          isVip
            ? "border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 h-24 py-4"
            : "border-stone-200 bg-white hover:bg-stone-50 text-stone-800 h-20 py-3"
        }`}
        title={`Khóa ghế này`}
      >
        <Unlock className={`w-3.5 h-3.5 ${isVip ? "text-emerald-600" : "text-stone-400"}`} />
        <span className="text-[10px] font-extrabold block leading-none">Ghế {seat.number} {isVip ? "(VIP)" : ""}</span>
        <span className="text-[9px] text-stone-500 font-mono font-bold">{seat.price / 1000}k VNĐ</span>
        <span className="text-[8px] text-stone-400 leading-none font-bold">Bấm Khóa</span>
      </button>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 font-sans" id="operator_dashboard_container">
      {/* Upper header */}
      <div className="bg-gradient-to-r from-stone-900 via-emerald-950 to-[#1b4332] rounded-3xl p-4 sm:p-6 lg:p-8 text-white shadow-xl mb-6 border border-emerald-900 overflow-hidden">
        <div className="flex flex-col gap-5 sm:gap-6 w-full">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 bg-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center border border-white/20">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="text-[10px] sm:text-xs bg-emerald-600/80 text-emerald-100 font-bold px-2 sm:px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Trạm Điều Hành
                </span>
                <span className="text-white/60 text-[10px] sm:text-xs truncate">• Nhà xe Duy Anh Limousine</span>
              </div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-black tracking-tight mt-0.5 sm:mt-1 text-stone-100 truncate">Hệ Thống Phân Hệ Quản Trị Chuyên Nghiệp</h2>
            </div>
          </div>
          
          <div className="flex gap-2 overflow-x-auto w-full pb-2 scroll-smooth snap-x">
            <button
              onClick={() => setPanelTab("bookings")}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 snap-start whitespace-nowrap ${
                panelTab === "bookings"
                  ? "bg-white text-stone-900 shadow-lg font-extrabold"
                  : "bg-white/10 hover:bg-white/15 text-white"
              }`}
            >
              Đặt chỗ
            </button>
            <button
              onClick={() => setPanelTab("seatLock")}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 snap-start whitespace-nowrap ${
                panelTab === "seatLock"
                  ? "bg-white text-stone-900 shadow-lg font-extrabold"
                  : "bg-white/10 hover:bg-white/15 text-white"
              }`}
            >
              Khóa ghế
            </button>
            <button
              onClick={() => setPanelTab("customers")}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 snap-start whitespace-nowrap ${
                panelTab === "customers"
                  ? "bg-white text-stone-900 shadow-lg font-extrabold"
                  : "bg-white/10 hover:bg-white/15 text-white"
              }`}
            >
              Khách hàng
            </button>
            <button
              onClick={() => setPanelTab("overview")}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                panelTab === "overview"
                  ? "bg-white text-stone-900 shadow-lg font-extrabold"
                  : "bg-white/10 hover:bg-white/15 text-white"
              }`}
            >
              Tổng quan
            </button>
            <button
              onClick={() => setPanelTab("pricing")}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                panelTab === "pricing"
                  ? "bg-white text-stone-900 shadow-lg font-extrabold"
                  : "bg-white/10 hover:bg-white/15 text-white"
              }`}
            >
              Giá vé
            </button>
            <button
              onClick={() => setPanelTab("schedules")}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                panelTab === "schedules"
                  ? "bg-white text-stone-900 shadow-lg font-extrabold"
                  : "bg-white/10 hover:bg-white/15 text-white"
              }`}
            >
              Lịch trình
            </button>
            <button
              onClick={() => setPanelTab("coupons")}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                panelTab === "coupons"
                  ? "bg-white text-stone-900 shadow-lg font-extrabold"
                  : "bg-white/10 hover:bg-white/15 text-white"
              }`}
            >
              Mã giảm giá
            </button>
            <button
              onClick={() => setPanelTab("locations")}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                panelTab === "locations"
                  ? "bg-white text-stone-900 shadow-lg font-extrabold"
                  : "bg-white/10 hover:bg-white/15 text-white"
              }`}
            >
              Điểm đón/trả
            </button>
            <button
              onClick={() => setPanelTab("travelServices")}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                panelTab === "travelServices"
                  ? "bg-white text-stone-900 shadow-lg font-extrabold"
                  : "bg-white/10 hover:bg-white/15 text-white"
              }`}
            >
              Khách sạn & Combo
            </button>
            <button
              onClick={() => setPanelTab("content")}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                panelTab === "content"
                  ? "bg-white text-stone-900 shadow-lg font-extrabold"
                  : "bg-white/10 hover:bg-white/15 text-white"
              }`}
            >
              Quản lý Nội dung
            </button>
            <button
              onClick={() => setPanelTab("reviews")}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                panelTab === "reviews"
                  ? "bg-white text-stone-900 shadow-lg font-extrabold"
                  : "bg-white/10 hover:bg-white/15 text-white"
              }`}
            >
              Quản lý Đánh giá
            </button>
          </div>
        </div>

        {/* Mini stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 sm:mt-8">
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xs flex flex-col justify-between">
            <p className="text-white/60 text-[11px] font-medium">Doanh thu vé thành công</p>
            <h4 className="text-xl sm:text-2xl font-black text-amber-300 mt-1 truncate">
              {totalRevenue.toLocaleString()}đ
            </h4>
            <div className="w-full bg-white/10 h-1 rounded-full mt-2 overflow-hidden shrink-0">
              <div className="bg-amber-400 h-full w-2/3 rounded-full" />
            </div>
          </div>
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xs flex flex-col justify-between">
            <p className="text-white/60 text-[11px] font-medium">Yêu cầu chưa xác nhận</p>
            <h4 className="text-xl sm:text-2xl font-black text-emerald-300 mt-1 truncate">
              {pendingBookingsCount} đơn mới
            </h4>
            <div className="w-full bg-white/10 h-1 rounded-full mt-2 overflow-hidden shrink-0">
              <div className="bg-emerald-400 h-full w-1/3 rounded-full" />
            </div>
          </div>
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xs flex flex-col justify-between">
            <p className="text-white/60 text-[11px] font-medium">Số ghế online đã duyệt</p>
            <h4 className="text-xl sm:text-2xl font-black text-stone-100 mt-1 truncate">
              {activeBookedSeatsCount} ghế xếp
            </h4>
            <div className="w-full bg-white/10 h-1 rounded-full mt-2 overflow-hidden shrink-0">
              <div className="bg-white h-full w-1/2 rounded-full" />
            </div>
          </div>
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xs flex flex-col justify-between">
            <p className="text-white/60 text-[11px] font-medium">Số ghế bị khóa offline</p>
            <h4 className="text-xl sm:text-2xl font-black text-[#85e3b2] mt-1 truncate">
              {blockedSeats.length} ghế khóa
            </h4>
            <div className="w-full bg-white/10 h-1 rounded-full mt-2 overflow-hidden shrink-0">
              <div className="bg-teal-300 h-full w-3/4 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {panelTab === "bookings" && (
        <div className="mb-6 space-y-4">
          {/* DAILY REMINDER CARD */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-emerald-600 rounded-lg text-white">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-emerald-950 text-sm uppercase tracking-tight">NHẮC NHỞ HÀNH TRÌNH HÔM NAY</h3>
                <p className="text-[10px] text-emerald-700 font-bold">Ngày {new Date().toLocaleDateString('vi-VN')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Bus Reminders */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-black text-emerald-900 border-b border-emerald-100 pb-1 flex items-center gap-1.5">
                  <ArrowRight className="w-3 h-3" /> CHUYẾN XE XUẤT PHÁT
                </h4>
                {Object.keys(tripGroups).length > 0 ? (
                  Object.values(tripGroups).map((trip, idx) => (
                    <div key={idx} className="bg-white/60 p-3 rounded-xl border border-emerald-100 text-xs text-stone-800 flex justify-between items-center">
                      <span>Hôm nay có <strong className="text-emerald-700">{trip.count} khách</strong> đặt vé chuyến <strong className="text-emerald-900">{trip.route}</strong></span>
                      <span className="font-mono bg-emerald-600 text-white px-2 py-0.5 rounded-md font-bold">{trip.time}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-stone-400 italic py-2">Hôm nay chưa có chuyến limousine nào khởi hành.</p>
                )}
              </div>

              {/* Combo Reminders */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-black text-amber-900 border-b border-amber-100 pb-1 flex items-center gap-1.5">
                  <Star className="w-3 h-3" /> ĐẶT PHÒNG & COMBO
                </h4>
                {todayCombos.length > 0 ? (
                  todayCombos.map((combo, idx) => (
                    <div key={idx} className="bg-white/60 p-3 rounded-xl border border-amber-100 text-xs text-stone-800">
                      Hôm nay có <strong className="text-amber-700">{combo.passengerName}</strong> đặt combo <strong className="text-amber-900">{combo.accommodationName}</strong> ({combo.roomQuantity} phòng) vào lúc <strong className="text-stone-900 font-mono italic">{combo.departureTime || "Sáng"}</strong>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-stone-400 italic py-2">Hôm nay chưa có lượt khách đặt combo.</p>
                )}
              </div>
            </div>
          </div>

          {/* PROFESSIONAL HIGH-TECH ROUTE FILLING STATISTICS BOARD (Bento View) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6" id="bento_route_visualizers">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 flex flex-col justify-between shadow-xs">
            <div>
              <span className="text-[10px] font-extrabold text-[#1b4332] uppercase tracking-wide block">Tần suất HN ➔ Mộc Châu</span>
              <p className="text-[11px] text-stone-500 mt-0.5">Lượng khách đi từ thủ đô Hà Nội</p>
            </div>
            <div className="mt-4">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-stone-900 font-extrabold text-base">{hnMcCount} chuyến duyệt</span>
                <span className="text-stone-400 text-[10px]">Tiêu chuẩn: 7 chuyến / ngày</span>
              </div>
              <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-[#1b4332] h-full rounded-full transition-all" 
                  style={{ width: `${Math.min(100, Math.max(12, hnMcCount * 14))}%` }} 
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 flex flex-col justify-between shadow-xs">
            <div>
              <span className="text-[10px] font-extrabold text-[#1b4332] uppercase tracking-wide block">Tần suất Mộc Châu ➔ HN</span>
              <p className="text-[11px] text-stone-500 mt-0.5">Lượng khách về lại thủ đô</p>
            </div>
            <div className="mt-4">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-stone-900 font-extrabold text-base">{mcHnCount} chuyến duyệt</span>
                <span className="text-stone-400 text-[10px]">Tiêu chuẩn: 12 chuyến / ngày</span>
              </div>
              <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-[#1b4332] h-full rounded-full transition-all" 
                  style={{ width: `${Math.min(100, Math.max(12, mcHnCount * 8))}%` }} 
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 flex items-center justify-between shadow-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wide block">Sản phẩm Combo Xe + Khách Sạn</span>
              <p className="text-stone-850 font-black text-lg">{comboCount} vé lưu trú</p>
              <p className="text-[10px] text-stone-400">Tăng trưởng nhanh khu Bản Áng</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-700 font-bold text-xs">
              MỚI ⭐
            </div>
          </div>
        </div>
        
        {/* TAB 1: BOOKING & TICKETS LIST MANAGER */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden" id="bookings_manager_section">
          {/* Controls Bar */}
          <div className="p-4 sm:p-6 bg-stone-50 border-b border-stone-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm tên, SĐT, ghế ngồi, mã vé..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 placeholder-stone-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center space-x-1.5 bg-white px-3 py-1.5 rounded-xl border border-stone-200">
                <ListFilter className="w-3.5 h-3.5 text-stone-500" />
                <span className="text-[11px] text-stone-500 font-bold">Lọc trạng thái:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="text-xs font-bold text-stone-700 bg-transparent focus:outline-none cursor-pointer"
                >
                  <option value="all">Tất cả ({bookings.length})</option>
                  <option value="pending">Đang chờ ({bookings.filter((b) => b.status === "pending").length})</option>
                  <option value="success">Đã xác nhận ({bookings.filter((b) => b.status === "success").length})</option>
                  <option value="completed">Đã hoàn thành ({bookings.filter((b) => b.status === "completed").length})</option>
                  <option value="cancelled">Đã hủy ({bookings.filter((b) => b.status === "cancelled").length})</option>
                </select>
              </div>

              <div className="flex items-center space-x-1.5 bg-white px-3 py-1.5 rounded-xl border border-stone-200">
                <span className="text-[11px] text-stone-500 font-bold">Nhóm dịch vụ:</span>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className="text-xs font-bold text-stone-700 bg-transparent focus:outline-none cursor-pointer"
                >
                  <option value="all">Tất cả đặt chỗ</option>
                  <option value="limousine">Đặt xe Limousine</option>
                  <option value="shared_car">Đặt xe Ghép 7 Chỗ</option>
                  <option value="private_charter">Thuê Xe Riêng</option>
                  <option value="combo">Combo phòng nghỉ</option>
                </select>
              </div>

              <div className="flex items-center space-x-1.5 bg-white px-3 py-1.5 rounded-xl border border-stone-200">
                <span className="text-[11px] text-stone-500 font-bold">Ngày xe chạy:</span>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="text-xs font-semibold text-stone-700 bg-transparent focus:outline-none cursor-pointer"
                />
                {dateFilter && (
                  <button 
                    onClick={() => setDateFilter("")} 
                    className="text-[10px] bg-stone-100 hover:bg-stone-200 px-1 rounded text-stone-600 font-bold font-sans"
                    title="Xóa lọc ngày"
                  >
                    X
                  </button>
                )}
              </div>

              <button
                onClick={handleExportCSV}
                className="px-4 py-2 bg-[#1b4332] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold tracking-wide shadow-xs transition-colors cursor-pointer flex items-center space-x-1"
                title="Tải bảng điều vận danh sách hành khách đi xe Excel"
              >
                <span>📥 Xuất bảng điều vận (Excel)</span>
              </button>
            </div>
          </div>

          {/* Bulk actions banner if any is selected */}
          {selectedBookingIds.length > 0 && (
            <div className="p-4 bg-amber-50 border-b border-amber-100 flex flex-col sm:flex-row justify-between items-center gap-3 animate-fadeIn" id="bulk_actions_bar">
              <div className="flex items-center space-x-2 text-xs font-bold text-amber-900">
                <span className="bg-amber-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]">
                  {selectedBookingIds.length}
                </span>
                <span>đơn đặt chỗ đang được chọn để xử lý hàng loạt</span>
              </div>
              <div className="flex items-center space-x-2">
                {bulkDeleteConfirm ? (
                  <div className="flex items-center bg-white p-1 rounded-xl border border-red-200">
                    <span className="text-[10px] text-red-600 font-bold px-2">Xóa vĩnh viễn {selectedBookingIds.length} vé?</span>
                    <button
                      onClick={handleBulkDeleteBookings}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-extrabold text-[10px] rounded-lg transition-all cursor-pointer"
                    >
                      Đồng ý xóa
                    </button>
                    <button
                      onClick={() => setBulkDeleteConfirm(false)}
                      className="ml-1 px-2.5 py-1 text-[10px] font-bold text-stone-500 hover:text-stone-700 hover:underline cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setBulkDeleteConfirm(true)}
                    className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-extrabold text-[11px] rounded-xl flex items-center space-x-1 shadow-xs cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    <span>Xóa tất cả {selectedBookingIds.length} vé đã chọn</span>
                  </button>
                )}
                
                <button
                  onClick={() => setSelectedBookingIds([])}
                  className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold text-[11px] rounded-xl transition-colors cursor-pointer"
                >
                  Bỏ chọn tất cả
                </button>
              </div>
            </div>
          )}

          {/* Bookings Table / Cards on mobile */}
          {filteredBookings.length === 0 ? (
            <div className="p-12 text-center text-stone-400">
              <Trash2 className="w-10 h-10 mx-auto text-stone-300 stroke-1 mb-2.5" />
              <p className="text-sm font-semibold">Không tìm thấy yêu cầu đặt chỗ nào thỏa mãn bộ lọc!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="bg-stone-50/50 text-left border-b border-stone-100 text-[11px] text-stone-500 font-extrabold uppercase tracking-wider">
                    <th className="py-4 px-4 text-center w-12">
                      <input
                        type="checkbox"
                        checked={filteredBookings.length > 0 && filteredBookings.every(b => selectedBookingIds.includes(b.id))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBookingIds(prev => {
                              const newSelections = [...prev];
                              filteredBookings.forEach(b => {
                                if (!newSelections.includes(b.id)) {
                                  newSelections.push(b.id);
                                }
                              });
                              return newSelections;
                            });
                          } else {
                            setSelectedBookingIds(prev => prev.filter(id => !filteredBookings.some(f => f.id === id)));
                          }
                        }}
                        className="w-4 h-4 text-emerald-600 border-stone-300 rounded focus:ring-emerald-500 cursor-pointer"
                      />
                    </th>
                    <th className="py-4 px-4">Mã giao dịch / Ngày</th>
                    <th className="py-4 px-6">Hành khách</th>
                    <th className="py-4 px-6">Chi tiết hành trình / Dịch vụ</th>
                    <th className="py-4 px-6 text-right">Tổng thành tiền</th>
                    <th className="py-4 px-6">Trạng thái</th>
                    <th className="py-4 px-6 text-center">Thao tác duyệt giữ chỗ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
                  {filteredBookings.map((bk, idx) => (
                    <tr key={bk.id ? `bk-row-${bk.id}-${idx}` : `bk-row-idx-${idx}`} className={`hover:bg-stone-50/20 transition-colors ${selectedBookingIds.includes(bk.id) ? "bg-emerald-50/5" : ""}`}>
                      <td className="py-4 px-4 text-center w-12">
                        <input
                          type="checkbox"
                          checked={selectedBookingIds.includes(bk.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedBookingIds(prev => [...prev, bk.id]);
                            } else {
                              setSelectedBookingIds(prev => prev.filter(id => id !== bk.id));
                            }
                          }}
                          className="w-4 h-4 text-emerald-600 border-stone-300 rounded focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-4 px-4 font-mono">
                        <span className="font-extrabold text-[#1b4332] block">#{(bk.id || "").replace("bk_", "").toUpperCase()}</span>
                        <span className="text-[10px] text-stone-500 mt-0.5 block">Đơn ngày: {bk.bookingDate}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-0.5">
                          <p className="font-extrabold text-[#111]">{bk.passengerName}</p>
                          <p className="font-mono text-[10px] text-stone-500 flex items-center gap-0.5">
                            <Phone className="w-3 h-3 text-stone-400" />
                            {bk.passengerPhone}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {bk.type === "limousine" && (
                          <div className="space-y-1">
                            <p className="font-extrabold text-stone-800 flex items-center gap-1.5">
                              <span className="px-1.5 py-0.5 text-[9px] bg-emerald-100 text-emerald-800 font-bold rounded-md">
                                XE LIMOUSINE
                              </span>
                              <span>Tuyến: {bk.routeSelection}</span>
                            </p>
                            <p className="text-stone-500 font-sans tracking-wide">
                              Ngày đi: <strong className="text-stone-700">{bk.travelDate}</strong> | Giờ: <strong className="text-stone-700">{bk.departureTime}</strong>
                            </p>
                            <p className="text-[10px] text-emerald-700 font-bold">
                              Ghế đặt: {bk.seatNumbers?.join(", ")}
                            </p>
                          </div>
                        )}
                        {bk.type === "shared_car" && (
                          <div className="space-y-1">
                            <p className="font-extrabold text-stone-800 flex items-center gap-1.5">
                              <span className="px-1.5 py-0.5 text-[9px] bg-teal-100 text-teal-800 font-bold rounded-md">
                                XE GHÉP 7 CHỖ
                              </span>
                              <span>Tuyến: {bk.routeSelection}</span>
                            </p>
                            <p className="text-stone-500 font-sans tracking-wide">
                              Ngày đi: <strong className="text-stone-700">{bk.travelDate}</strong> | Giờ: <strong className="text-stone-700">{bk.departureTime}</strong>
                            </p>
                            <p className="text-[10px] text-teal-700 font-bold">
                              Ghế đặt: {bk.seatNumbers?.join(", ")}
                            </p>
                          </div>
                        )}
                        {bk.type === "private_charter" && (
                          <div className="space-y-1">
                            <p className="font-extrabold text-stone-800 flex items-center gap-1.5">
                              <span className="px-1.5 py-0.5 text-[9px] bg-indigo-100 text-indigo-800 font-bold rounded-md">
                                THUÊ XE RIÊNG
                              </span>
                              <span>Tuyến: {bk.routeSelection || "Theo yêu cầu"}</span>
                            </p>
                            <p className="text-stone-500 font-sans tracking-wide">
                              Ngày đi: <strong className="text-stone-700">{bk.travelDate}</strong> | Giờ: <strong className="text-stone-700">{bk.departureTime || '-'}</strong>
                            </p>
                            <p className="text-[10px] text-indigo-700 font-bold">
                              Sức chứa: {bk.seatCount || "7"} chỗ
                            </p>
                          </div>
                        )}
                        {bk.type === "combo" && (
                          <div className="space-y-1">
                            <p className="font-extrabold text-stone-800 flex items-center gap-1.5">
                              <span className="px-1.5 py-0.5 text-[9px] bg-amber-100 text-amber-800 font-bold rounded-md">
                                COMBO
                              </span>
                              <span>{bk.accommodationName}</span>
                            </p>
                            <p className="text-stone-500 font-sans">
                              Loại phòng: {bk.roomTypeName} ({bk.roomQuantity} phòng x {bk.nights} đêm)
                            </p>
                            <p className="text-[10px] text-amber-700 font-bold">
                              Ngày đi xe khứ hồi: {bk.travelDate}
                            </p>
                          </div>
                        )}
                        <span className="text-[9px] text-stone-400 block mt-1.5">Đón: {bk.pickupPoint} ➜ Trả: {bk.dropoffPoint}</span>
                      </td>
                      <td className="py-4 px-6 text-right font-black text-xs text-stone-900 font-mono">
                        {bk.totalPrice.toLocaleString()}đ
                      </td>
                      <td className="py-4 px-6">
                        {bk.status === "pending" && (
                          <span className="px-2 py-1 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full font-bold text-[10px]">
                            Đang Chờ
                          </span>
                        )}
                        {bk.status === "success" && (
                          <span className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-[10px]">
                            Đã Đi / OK
                          </span>
                        )}
                        {bk.status === "completed" && (
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-bold text-[10px]">
                            Đã Đi / Xong
                          </span>
                        )}
                        {bk.status === "cancelled" && (
                          <span className="px-2 py-1 bg-stone-100 text-stone-500 border border-stone-200 rounded-full font-bold text-[10px]">
                            Đã Hủy
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-1.5">
                          {bk.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(bk.id, "success")}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] uppercase transition-all flex items-center gap-1 cursor-pointer"
                                title="Xác nhận thanh toán thành công & tích điểm cho khách"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Duyệt Đơn
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(bk.id, "cancelled")}
                                className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg font-bold text-[10px] uppercase transition-all flex items-center gap-1 cursor-pointer"
                                title="Hủy chuyến giữ chỗ này"
                              >
                                <X className="w-3.5 h-3.5" />
                                Hủy Đơn
                              </button>
                            </>
                          )}
                          {bk.status === "success" && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(bk.id, "completed")}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[10px] font-bold cursor-pointer transition-colors"
                                title="Đánh dấu chuyến đi đã hoàn thành"
                              >
                                Hoàn thành
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(bk.id, "cancelled")}
                                className="px-2 py-1 border border-stone-200 text-stone-400 rounded-md hover:text-red-500 hover:border-red-200 text-[10px] cursor-pointer"
                                title="Hủy chuyến"
                              >
                                Hủy đơn
                              </button>
                            </>
                          )}
                          {bk.status === "completed" && (
                            <button
                              onClick={() => handleUpdateStatus(bk.id, "success")}
                              className="px-2 py-1 border border-stone-200 text-stone-500 rounded-md hover:text-[#1b4332] hover:bg-emerald-50 text-[10px] cursor-pointer"
                              title="Khôi phục trạng thái Đã Duyệt"
                            >
                              Khôi phục 'Duyệt'
                            </button>
                          )}
                          {bk.status === "cancelled" && (
                            <button
                              onClick={() => handleUpdateStatus(bk.id, "pending")}
                              className="px-2 py-1 border border-stone-200 text-stone-500 rounded-md hover:text-[#1b4332] hover:bg-emerald-50 text-[10px] cursor-pointer"
                            >
                              Khôi phục 'Chờ'
                            </button>
                          )}
                          
                          {/* Permanent Storage Deletion Button */}
                          {deleteConfirmId === bk.id ? (
                            <div className="flex items-center bg-red-100 border border-red-300 p-0.5 rounded-lg animate-fadeIn ml-1 text-[10px]">
                              <button
                                type="button"
                                onClick={() => handleDeleteBooking(bk.id)}
                                className="px-1.5 py-1 bg-red-700 hover:bg-red-800 text-white font-extrabold rounded-md shadow-xs transition-colors cursor-pointer text-[9px]"
                              >
                                Xóa thật
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(null)}
                                className="ml-1 text-[9px] font-bold text-stone-600 hover:text-stone-900 px-0.5 hover:underline cursor-pointer"
                              >
                                Hủy
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteConfirmId(bk.id);
                                setTimeout(() => {
                                  setDeleteConfirmId(prev => prev === bk.id ? null : prev);
                                }, 4000);
                              }}
                              className="p-1 px-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg transition-colors cursor-pointer flex items-center gap-0.5 ml-1"
                              title="Xóa vĩnh viễn vé này"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-600" />
                              <span className="text-[10px] font-bold">Xóa vé</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      )}
      {panelTab === "seatLock" && (
        /* TAB 2: SEAT LOCK CONTROL PANEL FOR TRIPS */
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 sm:p-8" id="seat_locker_manager_section">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-lg font-black text-stone-800 flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-600" />
              Khóa Vé Chỗ Ngồi Cho Từng Chuyến Đi Cố Định
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              * Khách hàng đặt mua vé trực tiếp qua số điện thoại/Zalo, không thanh toán trên web? Quý nhà xe có thể tự chọn khóa vé theo từng lộ trình, ngày di chuyển và khung giờ cụ thể để khách online không thể click chọn giữ trùng!
            </p>

            {/* Selection Form for Seat Locking */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mt-6 bg-stone-50 p-4 rounded-xl border border-stone-200">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-500 block uppercase">Loại dịch vụ xe</label>
                <select
                  value={lockService}
                  onChange={(e) => {
                    setLockService(e.target.value as any);
                  }}
                  className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-semibold focus:outline-none"
                >
                  <option value="limousine">Limousine (9 chỗ)</option>
                  <option value="shared_car">Xe Ghép (6 chỗ)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-500 block uppercase">Tuyến xuất phát</label>
                <select
                  value={lockFrom}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLockFrom(val);
                    setLockTo(val === "Hà Nội" ? "Mộc Châu" : "Hà Nội");
                  }}
                  className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-semibold focus:outline-none"
                >
                  <option value="Hà Nội">Hà Nội</option>
                  <option value="Mộc Châu">Mộc Châu</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-500 block uppercase">Điểm đến</label>
                <div className="w-full px-2.5 py-1.5 bg-stone-200 border border-stone-200 rounded-lg text-xs font-semibold text-stone-600">
                  {lockTo}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-500 block uppercase">Chọn ngày đi xe</label>
                <input
                  type="date"
                  value={lockDate}
                  onChange={(e) => setLockDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-semibold focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-500 block uppercase">Khung giờ xe xuất bến</label>
                <select
                  value={lockTime}
                  onChange={(e) => setLockTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-semibold focus:outline-none"
                >
                  {activeDepartureHours.map((h, idx) => (
                    <option key={`hour-opt-${h}-${idx}`} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* List of currently locked seats */}
            <div className="mt-6 p-4 bg-red-50 rounded-xl border border-red-100">
              <h4 className="text-xs font-bold text-red-900 uppercase mb-3">Ghế đang khóa offline ({blockedSeats.length})</h4>
              {blockedSeats.length > 0 ? (
                <div className="space-y-2">
                  {blockedSeats.map((bs, idx) => (
                    <div key={`blocked-${bs.seatId}-${bs.tripId}-${idx}`} className="flex flex-wrap justify-between items-center gap-2 text-xs bg-white p-3 rounded-lg border border-red-200 shadow-xs">
                      <div>
                        <span className="font-extrabold text-[#1b4332] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md text-[9px] mr-2">
                          {bs.tripId.includes("shared_car") ? "XE GHÉP 7 CHỖ" : "LIMOUSINE VIP"}
                        </span>
                        <span className="font-bold text-stone-700">
                          Giờ: <strong className="text-stone-900 font-mono">{bs.tripId.replace("shared_car_trip_custom_", "").replace("trip_custom_", "").replace("_", ":")}</strong> | Ngày: {bs.travelDate} | Ghế: {bs.seatId.toUpperCase().replace("S", "A")}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        {bs.customerPhone && <span className="font-mono text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100 font-bold">📞 {bs.customerPhone}</span>}
                        <button 
                          onClick={() => {
                            onRemoveBlockedSeat(bs);
                          }}
                          className="px-2.5 py-1 bg-red-600 text-white rounded-md text-[10px] font-extrabold uppercase hover:bg-red-700 transition"
                        >
                          Mở khóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-red-600">Không có ghế nào đang bị khóa.</p>
              )}
            </div>

            {/* Custom Input for Client Phone Number to block-lock seats */}
            <div className="mt-4 p-3 bg-emerald-50/50 border border-emerald-200/60 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-stone-900 shadow-xs max-w-sm sm:max-w-md mx-auto">
              <div className="text-left">
                <span className="text-xs font-bold text-stone-800 block">SĐT khách hàng đặt trực tiếp (tùy chọn)</span>
                <span className="text-[10px] text-stone-500 block sm:max-w-xs leading-normal">Nhập số điện thoại tại đây trước khi bấm chọn ghế để lưu SĐT vào bộ nhớ ghế khóa.</span>
              </div>
              <input
                type="text"
                placeholder="Ví dụ: 0971050324"
                value={lockPhone}
                onChange={(e) => setLockPhone(e.target.value)}
                className="px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-bold font-mono text-stone-800 focus:outline-none focus:border-emerald-600 w-full sm:w-40 text-center"
              />
            </div>

            {/* Interactive VIP Limousine Interior Mockup */}
            <div className="mt-8 border border-stone-200 rounded-3xl p-5 sm:p-6 max-w-sm mx-auto bg-stone-50 shadow-sm">
              {/* Headboard section */}
              <div className="text-center font-sans">
                <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                  {lockService === "limousine" ? "Đầu xe Limousine" : "Đầu xe SUV 7 Chỗ"}
                </span>
                <div className="w-24 h-5 bg-stone-300 rounded-full mx-auto mt-2 text-[9px] text-stone-600 flex items-center justify-center font-bold font-mono shadow-xs">
                  LÁI XE / CABIN
                </div>
              </div>

              {lockService === "limousine" ? (
                /* Grid 9 seats layout */
                <div className="mt-6 space-y-3.5">
                  {/* Row 1: Active cabin front row */}
                  <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
                    {INITIAL_SEATS_TEMPLATE.slice(0, 2).map((seat) => renderSeatMapButton(seat, false))}
                  </div>

                  {/* Walkway corridor spacer */}
                  <div className="py-1 flex items-center justify-center">
                    <span className="text-[8px] uppercase tracking-wider font-extrabold text-stone-400 bg-stone-100 border border-stone-200/55 px-2.5 py-0.5 rounded-sm">LỐI ĐI HÀNH KHÁCH</span>
                  </div>

                  {/* VIP middle seats rows */}
                  <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
                    {INITIAL_SEATS_TEMPLATE.slice(2, 6).map((seat) => renderSeatMapButton(seat, true))}
                  </div>

                  {/* Walkway corridor spacer 2 */}
                  <div className="py-1 flex items-center justify-center">
                    <span className="text-[8.5px] uppercase tracking-wider font-extrabold text-[#113022]/40">Hàng ghế tiêu chuẩn sau</span>
                  </div>

                  {/* Back standard seats row */}
                  <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto pt-1">
                    {INITIAL_SEATS_TEMPLATE.slice(6, 9).map((seat) => renderSeatMapButton(seat, false))}
                  </div>
                </div>
              ) : (
                /* Grid 6 seats layout for Shared SUV */
                <div className="mt-6 space-y-3.5">
                  {/* Row 1: Cabin front row (Driver on Left, Seat A1 on Right) */}
                  <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
                    <div className="border border-stone-200 bg-stone-200 text-stone-500 flex items-center justify-center text-[10px] font-bold rounded-xl h-20 font-sans uppercase">Lái xe</div>
                    {INITIAL_SEATS_SHARED.slice(0, 1).map((seat) => renderSeatMapButton(seat, false))}
                  </div>

                  {/* Space divisor */}
                  <div className="py-1 flex items-center justify-center">
                    <span className="text-[8px] uppercase tracking-wider font-extrabold text-stone-400 bg-stone-100 border border-stone-200/55 px-2.5 py-0.5 rounded-sm">HÀNG GHẾ 2</span>
                  </div>

                  {/* Row 2: 3 seats */}
                  <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto">
                    {INITIAL_SEATS_SHARED.slice(1, 4).map((seat) => renderSeatMapButton(seat, true))}
                  </div>

                  {/* Space divisor 2 */}
                  <div className="py-1 flex items-center justify-center">
                    <span className="text-[8px] uppercase tracking-wider font-extrabold text-stone-400 bg-stone-100 border border-stone-200/55 px-2.5 py-0.5 rounded-sm">HÀNG GHẾ 3</span>
                  </div>

                  {/* Row 3: 2 seats */}
                  <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
                    {INITIAL_SEATS_SHARED.slice(4, 6).map((seat) => renderSeatMapButton(seat, false))}
                  </div>
                </div>
              )}

              {/* Lock legends */}
              <div className="mt-6 pt-4 border-t border-stone-200 flex flex-col gap-2 text-[10px] text-stone-500">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-indigo-600 border border-indigo-700 rounded-sm inline-block shadow-xs" />
                    <span className="font-semibold">Đã đặt online (Hiển thị SĐT)</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-red-600 border border-red-700 rounded-sm inline-block shadow-xs" />
                    <span className="font-semibold">Đã khóa giữ chỗ (Có SĐT)</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-white border border-stone-200 rounded-sm inline-block shadow-xs" />
                    <span className="font-semibold">Ghế trống</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
              <span className="font-bold text-amber-600 uppercase block mb-1">CẢNH BÁO CHO ĐIỀU HÀNH VIÊN</span>
              Việc bấm trực tiếp vào ô ghế sẽ khóa/mở khóa thực tế trên website cho chuyến đi vào lúc <strong>{lockTime} ngày {lockDate} ({lockFrom} ➔ {lockTo})</strong>. Hãy thận trọng trước mỗi thao tác giữ ghế!
            </div>
          </div>
        </div>
      )}
      {panelTab === "customers" && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 sm:p-8" id="customers_manager_section">
          <h3 className="text-xl font-black text-stone-900 mb-6">Quản lý khách hàng</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-stone-600 min-w-[500px]">
              <thead>
                <tr className="border-b">
                  <th className="p-3">SĐT</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Điểm</th>
                  <th className="p-3">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={`user-row-${u.phone || i}-${i}`} className="border-b">
                    <td className="p-3 font-semibold text-stone-900">{u.phone}</td>
                    <td className="p-3">{u.email}</td>
                    <td className="p-3">{u.points || 0}</td>
                      <td className="p-3 text-red-600 font-bold cursor-pointer hover:underline" onClick={() => setUserToDelete(u)}>Hủy TK</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {panelTab === "overview" && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 sm:p-8" id="overview_manager_section">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <h3 className="text-xl font-black text-stone-900">Tổng quan chuyến</h3>
            <input
              type="date"
              value={lockDate}
              onChange={(e) => setLockDate(e.target.value)}
              className="px-4 py-2 bg-stone-100 rounded-xl text-sm font-bold border border-stone-200"
            />
          </div>

          {[
            { label: "Chiều HN - Mộc Châu", route: "Hà Nội - Mộc Châu" },
            { label: "Chiều Mộc Châu - HN", route: "Mộc Châu - Hà Nội" }
          ].map((direction, idx) => (
            <div key={`dir-row-${direction.route || idx}-${idx}`} className="mb-8">
              <h4 className="text-lg font-bold text-stone-800 mb-4 border-b pb-2">{direction.label}</h4>
              
              <div className="mb-6">
                <h5 className="text-sm font-bold text-stone-600 mb-2">Xe Limousine (9 ghế)</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {getOfficialSchedulesForRoute(direction.route.split(' - ')[0], direction.route.split(' - ')[1]).map((time, idx) => {
                    const bookedCount = bookings.filter(b => b.type === "limousine" && (b.status === "success" || b.status === "completed") && b.departureTime === time && b.travelDate === lockDate && (b.routeSelection === direction.route || b.routeSelection?.replace(' ➔ ', ' - ') === direction.route)).reduce((sum, b) => sum + (b.seatNumbers?.length || 0), 0);
                    const blockedCount = blockedSeats.filter(b => b.tripId === `trip_custom_${time.replace(':', '_')}` && b.travelDate === lockDate).length;
                    const total = 9;
                    return (
                      <div key={`limo-grid-${direction.route}-${time}-${idx}`} className={`p-3 rounded-lg border ${bookedCount + blockedCount >= total ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                        <p className="text-[10px] font-bold">{time}</p>
                        <p className="text-sm font-black">{bookedCount + blockedCount} / {total} ghế</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div>
                <h5 className="text-sm font-bold text-stone-600 mb-2">Xe Ghép (6 ghế)</h5>
                <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-9 gap-2">
                  {getSharedCarSchedules().map((time, idx) => {
                    const bookedCount = bookings.filter(b => b.type === "shared_car" && (b.status === "success" || b.status === "completed") && b.departureTime === time && b.travelDate === lockDate && (b.routeSelection === direction.route || b.routeSelection?.replace(' ➔ ', ' - ') === direction.route)).reduce((sum, b) => sum + (b.seatNumbers?.length || 0), 0);
                    const blockedCount = blockedSeats.filter(b => b.tripId === `shared_car_trip_custom_${time.replace(':', '_')}` && b.travelDate === lockDate).length;
                    const total = 6;
                    return (
                      <div key={`shared-grid-${direction.route}-${time}-${idx}`} className={`p-2 rounded-lg border ${bookedCount + blockedCount >= total ? 'bg-red-50 border-red-100' : 'bg-sky-50 border-sky-100'}`}>
                        <p className="text-[9px] font-bold">{time}</p>
                        <p className="text-[11px] font-black">{bookedCount + blockedCount} / {total}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {panelTab === "travelServices" && (
        <AccommodationComboManagement 
          accommodations={accommodations} 
          onUpdateAccommodations={onUpdateAccommodations}
          combos={combos}
          onUpdateCombos={onUpdateCombos}
        />
      )}
      {panelTab === "schedules" && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 sm:p-8" id="schedule_manager_section">
          <ScheduleManagement 
            limousineConfig={limousineConfig} 
            onUpdateLimousineConfig={onUpdateLimousineConfig} 
          />
        </div>
      )}
      {panelTab === "content" && (
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden" id="content_manager_section">
          <div className="flex border-b border-stone-100 bg-stone-50/50">
            <button
              onClick={() => setActiveContentTab("destinations")}
              className={`flex-1 py-4 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                activeContentTab === "destinations"
                  ? "bg-white text-emerald-800 border-b-2 border-emerald-600 shadow-sm"
                  : "text-stone-400 hover:text-stone-600"
              }`}
            >
              <MapPin className={`w-4 h-4 ${activeContentTab === "destinations" ? "text-emerald-600" : "text-stone-300"}`} />
              Khám phá Mộc Châu
            </button>
            <button
              onClick={() => setActiveContentTab("articles")}
              className={`flex-1 py-4 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                activeContentTab === "articles"
                  ? "bg-white text-emerald-800 border-b-2 border-emerald-600 shadow-sm"
                  : "text-stone-400 hover:text-stone-600"
              }`}
            >
              <Newspaper className={`w-4 h-4 ${activeContentTab === "articles" ? "text-emerald-600" : "text-stone-300"}`} />
              Cẩm nang du lịch
            </button>
          </div>

          <div className="p-6 sm:p-8">
            {activeContentTab === "destinations" ? (
              <DestinationManagement 
                destinations={destinations} 
                onUpdateDestinations={onUpdateDestinations} 
              />
            ) : (
              <ArticleManagement 
                articles={articles} 
                onUpdateArticles={onUpdateArticles} 
              />
            )}
          </div>
        </div>
      )}
      {panelTab === "pricing" && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 sm:p-8" id="pricing_manager_section">
          <PricingManagement limousineConfig={limousineConfig} onUpdateLimousineConfig={onUpdateLimousineConfig} sharedCarConfig={sharedCarConfig} onUpdateSharedCarConfig={onUpdateSharedCarConfig} />
        </div>
      )}
      {panelTab === "coupons" && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 sm:p-8" id="coupons_manager_section">
          <CouponManagement coupons={coupons} onUpdateCoupons={onUpdateCoupons} />
        </div>
      )}
      {panelTab === "locations" && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 sm:p-8" id="locations_manager_section">
          <LocationManagement locations={locations} onUpdateLocations={onUpdateLocations} />
        </div>
      )}

      {panelTab === "reviews" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <ReviewManagement destinations={destinations} />
        </div>
      )}

      {userToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-xl font-bold text-stone-900 mb-2">Xác nhận</h3>
            <p className="text-stone-600 mb-6">Bạn có chắc chắn muốn xóa tài khoản này không? Hành động này không thể hoàn tác.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 font-semibold text-stone-500 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
              >
                Không
              </button>
              <button 
                onClick={() => {
                  import("../lib/firebaseUtils").then(({ getLocalList, setLocalList }) => {
                    const current = getLocalList<any>("users", []);
                    const filtered = current.filter(user => user.id !== userToDelete.id);
                    setLocalList("users", filtered);
                    window.dispatchEvent(new Event("xedimocchau_db_update"));
                  });
                  import("../firebase").then(({ auth, db }) => {
                    import("firebase/firestore").then(({ doc, deleteDoc }) => {
                      if (auth.currentUser) {
                        deleteDoc(doc(db, "users", userToDelete.id)).catch(console.error);
                      }
                    });
                  });
                  alert("Đã xóa tài khoản thành công!");
                  setUserToDelete(null);
                }}
                className="px-4 py-2 font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors cursor-pointer"
              >
                Có
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
