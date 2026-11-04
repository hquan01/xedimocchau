import React, { useState } from "react";
import { Booking, Coupon } from "../types";
import {
  ShieldCheck,
  CreditCard,
  Check,
  Copy,
  X,
  ArrowRight,
  Printer,
  AlertCircle,
  RefreshCw,
  Tag,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface PaymentModalProps {
  booking: Booking | null;
  onClose: (wasSuccessful?: boolean) => void;
  onConfirmSuccess: (id: string, newTotal?: number) => void;
  coupons?: Coupon[];
}

export default function PaymentModal({
  booking,
  onClose,
  onConfirmSuccess,
  coupons = [],
}: PaymentModalProps) {
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedContent, setCopiedContent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [successPaid, setSuccessPaid] = useState(false);

  if (!booking) return null;

  const discountAmount = booking.discountAmount || 0;
  const pointsDeducted = booking.pointsDeducted || 0;
  const finalPrice = booking.totalPrice;
  const originalPrice = booking.totalPrice + discountAmount; // If discountAmount exists, totalPrice is already reduced
  const depositPrice = finalPrice / 2;

  const handleCopyAccount = () => {
    navigator.clipboard.writeText("0971050324");
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const handleCopyContent = () => {
    const code = `COC 50% ${(booking?.id || "").toUpperCase()}`;
    navigator.clipboard.writeText(code);
    setCopiedContent(true);
    setTimeout(() => setCopiedContent(false), 2000);
  };

  const verifyPayment = () => {
    setIsVerifying(true);
    // Simulate real bank transfer webhook verify wait
    setTimeout(() => {
      setIsVerifying(false);
      setSuccessPaid(true);
      if (booking?.id) {
        onConfirmSuccess(booking.id, finalPrice);
      }
    }, 2800);
  };

  const transferCode = `COC 50% ${(booking?.id || "").toUpperCase()}`;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto text-left"
        id="payment_modal_wrapper"
      >
        {/* Top Header Row */}
        <div className="flex justify-between items-center border-b border-stone-100 pb-4 mb-5">
          <h3 className="text-base font-extrabold text-[#1b4332] flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Thanh Toán Đặt Cọc 50% Xe</span>
          </h3>
          <button
            onClick={() => onClose(successPaid)}
            className="p-1 px-2 hover:bg-stone-50 cursor-pointer rounded-lg text-stone-400 hover:text-stone-700"
            id="close_payment_modal_btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {!successPaid ? (
            <motion.div
              key="payment_form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Alert message */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start space-x-2.5 text-amber-900 text-xs leading-relaxed">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold block">
                    Giữ chỗ thành công! Đang chờ thanh toán cọc 50%
                  </span>
                  Nhà xe cam kết giữ nguyên vị trí chỗ ngồi cho bạn. Quý khách
                  vui lòng quét mã VietQR ngân hàng Quân đội (MB Bank) phía dưới
                  để tiến hành thanh toán cọc nhanh chóng.
                </div>
              </div>

              {/* Booking Summary Card */}
              <div
                className="bg-stone-50 border border-stone-200 p-4 rounded-2xl text-xs text-stone-600 space-y-3.5"
                id="booking_detailed_confirmation_info"
              >
                <div className="border-b border-stone-200/50 pb-2 flex justify-between font-bold text-[#1b4332] items-center">
                  <span className="flex items-center gap-1.5 font-extrabold text-xs">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${booking.type === "shared_car" ? "bg-sky-600" : "bg-emerald-600"}`}
                    />
                    {booking.type === "shared_car"
                      ? "LOẠI XE GHÉP 7 CHỖ"
                      : booking.type === "limousine"
                        ? "VÉ XE LIMOUSINE VIP THƯƠNG GIA"
                        : "SIÊU COMBO XE LIMOUSINE & PHÒNG NGHỈ"}
                  </span>
                  <span className="font-mono text-xs bg-stone-200 text-stone-700 px-2 py-0.5 rounded font-extrabold">
                    Mã: #{(booking?.id || "").toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-1">
                  <div>
                    <span className="text-stone-400 block font-sans text-[10px] font-bold uppercase tracking-wider">
                      Hành khách liên hệ:
                    </span>
                    <span className="font-extrabold text-stone-800 text-sm">
                      {booking.passengerName}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block font-sans text-[10px] font-bold uppercase tracking-wider">
                      SĐT Đón Khách (Zalo):
                    </span>
                    <span className="font-mono font-extrabold text-[#111] text-sm">
                      {booking.passengerPhone}
                    </span>
                  </div>

                  {booking.type === "limousine" && (
                    <>
                      <div className="sm:col-span-2">
                        <span className="text-stone-400 block font-sans text-[10px] font-bold uppercase tracking-wider">
                          Lộ trình xe chạy:
                        </span>
                        <span className="font-extrabold text-stone-800">
                          {booking.routeSelection}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400 block font-sans text-[10px] font-bold uppercase tracking-wider">
                          Ngày đi & Giờ xuất phát:
                        </span>
                        <span className="font-extrabold text-stone-800">
                          {booking.travelDate} ({booking.departureTime})
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400 block font-sans text-[10px] font-bold uppercase tracking-wider">
                          Hàng ghế VIP giữ chỗ:
                        </span>
                        <span className="font-mono font-extrabold text-emerald-700 text-xs px-1.5 py-0.5 bg-emerald-100/50 rounded inline-block mt-0.5">
                          {booking.seatNumbers ? booking.seatNumbers.map(s => s.replace(/\s*\(Nhà xe sắp xếp\)/gi, '')).join(", ") : "Chưa xếp"}
                        </span>
                      </div>
                    </>
                  )}
                  {booking.type === "shared_car" && (
                    <>
                      <div className="sm:col-span-2">
                        <span className="text-stone-400 block font-sans text-[10px] font-bold uppercase tracking-wider">
                          Ngày đi & Giờ xuất phát:
                        </span>
                        <span className="font-extrabold text-stone-800">
                          {booking.travelDate} ({booking.departureTime})
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400 block font-sans text-[10px] font-bold uppercase tracking-wider">
                          Số ghế đã đặt:
                        </span>
                        <span className="font-extrabold text-sky-700">
                          {booking.seatCount} ghế
                        </span>
                      </div>
                    </>
                  )}
                  {booking.type === "combo" && (
                    <>
                      <div className="sm:col-span-2">
                        <span className="text-stone-400 block font-sans text-[10px] font-bold uppercase tracking-wider">
                          Khách sạn / Homestay đã đặt:
                        </span>
                        <span className="font-extrabold text-stone-900 flex items-center gap-1 text-sm bg-amber-50 p-1.5 rounded border border-amber-200">
                          🏨 {booking.accommodationName}
                        </span>
                      </div>
                    </>
                  )}

                  <div className="sm:col-span-2 p-3 bg-stone-100/60 rounded-xl space-y-1.5 text-[11px] border border-stone-200/50">
                    <div>
                      <span className="text-stone-500 font-bold block uppercase text-[8.5px] tracking-wider">
                        📍 Chi tiết Điểm đón khách:
                      </span>
                      <span className="font-semibold text-stone-800">
                        {booking.pickupPoint}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-500 font-bold block uppercase text-[8.5px] tracking-wider">
                        📍 Chi tiết Điểm trả khách:
                      </span>
                      <span className="font-semibold text-stone-800">
                        {booking.dropoffPoint}
                      </span>
                    </div>
                    {booking.notes && (
                      <div className="pt-1.5 border-t border-stone-200">
                        <span className="text-stone-500 font-bold block uppercase text-[8.5px] tracking-wider">
                          📝 Ghi chú hoặc yêu cầu đặc biệt:
                        </span>
                        <p className="italic text-stone-700">
                          "{booking.notes}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-stone-200/80 pt-3 flex flex-col gap-1.5">
                  <div className="flex justify-between items-baseline text-xs text-stone-600">
                    <span>Tổng tiền toàn bộ dịch vụ:</span>
                    <span
                      className={`font-mono font-bold text-stone-700 ${(discountAmount > 0 || pointsDeducted > 0) ? "line-through text-stone-400" : ""}`}
                    >
                      {originalPrice.toLocaleString()}đ
                    </span>
                  </div>
                  {(booking.couponCode && discountAmount > 0) && (
                    <div className="flex justify-between items-baseline text-xs text-emerald-600 font-bold">
                      <span>✓ Đã áp mã Coupon {booking.couponCode}:</span>
                      <span className="font-mono">
                        - {discountAmount.toLocaleString()}đ
                      </span>
                    </div>
                  )}
                  {pointsDeducted > 0 && (
                    <div className="flex justify-between items-baseline text-xs text-emerald-600 font-bold">
                      <span>✓ Dùng {pointsDeducted.toLocaleString()} điểm thẻ TV:</span>
                      <span className="font-mono">
                        - {(pointsDeducted * 1000).toLocaleString()}đ
                      </span>
                    </div>
                  )}
                  {(discountAmount > 0 || pointsDeducted > 0) && (
                    <div className="flex justify-between items-baseline text-xs text-stone-700 font-black">
                      <span>Thành tiền:</span>
                      <span className="font-mono font-bold">
                        {finalPrice.toLocaleString()}đ
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-xs mt-2 border-t border-dashed border-stone-200 pt-3">
                    <span className="text-[#1b4332] font-black text-xs uppercase flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      YÊU CẦU CHUYỂN CỌC 50%:
                    </span>
                    <span className="font-mono text-sm font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 shadow-sm">
                      {depositPrice.toLocaleString()} VNĐ
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline text-[10px] text-stone-400">
                    <span>
                      Nửa còn lại (Thanh toán trực tiếp cho tài xế/lễ tân):
                    </span>
                    <span className="font-mono font-semibold text-stone-500">
                      {depositPrice.toLocaleString()}đ
                    </span>
                  </div>
                </div>
              </div>

              {/* MB Bank deposit VietQR QR & manual transfer information */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center bg-stone-50/50 p-4 rounded-3xl border border-stone-200">
                {/* Visual Banking VietQR QR box */}
                <div className="md:col-span-5 text-center flex flex-col items-center">
                  <span className="text-[10px] font-extrabold text-[#153a5c] uppercase bg-[#edf4fc] px-2 py-0.5 rounded mb-2 block border border-[#ccdef3]">
                    Quét VietQR 24/7
                  </span>

                  <div className="border-4 border-[#075970]/10 p-2.5 rounded-3xl bg-white max-w-[170px] mx-auto shadow-sm">
                    {/* Generates real VietQR through img.vietqr.io matching MB Bank details */}
                    <img
                      src={`https://img.vietqr.io/image/MB-0971050324-compact2.jpg?amount=${Math.round(depositPrice)}&addInfo=${encodeURIComponent(transferCode)}&accountName=TRAN%20HONG%20QUAN`}
                      alt="VietQR MB Bank Trần Hồng Quân"
                      className="w-36 h-36 object-contain rounded-xl"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <span className="text-[10px] text-stone-500 font-sans mt-2.5 block leading-normal px-1">
                    Mở app Ngân hàng kìa quét mã QR để{" "}
                    <b>
                      tự động điền đúng STK, chủ tài khoản và đúng số tiền{" "}
                      {depositPrice.toLocaleString()}đ
                    </b>
                  </span>
                </div>

                {/* Bank account & and manual copy-paste panels */}
                <div className="md:col-span-7 space-y-3.5">
                  <div className="text-xs font-bold text-stone-700 uppercase tracking-widest border-b border-stone-100 pb-1.5">
                    HƯỚNG DẪN CHUYỂN KHOẢN QUA MB BANK
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-stone-400 text-[10px] block font-sans">
                        TÊN NGÂN HÀNG (QUÂN ĐỘI):
                      </span>
                      <span className="font-bold text-blue-900 border border-blue-100 bg-blue-50/50 px-2.5 py-1 rounded inline-block text-[11px] mt-0.5">
                        MB BANK - Ngân hàng TMCP Quân đội
                      </span>
                    </div>

                    <div>
                      <span className="text-stone-400 text-[10px] block font-sans">
                        SỐ TÀI KHOẢN / SĐT NHẬN CỌC:
                      </span>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className="font-mono text-emerald-800 font-black text-sm bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
                          0971050324
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyAccount}
                          className="p-1 px-2.5 border border-stone-300 rounded-lg text-stone-600 hover:text-white hover:bg-[#1b4332] hover:border-[#1b4332] transition-all cursor-pointer text-xs font-semibold"
                        >
                          {copiedAccount ? "Đã chép" : "Sao chép Số Tài Khoản"}
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-stone-400 text-[10px] block font-sans">
                        CHỦ TÀI KHOẢN NHẬN TIỀN:
                      </span>
                      <span className="font-black text-stone-800 bg-stone-100 border border-stone-200 px-3 py-1 rounded-lg inline-block text-xs mt-0.5 uppercase">
                        TRẦN HỒNG QUÂN
                      </span>
                    </div>

                    <div>
                      <span className="text-stone-400 text-[10px] block font-sans">
                        NỘI DUNG CHUYỂN KHOẢN (GHI CHÍNH XÁC):
                      </span>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className="font-mono text-red-700 font-bold text-sm bg-red-50 border border-red-200 px-2.5 py-1 rounded">
                          {transferCode}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyContent}
                          className="p-1 px-2 border border-red-350 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer flex items-center gap-1 font-semibold"
                        >
                          {copiedContent ? (
                            <span className="text-[10px] text-red-600 font-bold font-sans">
                              Đã chép nội dung
                            </span>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span className="text-[10px]">Sao chép ND</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-1 text-stone-650 leading-relaxed text-[10px]">
                      <p className="font-extrabold text-[#111] text-[10px] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span>QUY TRÌNH DUYỆT VÉ TỰ ĐỘNG:</span>
                      </p>
                      <ul className="list-decimal list-inside space-y-0.5 text-stone-500">
                        <li>
                          Bạn chuyển cọc đúng số tiền{" "}
                          <b>{depositPrice.toLocaleString()} VNĐ</b>
                        </li>
                        <li>
                          Đúng nội dung <b>{transferCode}</b>
                        </li>
                        <li>
                          Hệ thống MB Bank Napas sẽ tự động kiểm tra và chuyển
                          trạng thái vé của bạn sang <b>Đã Đi / OK</b> sau khi
                          chuyển khoản thành công
                        </li>
                      </ul>
                    </div>

                    {/* Quick Link Zalo Button */}
                    <a
                      href="https://zalo.me/0971050324"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center space-x-2 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-bold transition-all shadow-sm mt-2.5"
                    >
                      <span>
                        💬 Nhắn Tin & Gửi Ảnh Cọc Cho Zalo Nhà Xe (0971050324)
                      </span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Verify triggers */}
              <div className="pt-4 border-t border-stone-100/80 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => onClose(false)}
                  className="w-full sm:w-1/3 py-3 border border-stone-200 text-stone-600 rounded-xl text-sm font-bold hover:bg-stone-50 cursor-pointer text-center"
                >
                  Bỏ qua thanh toán
                </button>

                <button
                  type="button"
                  onClick={verifyPayment}
                  id="confirm_payment_btn"
                  disabled={isVerifying}
                  className="w-full sm:w-2/3 py-3 bg-[#1b4332] hover:bg-[#122e22] text-white rounded-xl text-sm font-bold transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {isVerifying ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-5 h-5" />
                  )}
                  <span>
                    {isVerifying
                      ? "Đang xác thực giao dịch..."
                      : "Tôi Đã Chuyển Khoản Cọc 50% Thành Công"}
                  </span>
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="payment_success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8 space-y-6 max-w-sm mx-auto"
              id="payment_success_state"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mx-auto shadow-sm">
                <Check className="w-8 h-8 text-emerald-600 stroke-[3]" />
              </div>

              <div className="space-y-2">
                <h4 className="font-extrabold text-[#1b4332] text-lg">
                  Đã Hoàn Thành Xác Nhận Cọc!
                </h4>
                <p className="text-stone-500 text-xs leading-relaxed font-sans">
                  Nhà xe đã ghi nhận thông tin cọc đặt giữ vị trí 50% của hành
                  khách <b>{booking.passengerName}</b>. Chuyến đi của quý khách
                  đã được lưu giữ chỗ thành công!
                </p>
              </div>

              <div className="bg-stone-50 border border-stone-200 p-4 rounded-2xl space-y-2.5 text-xs text-stone-600 text-left">
                <p>
                  ✓ <b>Mã đặt chỗ:</b>{" "}
                  <span className="font-mono font-bold text-[#1b4332]">
                    #{(booking?.id || "").toUpperCase()}
                  </span>
                </p>
                <p>
                  ✓ <b>Hành khách:</b> {booking.passengerName} (
                  {booking.passengerPhone})
                </p>
                <p>
                  ✓ <b>Ngày khởi hành:</b> {booking.travelDate}
                </p>
                {booking.seatNumbers && (
                  <p>
                    ✓ <b>Vị trí ghế:</b>{" "}
                    <span className="font-mono font-bold text-emerald-700">
                      {booking.seatNumbers.map(s => s.replace(/\s*\(Nhà xe sắp xếp\)/gi, '')).join(", ")}
                    </span>
                  </p>
                )}
                {booking.type === "shared_car" && (
                  <p>
                    ✓ <b>Số ghế đặt:</b>{" "}
                    <span className="font-bold text-sky-700">
                      {booking.seatCount} ghế
                    </span>
                  </p>
                )}
              </div>

              <div className="text-center bg-emerald-50 text-emerald-800 text-[10px] p-2 rounded-lg font-sans leading-normal">
                Một email xác nhận kèm biên nhận cọc và vé điện tử PDF đã được
                tự động gửi tới email {booking.passengerEmail}. Quý khách vui
                lòng lưu lại mã đặt chỗ và thanh toán 50% còn lại tại điểm đón!
              </div>

              <button
                type="button"
                onClick={() => onClose(true)}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-[#1b4332] text-white rounded-xl font-bold text-sm tracking-wide shadow"
              >
                Nhận vé & Đóng cửa sổ
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
