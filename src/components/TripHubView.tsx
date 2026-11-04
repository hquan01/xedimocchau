import React, { useState } from "react";
import { 
  Car, Sparkles, Ticket, Calculator, Bookmark, MapPin, CalendarDays, 
  Users, ArrowLeftRight, Bus, Clock, ShieldCheck, CheckCircle2, ChevronRight, 
  Phone, Plus, Minus, DollarSign, Share2, Trash2, ExternalLink, Heart, AlertCircle
} from "lucide-react";
import BookingSwitcher from "./BookingSwitcher";
import AIPlanner from "./AIPlanner";
import { Booking, TourCombo, Accommodation, Destination, User, Coupon, LocationPoint, LimousineConfig, SharedCarConfig } from "../types";

interface TripHubViewProps {
  setActiveTab: (tab: string) => void;
  currentUser: User | null;
  bookings: Booking[];
  accommodations: Accommodation[];
  destinations: Destination[];
  combos: TourCombo[];
  locations: LocationPoint[];
  blockedSeats: any[];
  limousineConfig: LimousineConfig;
  sharedCarConfig: SharedCarConfig;
  coupons: Coupon[];
  onAddBooking: (booking: Booking) => Promise<void>;
  onOpenPayment: (booking: Booking) => void;
  onCancelBooking: (id: string) => Promise<void>;
  onDeleteBooking: (id: string) => Promise<void>;
  onDeductPoints: (points: number) => void;
  onOpenAuth: () => void;
}

