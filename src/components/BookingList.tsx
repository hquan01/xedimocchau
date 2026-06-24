import React, { useState } from "react";
import { Booking } from "../types";
import { CalendarDays, MapPin, Ticket, User, Phone, Check, Trash2, X, Compass, Printer, Info, Search, Cloud, Sparkles, Hotel, Car, Gift, Tag, FileText } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { INITIAL_COMBOS } from "../data/combos";

interface BookingListProps {
  bookings: Booking[];
  isOpen: boolean;
  onClose: () => void;
  onCancelBooking: (id: string) => void;
  onDeleteBooking?: (id: string) => void;
}

// Simulated real-time centralized cloud reservation database for Xe Di Moc Chau
const CENTRAL_ONLINE_RESERVATIONS: Booking[] = [
  {
    id: "xdmc0324",
    type: "limousine",
    bookingDate: "19/05/2026",
    travelDate: "23/05/2026",
    passengerName: "Nguyễn Minh Quân",
    passengerPhone: "0971050324",
    passengerEmail: "hquansl001@gmail.com",
    pickupPoint: "Nhà hát Lớn Hà Nội (Quy trình xe du lịch)",
    dropoffPoint: "Thị trấn thị Mộc Châu (Trả tận nơi Khách sạn/Homestay miễn phí)",
    totalPrice: 640000,
    status: "success",
    seatNumbers: ["A3", "A4"],
    departureTime: "07:05",
    routeSelection: "Hà Nội - Mộc Châu"
  },
  {
    id: "xdmc8889",
    type: "combo",
    bookingDate: "18/05/2026",
    travelDate: "26/05/2026",
    returnDate: "28/05/2026",
    passengerName: "Trần Tiến Đạt",
    passengerPhone: "0855368889",
    passengerEmail: "dat.tran@gmail.com",
    pickupPoint: "Nhà hát Lớn Hà Nội (Quy trình xe du lịch)",
    dropoffPoint: "Cổng khu du lịch Rừng thông Bản Áng",
    totalPrice: 4380000,
    status: "success",
    comboId: "combo_1",
    accommodationName: "Phoenix Mộc Châu Resort",
    roomTypeName: "Bungalow Deluxe Rừng Thông",
    roomQuantity: 1,
    nights: 2
  },
  {
    id: "vip999",
    type: "limousine",
    bookingDate: "20/05/2026",
    travelDate: "24/05/2026",
    passengerName: "Lê Hoàng Yến",
    passengerPhone: "0987654321",
    passengerEmail: "hoangyen@gmail.com",
    pickupPoint: "Cổng khu du lịch Rừng thông Bản Áng",
    dropoffPoint: "Nhà hát Lớn Hà Nội (Quy trình xe du lịch)",
    totalPrice: 320000,
    status: "pending",
    seatNumbers: ["B2"],
    departureTime: "12:15",
    routeSelection: "Mộc Châu - Hà Nội"
  }
];