export default function TripHubView({
  setActiveTab,
  currentUser,
  bookings,
  accommodations,
  destinations,
  combos,
  locations,
  blockedSeats,
  limousineConfig,
  sharedCarConfig,
  coupons,
  onAddBooking,
  onOpenPayment,
  onCancelBooking,
  onDeleteBooking,
  onDeductPoints,
  onOpenAuth
}: TripHubViewProps) {
  // Main sub-tab selection inside Trip Hub
  const [activeSubTab, setActiveSubTab] = useState<"limousine" | "ai" | "my_tickets" | "expenses" | "saved_trips">("limousine");

  // Filter bookings belonging to current user or current device
  const myBookings = React.useMemo(() => {
    if (!bookings) return [];
    if (currentUser?.id) {
      return bookings.filter(b => b.userId === currentUser.id || b.passengerPhone === currentUser.phone);
    }
    // If guest, attempt matching phone or local storage device
    const localPhone = localStorage.getItem("last_passenger_phone");
    if (localPhone) {
      return bookings.filter(b => b.passengerPhone === localPhone);
    }
    return bookings.slice(0, 5); // Fallback last recent device bookings
  }, [bookings, currentUser]);

  // Quick initial search parameters for Limousine booking tab
  const [limoSearch, setLimoSearch] = useState({
    from: "Hà Nội",
    to: "Mộc Châu",
    date: new Date().toISOString().split("T")[0],
    time: "all",
    pickup: "",
    dropoff: ""
  });

  // Trip Budget Estimator State
  const [partyCount, setPartyCount] = useState<number>(2);
  const [numDays, setNumDays] = useState<number>(2);
  const [numNights, setNumNights] = useState<number>(1);

  const [expenses, setExpenses] = useState({
    transport: 600000, // 300k x 2 lượt / người
    accommodation: 800000, // 800k / đêm
    dining: 350000, // 350k / người / ngày
    sightseeing: 250000, // 250k / người (vé cầu kính + đồi chè)
    other: 200000 // quà cáp / dự phòng
  });

  const totalExpense = React.useMemo(() => {
    const totalTransport = expenses.transport * partyCount;
    const totalStay = expenses.accommodation * numNights;
    const totalFood = expenses.dining * partyCount * numDays;
    const totalSightseeing = expenses.sightseeing * partyCount;
    const totalOther = expenses.other * partyCount;
    return totalTransport + totalStay + totalFood + totalSightseeing + totalOther;
  }, [expenses, partyCount, numDays, numNights]);

  const perPersonExpense = Math.round(totalExpense / Math.max(1, partyCount));

  // Saved trips local state
  const [savedItineraries, setSavedItineraries] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("saved_moc_chau_trips");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const removeSavedTrip = (id: string) => {
    const updated = savedItineraries.filter(item => item.id !== id);
    setSavedItineraries(updated);
    localStorage.setItem("saved_moc_chau_trips", JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-16 font-sans" id="trip_hub_root">
      {/* Hero Title Section */}
      <div className="bg-gradient-to-b from-[#1b4332] via-[#2d5a45] to-emerald-950 text-white pt-8 pb-10 px-4 sm:px-6 lg:px-8 shadow-xl relative overflow-hidden">
        {/* Subtle background graphic decor */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10 text-left">
          <div className="inline-flex items-center space-x-2 bg-emerald-800/80 border border-emerald-400/30 px-3 py-1 rounded-full text-[11px] font-extrabold text-emerald-300 uppercase tracking-wider mb-3">
            <Car className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>Trung Tâm Hành Trình QT Limousine</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white mb-2">
            Chuyến đi của bạn
          </h1>
          <p className="text-stone-200 text-xs sm:text-sm max-w-2xl font-sans leading-relaxed">
            Lên kế hoạch thông minh, đặt xe QT Limousine VIP đưa đón tận nơi và quản lý toàn bộ vé xe & chi phí du lịch Mộc Châu.
          </p>
        </div>
      </div>

      {/* 5 Sub-Tabs Navigation Bar - Sticky & Mobile First */}
      <div className="sticky top-14 sm:top-16 z-40 bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-2.5 pt-1.5 custom-tab-scrollbar">
            <button
              onClick={() => setActiveSubTab("limousine")}
              className={`flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                activeSubTab === "limousine"
                  ? "bg-[#1b4332] text-white shadow-md"
                  : "text-stone-600 hover:text-[#1b4332] hover:bg-stone-100"
              }`}
              id="subtab_limousine"
            >
              <Bus className="w-4 h-4 text-amber-300" />
              <span>1. Đặt Xe Limousine</span>
            </button>

            <button
              onClick={() => setActiveSubTab("ai")}
              className={`flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                activeSubTab === "ai"
                  ? "bg-[#1b4332] text-white shadow-md"
                  : "text-stone-600 hover:text-[#1b4332] hover:bg-stone-100"
              }`}
              id="subtab_ai"
            >
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin-slow" />
              <span>2. AI Lập Lịch Trình</span>
            </button>

            <button
              onClick={() => setActiveSubTab("my_tickets")}
              className={`flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all cursor-pointer relative ${
                activeSubTab === "my_tickets"
                  ? "bg-[#1b4332] text-white shadow-md"
                  : "text-stone-600 hover:text-[#1b4332] hover:bg-stone-100"
              }`}
              id="subtab_tickets"
            >
              <Ticket className="w-4 h-4 text-emerald-400" />
              <span>3. Vé & Đơn Của Tôi</span>
              {myBookings.length > 0 && (
                <span className="min-w-[16px] h-[16px] bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1">
                  {myBookings.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveSubTab("expenses")}
              className={`flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                activeSubTab === "expenses"
                  ? "bg-[#1b4332] text-white shadow-md"
                  : "text-stone-600 hover:text-[#1b4332] hover:bg-stone-100"
              }`}
              id="subtab_expenses"
            >
              <Calculator className="w-4 h-4 text-teal-400" />
              <span>4. Chi Phí Chuyến Đi</span>
            </button>

            <button
              onClick={() => setActiveSubTab("saved_trips")}
              className={`flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                activeSubTab === "saved_trips"
                  ? "bg-[#1b4332] text-white shadow-md"
                  : "text-stone-600 hover:text-[#1b4332] hover:bg-stone-100"
              }`}
              id="subtab_saved"
            >
              <Bookmark className="w-4 h-4 text-amber-300" />
              <span>5. Hành Trình Đã Lưu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Content Display */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-6">
        {/* SUBTAB 1: ĐẶT XE QT LIMOUSINE */}
        {activeSubTab === "limousine" && (
          <div className="space-y-6 animate-fade-in" id="trip_limousine_module">
            {/* Embedded Real Booking Switcher */}
            <BookingSwitcher
              initialSubTab="limousine"
              onAddBooking={onAddBooking}
              searchParams={limoSearch}
              onOpenPayment={onOpenPayment}
              bookings={bookings}
              blockedSeats={blockedSeats}
              currentUser={currentUser}
              coupons={coupons}
              locations={locations}
              limousineConfig={limousineConfig}
              sharedCarConfig={sharedCarConfig}
              onDeductPoints={onDeductPoints}
            />
          </div>
        )}

        {/* SUBTAB 2: AI LẬP LỊCH TRÌNH */}
        {activeSubTab === "ai" && (
          <div className="animate-fade-in" id="trip_ai_module">
            <AIPlanner />
          </div>
        )}

        {/* SUBTAB 3: VÉ & ĐƠN CỦA TÔI */}
        {activeSubTab === "my_tickets" && (
          <div className="space-y-6 animate-fade-in" id="trip_tickets_module">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-stone-200 text-left">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-stone-200">
                <div>
                  <h2 className="text-xl font-black text-stone-900 flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-emerald-700" />
                    <span>Vé và đơn hàng của tôi</span>
                  </h2>
                  <p className="text-xs text-stone-500 mt-1">
                    Danh sách vé Limousine & dịch vụ đặt thành công hoặc đang chờ xác nhận.
                  </p>
                </div>
                {!currentUser && (
                  <button
                    onClick={onOpenAuth}
                    className="px-4 py-2 bg-emerald-50 text-[#1b4332] border border-emerald-200 hover:bg-emerald-100 rounded-xl font-bold text-xs flex items-center space-x-1.5 cursor-pointer transition-colors"
                  >
                    <span>Đăng nhập để đồng bộ vé</span>
                  </button>
                )}
              </div>

              {myBookings.length === 0 ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-400">
                    <Ticket className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-stone-800">Bạn chưa có đơn đặt vé nào</h3>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    Đặt xe Limousine VIP đưa đón tận nơi chỉ trong 1 phút để trải nghiệm chuyến đi Mộc Châu trọn vẹn.
                  </p>
                  <button
                    onClick={() => setActiveSubTab("limousine")}
                    className="px-6 py-3 bg-[#1b4332] hover:bg-emerald-800 text-white rounded-xl font-extrabold text-xs shadow-md transition-colors cursor-pointer inline-flex items-center space-x-2"
                  >
                    <Bus className="w-4 h-4 text-amber-300" />
                    <span>Đặt Vé Xe Limousine Ngay</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
                  {myBookings.map((b) => (
                    <div
                      key={b.id}
                      className="border border-stone-200 rounded-2xl p-5 hover:border-emerald-500 hover:shadow-md transition-all bg-stone-50/60 relative flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                              MÃ ĐƠN: #{b.id.replace("bk_", "").toUpperCase()}
                            </span>
                            <h3 className="font-extrabold text-stone-900 text-sm mt-1.5">
                              {b.routeSelection || b.accommodationName || "Xe QT Limousine Mộc Châu"}
                            </h3>
                          </div>
                          <span
                            className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full border ${
                              b.status === "confirmed" || b.status === "success" || b.status === "completed"
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                : b.status === "pending"
                                ? "bg-amber-100 text-amber-800 border-amber-300 animate-pulse"
                                : "bg-red-100 text-red-800 border-red-300"
                            }`}
                          >
                            {b.status === "confirmed" || b.status === "success" || b.status === "completed"
                              ? "✓ Đã xác nhận"
                              : b.status === "pending"
                              ? "⏳ Chờ xác nhận"
                              : "✕ Đã hủy"}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs text-stone-600 pt-1">
                          <div>
                            <span className="text-[10px] text-stone-400 uppercase font-bold block">Ngày khởi hành</span>
                            <span className="font-bold text-stone-800">{b.travelDate}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-stone-400 uppercase font-bold block">Giờ xuất phát</span>
                            <span className="font-bold text-stone-800">{b.departureTime || "06:30"}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-stone-400 uppercase font-bold block">Số ghế</span>
                            <span className="font-bold text-emerald-800">
                              {b.seatNumbers?.length ? b.seatNumbers.join(", ") : `${b.seatCount || 1} chỗ`}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-stone-400 uppercase font-bold block">Tổng tiền</span>
                            <span className="font-mono font-black text-[#1b4332]">
                              {b.totalPrice ? `${b.totalPrice.toLocaleString()}đ` : "Thỏa thuận"}
                            </span>
                          </div>
                        </div>

                        {(b.pickupPoint || b.dropoffPoint) && (
                          <div className="bg-white p-2.5 rounded-xl border border-stone-200 text-xs space-y-1">
                            {b.pickupPoint && (
                              <p className="text-stone-700 truncate">
                                <strong className="text-emerald-800">Đón:</strong> {b.pickupPoint}
                              </p>
                            )}
                            {b.dropoffPoint && (
                              <p className="text-stone-700 truncate">
                                <strong className="text-emerald-800">Trả:</strong> {b.dropoffPoint}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="pt-4 mt-3 border-t border-stone-200 flex items-center justify-between gap-2">
                        <a
                          href="tel:0971050324"
                          className="flex items-center space-x-1 text-xs font-bold text-emerald-800 hover:underline"
                        >
                          <Phone className="w-3.5 h-3.5 text-amber-500" />
                          <span>Hỗ trợ: 0971.050.324</span>
                        </a>

                        {b.status === "pending" && (
                          <button
                            onClick={() => onOpenPayment(b)}
                            className="px-3.5 py-1.5 bg-[#1b4332] text-white text-xs font-bold rounded-lg hover:bg-emerald-800 transition-colors cursor-pointer"
                          >
                            Thanh Toán VietQR
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUBTAB 4: CHI PHÍ CHUYẾN ĐI (EXPENSE ESTIMATOR) */}
        {activeSubTab === "expenses" && (
          <div className="space-y-6 animate-fade-in" id="trip_expenses_module">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-stone-200 text-left">
              <div className="border-b border-stone-200 pb-4 mb-6">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md">
                  💡 CÔNG CỤ DỰ TOÁN CHI PHÍ DU LỊCH MỘC CHÂU
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-stone-900 mt-2">
                  Dự toán chi phí ngân sách chuyến đi
                </h2>
                <p className="text-xs text-stone-500 mt-1">
                  Nhập số lượng khách và tùy chỉnh từng danh mục để nhận bảng dự toán chính xác theo thời giá thực tế tại Mộc Châu.
                </p>
              </div>

              {/* Guest & Days Selector Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-stone-50 p-4 rounded-2xl border border-stone-200 mb-6">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Số lượng khách</label>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setPartyCount(prev => Math.max(1, prev - 1))}
                      className="w-9 h-9 bg-white border border-stone-200 rounded-xl flex items-center justify-center font-bold text-stone-700 hover:bg-emerald-50 cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={partyCount}
                      onChange={(e) => setPartyCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full text-center py-1.5 border border-stone-200 rounded-xl text-sm font-bold bg-white text-stone-900"
                    />
                    <button
                      type="button"
                      onClick={() => setPartyCount(prev => prev + 1)}
                      className="w-9 h-9 bg-white border border-stone-200 rounded-xl flex items-center justify-center font-bold text-stone-700 hover:bg-emerald-50 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Số ngày đi</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={numDays}
                    onChange={(e) => {
                      const d = Math.max(1, parseInt(e.target.value) || 1);
                      setNumDays(d);
                      setNumNights(Math.max(0, d - 1));
                    }}
                    className="w-full py-1.5 px-3 border border-stone-200 rounded-xl text-sm font-bold bg-white text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Số đêm lưu trú</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={numNights}
                    onChange={(e) => setNumNights(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full py-1.5 px-3 border border-stone-200 rounded-xl text-sm font-bold bg-white text-stone-900"
                  />
                </div>
              </div>

              {/* Expense Category Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 border border-stone-200 rounded-2xl bg-white space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-extrabold text-stone-800 flex items-center gap-1.5">
                      🚌 Di chuyển Limousine (khứ hồi/người)
                    </span>
                    <span className="font-bold text-emerald-800 font-mono">
                      {(expenses.transport * partyCount).toLocaleString()}đ
                    </span>
                  </div>
                  <input
                    type="number"
                    step="50000"
                    value={expenses.transport}
                    onChange={(e) => setExpenses({ ...expenses, transport: Number(e.target.value) || 0 })}
                    className="w-full p-2 border border-stone-200 rounded-xl text-xs font-semibold bg-stone-50"
                  />
                  <p className="text-[10px] text-stone-400">Mặc định: 600.000đ khứ hồi VIP 9 chỗ đón trả tận nơi</p>
                </div>

                <div className="p-4 border border-stone-200 rounded-2xl bg-white space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-extrabold text-stone-800 flex items-center gap-1.5">
                      🏨 Khách sạn / Homestay (/đêm)
                    </span>
                    <span className="font-bold text-amber-700 font-mono">
                      {(expenses.accommodation * numNights).toLocaleString()}đ
                    </span>
                  </div>
                  <input
                    type="number"
                    step="100000"
                    value={expenses.accommodation}
                    onChange={(e) => setExpenses({ ...expenses, accommodation: Number(e.target.value) || 0 })}
                    className="w-full p-2 border border-stone-200 rounded-xl text-xs font-semibold bg-stone-50"
                  />
                  <p className="text-[10px] text-stone-400">Mặc định: 800.000đ/đêm phòng đôi view đồi chè</p>
                </div>

                <div className="p-4 border border-stone-200 rounded-2xl bg-white space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-extrabold text-stone-800 flex items-center gap-1.5">
                      🍱 Ẩm thực & Bê chao (/người/ngày)
                    </span>
                    <span className="font-bold text-indigo-700 font-mono">
                      {(expenses.dining * partyCount * numDays).toLocaleString()}đ
                    </span>
                  </div>
                  <input
                    type="number"
                    step="50000"
                    value={expenses.dining}
                    onChange={(e) => setExpenses({ ...expenses, dining: Number(e.target.value) || 0 })}
                    className="w-full p-2 border border-stone-200 rounded-xl text-xs font-semibold bg-stone-50"
                  />
                  <p className="text-[10px] text-stone-400">Mặc định: 350.000đ/người/ngày (bê chao, cá suối, gà đồi)</p>
                </div>

                <div className="p-4 border border-stone-200 rounded-2xl bg-white space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-extrabold text-stone-800 flex items-center gap-1.5">
                      🎟️ Vé tham quan & Cầu kính (/người)
                    </span>
                    <span className="font-bold text-teal-700 font-mono">
                      {(expenses.sightseeing * partyCount).toLocaleString()}đ
                    </span>
                  </div>
                  <input
                    type="number"
                    step="50000"
                    value={expenses.sightseeing}
                    onChange={(e) => setExpenses({ ...expenses, sightseeing: Number(e.target.value) || 0 })}
                    className="w-full p-2 border border-stone-200 rounded-xl text-xs font-semibold bg-stone-50"
                  />
                  <p className="text-[10px] text-stone-400">Mặc định: 250.000đ/người (vé cầu kính Bạch Long, đồi chè, thác)</p>
                </div>
              </div>

              {/* Total Calculation Display Card */}
              <div className="bg-gradient-to-r from-[#1b4332] to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <span className="text-[11px] font-extrabold text-emerald-300 uppercase tracking-widest block">
                    📊 TỔNG NGÂN SÁCH DỰ DỰ DỰ TÍNH ({partyCount} KHÁCH • {numDays} NGHỆ {numNights} ĐÊM)
                  </span>
                  <div className="text-3xl sm:text-4xl font-black font-mono text-amber-300 mt-2">
                    {totalExpense.toLocaleString()} VNĐ
                  </div>
                  <p className="text-xs text-stone-200 mt-1">
                    Trung bình khoảng: <strong className="text-white font-mono text-sm">{perPersonExpense.toLocaleString()}đ</strong> / người.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
                  <button
                    onClick={() => setActiveSubTab("limousine")}
                    className="px-6 py-3.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-black rounded-2xl text-xs tracking-wide shadow-md transition-colors cursor-pointer text-center"
                  >
                    Đặt Limousine Ngay
                  </button>
                  <button
                    onClick={() => setActiveTab("combo")}
                    className="px-6 py-3.5 bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold rounded-2xl text-xs border border-emerald-500 shadow-md transition-colors cursor-pointer text-center"
                  >
                    Đặt Combo Xe + Khách Sạn (-20%)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 5: HÀNH TRÌNH ĐÃ LƯU */}
        {activeSubTab === "saved_trips" && (
          <div className="space-y-6 animate-fade-in" id="trip_saved_module">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-stone-200 text-left">
              <div className="border-b border-stone-200 pb-4 mb-6">
                <h2 className="text-xl font-black text-stone-900 flex items-center gap-2">
                  <Bookmark className="w-5 h-5 text-amber-500" />
                  <span>Hành trình và địa điểm đã lưu</span>
                </h2>
                <p className="text-xs text-stone-500 mt-1">
                  Danh sách các lịch trình tạo bởi AI hoặc địa điểm yêu thích bạn đã lưu trên thiết bị.
                </p>
              </div>

              {savedItineraries.length === 0 ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-500">
                    <Bookmark className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-stone-800">Chưa có hành trình nào được lưu</h3>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    Dùng công cụ AI Lập Lịch Trình để tự động tạo kế hoạch du lịch Mộc Châu và nhấn lưu lại để xem mọi lúc.
                  </p>
                  <button
                    onClick={() => setActiveSubTab("ai")}
                    className="px-6 py-3 bg-[#1b4332] hover:bg-emerald-800 text-white rounded-xl font-extrabold text-xs shadow-md transition-colors cursor-pointer inline-flex items-center space-x-2"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Tạo Lịch Trình AI Ngay</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {savedItineraries.map((itinerary: any) => (
                    <div
                      key={itinerary.id}
                      className="border border-stone-200 rounded-2xl p-5 hover:border-emerald-500 transition-all bg-stone-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                    >
                      <div>
                        <span className="text-[10px] font-extrabold uppercase text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md">
                          {itinerary.duration || "2 Ngày 1 Đêm"}
                        </span>
                        <h3 className="font-extrabold text-stone-900 text-base mt-1">
                          {itinerary.title || "Lịch Trình Khám Phá Mộc Châu"}
                        </h3>
                        <p className="text-xs text-stone-500 mt-0.5">
                          Tạo ngày: {itinerary.createdAt || "Hôm nay"} • {itinerary.style || "Thiên nhiên & Check-in"}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 w-full sm:w-auto shrink-0">
                        <button
                          onClick={() => {
                            setActiveSubTab("ai");
                          }}
                          className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition-colors cursor-pointer"
                        >
                          Xem chi tiết
                        </button>
                        <button
                          onClick={() => removeSavedTrip(itinerary.id)}
                          className="p-2 border border-stone-200 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                          title="Xóa hành trình"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