export default function BookingList({ bookings, isOpen, onClose, onCancelBooking, onDeleteBooking }: BookingListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "search">("all");
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePrint = (id: string) => {
    window.print();
  };

  const cleanQuery = (searchQuery || "").trim().toLowerCase().replace(/#/g, "");

  // 1. Matched in local device state
  const localMatched = bookings.filter((bk) => {
    if (!cleanQuery) return true;
    return (
      (bk.id || "").toLowerCase().includes(cleanQuery) ||
      (bk.passengerPhone || "").replace(/[\s\.\-]+/g, "").includes(cleanQuery.replace(/[\s\.\-]+/g, ""))
    );
  });

  // 2. Matched online database (only when searching)
  const onlineMatched = cleanQuery
    ? CENTRAL_ONLINE_RESERVATIONS.filter((bk) => {
        // Exclude duplicate key rendering
        const existsInLocal = bookings.some((l) => (l.id || "").toLowerCase() === (bk.id || "").toLowerCase());
        if (existsInLocal) return false;

        return (
          (bk.id || "").toLowerCase().includes(cleanQuery) ||
          (bk.passengerPhone || "").replace(/[\s\.\-]+/g, "").includes(cleanQuery.replace(/[\s\.\-]+/g, ""))
        );
      })
    : [];

  const combinedResults = [...localMatched, ...onlineMatched];
  const isSearchActive = cleanQuery.length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col justify-between text-left"
        id="bookings_list_modal"
      >
        <div>
          {/* Header row */}
          <div className="flex justify-between items-center border-b border-stone-200 pb-4 mb-4">
            <div>
              <h3 className="text-lg font-extrabold text-[#1b4332] flex items-center space-x-2">
                <Ticket className="w-5.5 h-5.5 text-emerald-600 animate-pulse" />
                <span>Tra Cứu Vé & Combo Xe Đi Mộc Châu</span>
              </h3>
              <p className="text-stone-400 text-xs font-sans mt-0.5">
                Xem nhanh trạng thái đặt chỗ, in vé điện tử hoặc quản lý hành trình di chuyển cao cấp.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-50 cursor-pointer"
              id="close_bookings_list_btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Search Control Panel */}
          <div className="bg-emerald-50/45 p-4 rounded-2xl border border-emerald-100 flex flex-col sm:flex-row gap-3 items-center mb-5" id="ticket_search_panel">
            <div className="w-10 h-10 rounded-xl bg-[#1b4332] text-white flex items-center justify-center shrink-0">
              <Search className="w-5 h-5" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <span className="block text-xs font-bold text-[#1b4332] uppercase tracking-wide">Bộ phận Tra Cứu Đơn Vé Điện Tử</span>
              <p className="text-[10px] text-stone-500 font-sans mt-0.5">
                Nhập số điện thoại (ví dụ: <span className="font-mono font-bold text-emerald-700">0971050324</span>) hoặc Mã GD để kiểm tra thông tin.
              </p>
            </div>
            <div className="relative w-full sm:w-auto flex items-center">
              <input
                type="text"
                placeholder="Nhập Mã vé hoặc SĐT..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-56 pl-3 pr-8 py-2 bg-white border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 text-stone-800"
                id="search_ticket_input"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 text-stone-400 hover:text-stone-600 text-xs px-1 cursor-pointer font-bold"
                  title="Xóa tìm kiếm"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Display search summary bar if searching */}
          {isSearchActive && (
            <div className="mb-4 flex items-center justify-between text-xs font-semibold text-stone-600 px-1">
              <span className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Tìm thấy <strong className="text-emerald-700 font-mono">{combinedResults.length}</strong> kết quả cho "<span className="text-stone-600 font-bold">{searchQuery}</span>"</span>
              </span>
              {onlineMatched.length > 0 && (
                <span className="text-[10px] bg-sky-50 text-[#0068ff] border border-sky-100 px-2 py-0.5 rounded-lg flex items-center space-x-1">
                  <Cloud className="w-3.5 h-3.5" />
                  <span>Đã đồng bộ từ Cloud</span>
                </span>
              )}
            </div>
          )}

          {/* Bookings loops */}
          <div className="space-y-4">
            {combinedResults.length === 0 ? (
              <div className="text-center py-12 text-stone-400 border border-dashed border-stone-200 rounded-2xl bg-stone-50/50">
                <Ticket className="w-10 h-10 mx-auto stroke-1 mb-2 opacity-30 text-[#1b4332]" />
                <h4 className="font-extrabold text-[#1b4332] text-xs sm:text-sm">Không tìm thấy đơn đặt xe nào</h4>
                <p className="text-[11px] text-stone-400 max-w-sm mx-auto font-sans mt-1 px-4 leading-relaxed">
                  {isSearchActive 
                    ? "Chúng tôi không tìm thấy vé nào khớp với thông tin bạn cung cấp. Vui lòng kiểm tra lại số điện thoại hoặc mã vé."
                    : "Bạn chưa thực hiện giao dịch đặt vé nào trên thiết bị này. Vui lòng nhập số điện thoại hoặc Mã vé để đồng bộ từ Cloud."
                  }
                </p>
                {isSearchActive && (
                  <div className="mt-4">
                    <button
                      onClick={() => setSearchQuery("")}
                      className="px-3.5 py-1.5 bg-[#1b4332] hover:bg-emerald-800 text-white font-bold text-[11px] rounded-lg cursor-pointer transition-all"
                    >
                      Quay lại danh sách
                    </button>
                  </div>
                )}
              </div>
            ) : (
              combinedResults.map((bk, idx) => {
                const isLimo = bk.type === 'limousine';
                const isFromCloud = onlineMatched.some((o) => o.id === bk.id);
                const isPastOrInactive = bk.status === "cancelled" || bk.status === "completed" || (() => {
                  try {
                    if (bk.travelDate) {
                      let parts: string[] = [];
                      if (bk.travelDate.includes("/")) parts = bk.travelDate.split("/");
                      else if (bk.travelDate.includes("-")) parts = bk.travelDate.split("-");
                      if (parts.length === 3) {
                        const dateObj = parts[0].length === 4 
                          ? new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
                          : new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                        if (dateObj && !isNaN(dateObj.getTime())) {
                          const today = new Date();
                          today.setHours(0,0,0,0);
                          return dateObj < today;
                        }
                      }
                    }
                  } catch(e) {}
                  return false;
                })();
                return (
                  <div
                    key={bk.id || `comb_res_${idx}`}
                    id={`saved_ticket_${bk.id}`}
                    className="border border-stone-200 rounded-2xl overflow-hidden relative shadow-xs hover:shadow-md transition-shadow bg-white"
                  >
                    {/* Top ticket strip bar */}
                    <div className={`px-4 py-2 text-white text-[11px] sm:text-xs font-bold flex justify-between items-center ${
                      isLimo ? "bg-gradient-to-r from-[#1b4332] to-emerald-800" : 
                      bk.type === 'shared_car' ? "bg-gradient-to-r from-sky-600 to-sky-700" :
                      "bg-gradient-to-r from-amber-600 to-amber-700"
                    }`}>
                      <div className="flex items-center space-x-1.5">
                        <span className="uppercase tracking-wider">
                          {isLimo ? "Vé Xe Limousine VIP" : bk.type === 'shared_car' ? "Vé Xe Ghép 7 Chỗ" : "Voucher Combo Xe + Phòng"}
                        </span>
                        {isFromCloud && (
                          <span className="bg-sky-400/90 text-stone-900 font-sans font-black text-[8px] px-1.5 py-0.2 rounded uppercase">
                            CLOUD
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[10px]">Mã GD: #{(bk.id || "").toUpperCase()}</span>
                    </div>

                    <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      <div className="md:col-span-8 space-y-3">
                        {/* Core Details */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span className="flex items-center space-x-1 font-sans text-xs font-bold text-[#1b4332]">
                            <CalendarDays className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Khởi hành: {bk.travelDate} {bk.departureTime && `lúc ${bk.departureTime}`}</span>
                          </span>
                          
                          {bk.returnDate && (
                            <span className="flex items-center space-x-1 font-sans text-xs font-bold text-[#1b4332]">
                              <CalendarDays className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>Về: {bk.returnDate}</span>
                            </span>
                          )}
                        </div>

                        {/* Location Details */}
                        <div className="space-y-1 border-t border-stone-100 pt-2.5">
                          <div className="flex items-start space-x-1.5 text-[11px] sm:text-xs text-stone-600">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span><b>Đón:</b> {bk.pickupPoint}</span>
                          </div>
                          <div className="flex items-start space-x-1.5 text-[11px] sm:text-xs text-stone-600">
                            <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                            <span><b>Trả:</b> {bk.dropoffPoint}</span>
                          </div>
                        </div>

                        {/* Passenger information block */}
                        <div className="bg-stone-50 p-2.5 rounded-xl grid grid-cols-2 gap-2 text-xs text-stone-600 border border-stone-200">
                          <div>
                            <span className="block text-[9px] text-stone-400 uppercase font-bold">Khách đặt</span>
                            <span className="font-bold text-[#1b4332]">{bk.passengerName}</span>
                          </div>
                          <div>
                            <span className="block text-[9px] text-stone-400 uppercase font-bold">Điện thoại</span>
                            <span className="font-mono font-semibold text-[#1b4332]">{bk.passengerPhone}</span>
                          </div>
                          
                          {isLimo ? (
                            <div className="col-span-2 pt-1.5 border-t border-stone-200/50">
                              <span className="block text-[9px] text-stone-400 uppercase font-bold">Số ghế đón nhận</span>
                              <span className="font-extrabold text-emerald-700 font-mono text-xs">{bk.seatNumbers?.join(", ")}</span>
                            </div>
                          ) : bk.type === 'shared_car' ? (
                            <div className="col-span-2 pt-1.5 border-t border-stone-200/50">
                              <span className="block text-[9px] text-stone-400 uppercase font-bold">Số ghế đặt xe ghép</span>
                              <span className="font-extrabold text-sky-700 text-xs">{bk.seatCount} ghế</span>
                            </div>
                          ) : (
                            <div className="col-span-2 pt-2 border-t border-stone-200/50 space-y-2">
                              {/* Combo Package Title Header */}
                              {(() => {
                                const matchedCombo = INITIAL_COMBOS.find((c) => c.id === bk.comboId);
                                return (
                                  <div className="bg-amber-50/70 rounded-xl p-2.5 border border-amber-100 space-y-2 text-stone-700">
                                    <div className="flex items-center space-x-1.5 text-amber-900 font-extrabold text-[11px] sm:text-xs">
                                      <Gift className="w-4 h-4 text-amber-600 shrink-0" />
                                      <span>Tên Gói: {matchedCombo ? matchedCombo.name : "Voucher Combo Xe Limousine + Phòng Khách Sạn"}</span>
                                    </div>
                                    
                                    {/* Hotel Information */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] sm:text-xs pt-1 border-t border-amber-200/40">
                                      <div className="flex items-start space-x-1.5">
                                        <Hotel className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                                        <span>
                                          <b>Nghỉ dưỡng tại:</b> <span className="text-stone-900 font-bold">{bk.accommodationName || "Khách sạn / Resort tiêu chuẩn"}</span>
                                        </span>
                                      </div>
                                      <div className="flex items-start space-x-1.5">
                                        <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                                        <span>
                                          <b>Chi tiết phòng:</b> <span className="text-stone-950 font-semibold">{bk.roomQuantity}x {bk.roomTypeName} ({bk.nights} Đêm)</span>
                                        </span>
                                      </div>
                                    </div>

                                    {/* Transport details */}
                                    <div className="pt-2 border-t border-amber-200/40 space-y-1">
                                      <div className="flex items-start space-x-1.5">
                                        <Car className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                                        <span>
                                          <b>Di chuyển:</b> Xe Limousine VIP khứ hồi (Hà Nội <span className="px-1 text-stone-400 font-light">⇄</span> Mộc Châu)
                                        </span>
                                      </div>
                                      {bk.seatNumbers && bk.seatNumbers.length > 0 && (
                                        <div className="pl-5 text-[10px] text-stone-500 font-sans flex flex-wrap gap-1">
                                          <span className="font-bold">Hành trình ghế:</span>
                                          {bk.seatNumbers.map((seat, sIdx) => (
                                            <span key={sIdx} className="bg-emerald-50 text-emerald-800 px-1.5 py-0.2 rounded font-medium border border-emerald-100">
                                              {seat}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>

                                    {/* Discounts and Promo codes details */}
                                    {(bk.couponCode || bk.discountAmount || bk.pointsDeducted) && (
                                      <div className="pt-2 border-t border-amber-200/40 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-stone-500">
                                        <div className="flex items-center space-x-1">
                                          <Tag className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                          <span>
                                            <b>Mã ưu đãi:</b> <span className="font-mono text-indigo-700 bg-indigo-50 px-1 rounded font-bold">{bk.couponCode || "Tích lũy điểm"}</span>
                                          </span>
                                        </div>
                                        {bk.discountAmount && bk.discountAmount > 0 && (
                                          <span>
                                            <b>Đã giảm giá:</b> <span className="text-emerald-700 font-bold">-{bk.discountAmount.toLocaleString()}đ</span>
                                          </span>
                                        )}
                                        {bk.pointsDeducted && bk.pointsDeducted > 0 && (
                                          <span>
                                            <b>Khấu trừ ví:</b> <span className="text-amber-700 font-bold">-{bk.pointsDeducted} điểm</span>
                                          </span>
                                        )}
                                      </div>
                                    )}

                                    {/* Guest Notes */}
                                    {bk.notes && (
                                      <div className="pt-2 border-t border-amber-200/40 flex items-start space-x-1.5 text-[10px] text-stone-500">
                                        <FileText className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5" />
                                        <span>
                                          <b>Ghi chú đặc biệt:</b> <span className="italic font-sans text-stone-600">"{bk.notes}"</span>
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right bar price, barcode and status actions */}
                      <div className="md:col-span-4 border-l-0 md:border-l border-dashed border-stone-200 pl-0 md:pl-4 flex flex-col justify-between items-center text-center space-y-3">
                        <div className="space-y-1">
                          <span className="text-[9px] uppercase font-bold text-stone-400">Tổng thanh toán</span>
                          <span className="block font-mono text-base sm:text-lg font-extrabold text-[#1b4332]">
                            {bk.totalPrice.toLocaleString()}đ
                          </span>
                          
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            bk.status === "success"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : bk.status === "completed"
                              ? "bg-blue-50 text-blue-800 border border-blue-200"
                              : bk.status === "pending"
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : "bg-red-50 text-red-800 border border-red-200"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                              bk.status === "success"
                                ? "bg-emerald-500"
                                : bk.status === "completed"
                                ? "bg-blue-500"
                                : bk.status === "pending"
                                ? "bg-amber-500 animate-ping"
                                : "bg-red-500"
                            }`} />
                            <span>
                              {bk.status === "success" ? "Đã xác nhận" : 
                               bk.status === "completed" ? "Đã hoàn thành" : 
                               bk.status === "pending" ? "Chờ chuyển khoản" : "Đã hủy"}
                            </span>
                          </span>
                        </div>

                        {/* Interactive Barcode Graphic representing ticketing system */}
                        <div className="hidden sm:block">
                          <div className="h-6 w-24 bg-stone-900 mx-auto flex flex-col justify-center items-center rounded text-white tracking-widest text-[7px] select-none text-center leading-none">
                            || ||| | || | ||| ||
                          </div>
                          <span className="text-[7px] text-stone-400 font-mono mt-0.5 uppercase tracking-widest block">MC-E-TICKET</span>
                        </div>

                        {/* Quick action triggers */}
                        <div className="flex space-x-1.5 w-full justify-center">
                          <button
                            onClick={() => handlePrint(bk.id)}
                            className="p-1 px-2.5 border border-stone-200 hover:text-[#1b4332] hover:bg-emerald-50 hover:border-emerald-500 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer"
                            title="Xác nhận in vé"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>In Vé</span>
                          </button>
                          
                          {bk.status !== "cancelled" && !isFromCloud && (
                            <button
                              onClick={() => {
                                if (confirmCancelId === bk.id) {
                                  onCancelBooking(bk.id);
                                  setConfirmCancelId(null);
                                } else {
                                  setConfirmCancelId(bk.id);
                                  setTimeout(() => setConfirmCancelId(null), 4000);
                                }
                              }}
                              className={`p-1 px-2 border rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer ${
                                confirmCancelId === bk.id 
                                  ? "bg-red-600 border-red-600 text-white hover:bg-red-700" 
                                  : "border-red-200 text-red-600 hover:bg-red-50 hover:border-red-400"
                              }`}
                              title={confirmCancelId === bk.id ? "Bấm một lần nữa để xác nhận hủy đặt chỗ!" : "Hủy đặt chỗ"}
                              id={`cancel_btn_${bk.id}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{confirmCancelId === bk.id ? "Xác nhận hủy!" : "Hủy"}</span>
                            </button>
                          )}

                          {isPastOrInactive && onDeleteBooking && (
                            <button
                              onClick={() => {
                                if (confirmDeleteId === bk.id) {
                                  onDeleteBooking(bk.id);
                                  setConfirmDeleteId(null);
                                } else {
                                  setConfirmDeleteId(bk.id);
                                  setTimeout(() => setConfirmDeleteId(null), 4000);
                                }
                              }}
                              className={`p-1 px-2.5 border rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer ${
                                confirmDeleteId === bk.id 
                                  ? "bg-red-600 border-red-650 text-white hover:bg-red-700" 
                                  : "border-red-200 text-red-650 hover:bg-red-50 hover:border-red-400"
                              }`}
                              title={confirmDeleteId === bk.id ? "Bấm một lần nữa để xác nhận xóa vĩnh viễn vé này khỏi thiết bị!" : "Xóa vĩnh viễn vé này"}
                              id={`delete_btn_${bk.id}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{confirmDeleteId === bk.id ? "Xác nhận xóa!" : "Xóa vé"}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Small Bottom Information bar */}
        <div className="mt-6 border-t border-stone-200 pt-3 flex items-start space-x-2 text-[10px] text-stone-400 leading-normal font-sans">
          <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            Vé được số hóa bởi hệ thống Xe Đi Mộc Châu. Nếu quý khách chuyển khoản sai cú pháp hoặc muốn thay đổi điểm đón đưa muộn/sớm, vui lòng cung cấp Mã GD qua hotline 0971.050.324 / 0855.368.889 để điều hành viên kịp thời hỗ trợ tức thì.
          </span>
        </div>
      </motion.div>
    </div>
  );
}

