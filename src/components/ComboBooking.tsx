import React, { useState, useEffect } from "react";
import { Accommodation, TourCombo, User, LocationPoint } from "../types";
import { Compass, Check, Phone, ShieldCheck, Mail, Star, Users, MapPin, CalendarDays, Ticket, ArrowRight, Sparkles, Building, Award, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ComboBookingProps {
  onAddBooking: (booking: any) => void;
  searchParams: { hotelId: string; date: string; from?: string; to?: string; time?: string } | null;
  onOpenPayment: (booking: any) => void;
  currentUser: User | null;
  bookings: any[];
  onDeductPoints: (deducted: number) => void;
  combos: TourCombo[];
  accommodations: Accommodation[];
  locations: LocationPoint[];
  coupons?: any[];
}

const PICKUP_POINTS_HN = [
  "BigC Thăng Long (Cổng sau) — Điểm đón xe cố định",
  "Thành phố Hoàng gia (Cổng chính) — Điểm đón xe cố định",
  "Ngõ 90 Nguyễn Tuân — Điểm đón xe cố định",
  "Đón/trả tận nơi tại Hà Nội (Phụ phí 50k - 150k tùy từng điểm)"
];

const DROPOFF_POINTS_MC = [
  "Thị trấn thị Mộc Châu (Trả tận nơi Khách sạn/Homestay miễn phí)",
  "Cổng khu du lịch Thác Dải Yếm (Có phụ phí)",
  "Cổng khu du lịch Rừng thông Bản Áng",
  "Văn phòng Xe Đi Mộc Châu (Ngã ba bản Áng, ngã ba thị trấn)",
  "Cầu Kính Bạch Long (Mường Sang, có phụ phí)"
];

export default function ComboBooking({ onAddBooking, searchParams, onOpenPayment, currentUser, bookings, onDeductPoints, combos, accommodations, locations, coupons = [] }: ComboBookingProps) {
  const [selectedCombo, setSelectedCombo] = useState<TourCombo | null>(null);
  const [selectedAcc, setSelectedAcc] = useState<Accommodation | null>(null);
  const [detailCombo, setDetailCombo] = useState<TourCombo | null>(null);
  const [usePoints, setUsePoints] = useState(false);

  // Coupon state
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState("");

  const handleApplyCoupon = () => {
    setCouponError("");
    if (!couponCodeInput.trim()) return;
    
    // Find published coupon
    const found = coupons?.find(c => c.code.toUpperCase() === couponCodeInput.trim().toUpperCase() && c.isActive !== false);
    
    if (found) {
       // Check if this coupon is already used by currentUser
       if (currentUser && currentUser.usedCoupons?.includes(found.code.toUpperCase())) {
          setCouponError("Bạn đã sử dụng mã giảm giá này rồi.");
          return;
       }
       setAppliedCoupon(found);
    } else {
       setCouponError("Mã giảm giá không hợp lệ hoặc chưa công bố!");
    }
  };

  const userBookingsCount = (bookings || []).filter((b: any) => 
    b.status !== "cancelled" && (
      (currentUser && b.userId === currentUser.id) || 
      (currentUser?.phone && b.passengerPhone === currentUser.phone)
    )
  ).length;
  const usablePoints = currentUser ? Math.min(1000, Math.floor(currentUser.points / 50) * 50) : 0;
  const isEligibleForPointsDeduction = usablePoints >= 50 && currentUser?.role === "customer";

  // Booking details configuration
  const [nights, setNights] = useState(1);
  const [roomTypeIndex, setRoomTypeIndex] = useState(0);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [travelDate, setTravelDate] = useState("");
  
  // Passenger contact form - empty strings by default
  const [passengerName, setPassengerName] = useState("");
  const [passengerPhone, setPassengerPhone] = useState("");
  const [passengerEmail, setPassengerEmail] = useState("");
  const [pickupPoint, setPickupPoint] = useState("");
  const [dropoffPoint, setDropoffPoint] = useState("");
  const [travelTime, setTravelTime] = useState("");
  const [customHanoiAddress, setCustomHanoiAddress] = useState("");
  const [notes, setNotes] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mathA] = useState(() => Math.floor(Math.random() * 9) + 2);
  const [mathB] = useState(() => Math.floor(Math.random() * 9) + 2);
  const [spamAnswer, setSpamAnswer] = useState("");

  // Sync search parameters when user searches on Hero
  useEffect(() => {
    if (searchParams) {
      if (searchParams.date) setTravelDate(searchParams.date);
      if (searchParams.from) setPickupPoint(searchParams.from);
      if (searchParams.to) setDropoffPoint(searchParams.to);
      if (searchParams.time) setTravelTime(searchParams.time);
    }
  }, [searchParams]);

  // Auto populate passenger details when currentUser is logged in
  useEffect(() => {
    if (currentUser && currentUser.role === "customer") {
      setPassengerName(currentUser.name);
      setPassengerPhone(currentUser.phone);
      setPassengerEmail(currentUser.email || "");

      if (currentUser.favPickup) setPickupPoint(currentUser.favPickup);
      if (currentUser.favDropoff) setDropoffPoint(currentUser.favDropoff);
    }
  }, [currentUser]);

  const handleSelectCombo = (combo: TourCombo) => {
    setSelectedCombo(combo);
    const acc = accommodations.find((a) => a.id === combo.accommodationId);
    if (acc) {
      setSelectedAcc(acc);
      // Select first room type by default
      setRoomTypeIndex(0);
    }
  };

  const calculateTotalComboPrice = () => {
    if (!selectedCombo || !selectedAcc) return 0;
    
    // Determine price based on selected travel date (Weekday/Weekend)
    let currentPricePerPerson = selectedCombo.pricePerPerson;
    if (travelDate) {
      const date = new Date(travelDate);
      const day = date.getDay(); // 0 is Sunday, 1-4 is Mon-Thu, 5-6 is Fri-Sat
      
      // User requested: Mon-Thu (1-4) is Weekday, Fri-Sun (5,6,0) is Weekend
      if (day >= 1 && day <= 4) {
        currentPricePerPerson = selectedCombo.priceWeekday || selectedCombo.pricePerPerson;
      } else {
        currentPricePerPerson = selectedCombo.priceWeekend || selectedCombo.pricePerPerson;
      }
    }
    
    const payingPassengers = adults + children; // Children >= 4 paid full
    const baseComboPriceForGroup = currentPricePerPerson * payingPassengers;

    // Surcharge for extra nights:
    const extraNights = nights - 1;
    const roomRatePerNight = selectedAcc.roomTypes[roomTypeIndex].pricePerNight;
    const roomQuantityNeeded = Math.ceil(payingPassengers / 2);
    const extraNightsSurcharge = extraNights > 0 ? (roomRatePerNight * extraNights * roomQuantityNeeded) : 0;

    return baseComboPriceForGroup + extraNightsSurcharge;
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (isSubmitting) return;

    if (!selectedCombo || !selectedAcc) return;

    const trimmedName = passengerName.trim();
    if (!trimmedName) {
      setErrorMsg("Vui lòng nhập họ và tên hành khách!");
      return;
    }
    const nameRegex = /^[a-zA-ZÀ-ỹ\s]{2,50}$/;
    if (!nameRegex.test(trimmedName)) {
      setErrorMsg("Họ và tên trưởng đoàn không hợp lệ! Vui lòng nhập đầy đủ chữ cái tiếng Việt có dâu/không dấu (2 - 50 ký tự), không chứ số hay ký tự đặc biệt.");
      return;
    }

    const trimmedPhone = passengerPhone.trim();
    if (!trimmedPhone) {
      setErrorMsg("Vui lòng điền số điện thoại để nhà xe và khách sạn liên hệ!");
      return;
    }
    const phoneRegex = /^(0|\+84)(3|5|7|8|9|2)[0-9]{8}$/;
    if (!phoneRegex.test(trimmedPhone)) {
      setErrorMsg("Số điện thoại không đúng định dạng Việt Nam! SĐT ví dụ: 0971050324, 038xxx...");
      return;
    }

    const trimmedEmail = passengerEmail.trim();
    if (trimmedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        setErrorMsg("Địa chỉ email không đúng định dạng (Ví dụ: khach@gmail.com)!");
        return;
      }
    }

    const systemToday = new Date().toISOString().split('T')[0];
    if (travelDate < systemToday) {
      setErrorMsg("Ngày khởi hành không được phép chọn ngày trong quá khứ!");
      return;
    }
    if (travelDate === systemToday) {
      const liveD = new Date();
      const currentResStr = `${String(liveD.getHours()).padStart(2, '0')}:${String(liveD.getMinutes()).padStart(2, '0')}`;
      if (travelTime < currentResStr) {
        setErrorMsg("Giờ khởi hành mong muốn đã diễn ra ở quá khứ! Vui lòng điều chỉnh lại giờ hẹn đón.");
        return;
      }
    }

    // Anti-spam security challenge
    if (!spamAnswer.trim()) {
      setErrorMsg("Vui lòng nhập kết quả phép tính chống spam câu hỏi bảo mật!");
      return;
    }
    if (parseInt(spamAnswer.trim(), 10) !== (mathA + mathB)) {
      setErrorMsg(`Xác thực chống spam không chính xác! Hãy tính lại: ${mathA} + ${mathB} = ?`);
      return;
    }

    if (pickupPoint.includes("tận nơi") && !customHanoiAddress.trim()) {
      setErrorMsg("Vui lòng nhập địa chỉ đón chi tiết tại Hà Nội!");
      return;
    }

    setIsSubmitting(true);

    const chosenRoom = selectedAcc.roomTypes[roomTypeIndex];
    const payingPassengers = adults + children; // Children >= 4 paid full
    const totalPrice = calculateTotalComboPrice();
    const returnDateObj = new Date(travelDate);
    returnDateObj.setDate(returnDateObj.getDate() + nights);
    const returnDateStr = returnDateObj.toISOString().split('T')[0];

    const finalPickupPoint = pickupPoint.includes("tận nơi") && customHanoiAddress
      ? `${pickupPoint} (Địa chỉ chi tiết: ${customHanoiAddress})`
      : pickupPoint;

    const isReturningCustomer = (bookings || []).some(
      (b) => (b.passengerPhone || "").replace(/[\s\.\-]+/g, "") === trimmedPhone.replace(/[\s\.\-]+/g, "") && b.status !== "cancelled"
    );

    const originalTotalPrice = calculateTotalComboPrice();
    
    let pointsDeducted = 0;
    let pointsDiscountAmount = 0;
    if (usePoints && isEligibleForPointsDeduction) {
       pointsDiscountAmount = usablePoints * 1000;
       pointsDeducted = usablePoints; 
       if (pointsDiscountAmount > originalTotalPrice) {
          pointsDiscountAmount = originalTotalPrice;
          pointsDeducted = Math.ceil(originalTotalPrice / 1000);
       }
    }

    let couponDiscountAmount = 0;
    if (appliedCoupon) {
       couponDiscountAmount = (originalTotalPrice * appliedCoupon.discountPercentage) / 100;
    }

    const totalDiscount = pointsDiscountAmount + couponDiscountAmount;
    const finalPrice = Math.max(0, originalTotalPrice - totalDiscount);

    // Deduct points from active user wallet
    if (pointsDeducted > 0) {
      onDeductPoints(pointsDeducted);
    }

    const bookingData = {
      id: "bk_" + Math.random().toString(36).substr(2, 9),
      type: "combo",
      bookingDate: new Date().toLocaleDateString('vi-VN'),
      travelDate: travelDate,
      returnDate: returnDateStr,
      passengerName: trimmedName,
      passengerPhone: trimmedPhone,
      passengerEmail: trimmedEmail || "contact@client.vn",
      pickupPoint: pickupPoint || finalPickupPoint,
      dropoffPoint: dropoffPoint || `Sảnh khách sạn: ${selectedAcc.name} (Mộc Châu)`,
      totalPrice: finalPrice,
      originalPrice: originalTotalPrice, 
      couponCode: appliedCoupon ? appliedCoupon.code : undefined,
      pointsDeducted: pointsDeducted > 0 ? pointsDeducted : undefined,
      discountAmount: totalDiscount > 0 ? totalDiscount : undefined,
      status: "pending",
      comboId: selectedCombo.id,
      accommodationName: selectedAcc.name,
      roomTypeName: chosenRoom.name,
      roomQuantity: Math.ceil(payingPassengers / 2),
      nights: nights,
      seatNumbers: Array.from({ length: payingPassengers }, (_, i) => `Giờ đi: ${travelTime} (Ghế ${i + 3})`), // NOTE: Simplistic seat marking
      notes: notes,
      isReturningCustomer
    };

    onAddBooking(bookingData);
    onOpenPayment(bookingData);

    // Reset fields
    setSelectedCombo(null);
    setSelectedAcc(null);
    setPassengerName("");
    setPassengerPhone("");
    setPassengerEmail("");
    setNotes("");
    setSpamAnswer("");
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" id="combo_booking_section">
      <AnimatePresence mode="wait">
        {!selectedCombo ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-10"
          >
            {/* Header info */}
            <div className="text-center max-w-2xl mx-auto">
              <span className="text-xs bg-emerald-100 text-emerald-800 font-extrabold px-3.5 py-1.5 rounded-full uppercase tracking-wider">
                Trọn gói Tiết kiệm 20%
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1b4332] tracking-tight mt-3">
                Combo Khách Sạn + Xe Limousine VIP
              </h2>
              <p className="text-stone-500 mt-2 text-sm font-sans">
                Giải pháp du lịch tự túc sành điệu nhất. Bao gồm xe Limousine đưa đón khứ hồi VIP cao cấp từ Hà Nội và đêm phòng khách sạn/resort xinh đẹp tại Mộc Châu.
              </p>
            </div>

            {/* List of high-quality Tour Combos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {combos.map((combo) => (
                <div
                  key={combo.id}
                  id={`combo_card_${combo.id}`}
                  className="bg-white rounded-3xl overflow-hidden border border-stone-200 shadow-md hover:shadow-lg transition-all flex flex-col justify-between text-left"
                >
                  <div className="relative h-60 w-full overflow-hidden">
                    <img
                      src={combo.images?.[0] || "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=cover&w=800&q=80"}
                      alt={combo.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4 bg-emerald-600 text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-md">
                      {combo.tag}
                    </div>
                    <div className="absolute top-4 right-4 bg-stone-900/95 backdrop-blur-xs text-[#a7c957] text-xs font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1 shadow-md">
                      <CalendarDays className="w-3.5 h-3.5" />
                      <span>{combo.durationText}</span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 to-transparent" />
                    <div className="absolute bottom-4 left-6 right-6">
                      <h3 className="text-slate-100 font-extrabold text-lg sm:text-xl leading-tight">
                        {combo.name}
                      </h3>
                    </div>
                  </div>

                  <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-4">
                      <p className="text-xs text-stone-500 leading-relaxed font-sans">{combo.description}</p>
                      
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-[#1b4332] uppercase tracking-wider block">Combo bao gồm:</span>
                        <ul className="space-y-1.5 text-xs text-stone-600">
                          {combo.highlights.map((highlight, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{highlight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Pricing view and click buy */}
                    <div className="pt-6 border-t border-stone-100/80 flex items-center justify-between mt-auto">
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-stone-400 line-through text-xs font-mono">
                            {combo.originalPrice.toLocaleString()}đ
                          </span>
                          <span className="text-[10px] bg-red-100 text-red-700 font-extrabold px-1.5 py-0.5 rounded-md">
                            -{Math.round((1 - combo.pricePerPerson / combo.originalPrice) * 100)}%
                          </span>
                        </div>
                        <div className="mt-1">
                          {pickupPoint.trim().toLowerCase() === "hà nội" ? (
                            <div className="flex flex-col">
                              {travelDate ? (
                                <span className="text-xl font-extrabold text-amber-600 font-mono">
                                  {(() => {
                                    const date = new Date(travelDate);
                                    const day = date.getDay();
                                    const price = (day >= 1 && day <= 4) 
                                      ? (combo.priceWeekday || combo.pricePerPerson)
                                      : (combo.priceWeekend || combo.pricePerPerson);
                                    return price.toLocaleString();
                                  })()}đ
                                </span>
                              ) : (
                                <span className="text-xl font-extrabold text-[#1b4332] font-mono">
                                  Chỉ từ {(combo.priceWeekday || combo.pricePerPerson).toLocaleString()}đ
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm font-bold text-emerald-600 font-sans">
                              Liên hệ để được tư vấn
                            </span>
                          )}
                          {pickupPoint.trim().toLowerCase() === "hà nội" && (
                            <span className="text-[10px] text-stone-400 font-sans mt-0.5 block">/khách (Giá {travelDate ? "ngày bạn chọn" : "ngày thường"})</span>
                          )}
                        </div>
                        <span className="text-[9px] text-stone-400 block font-sans">*Áp dụng khi đặt từ 2 người lớn</span>
                      </div>

                      {pickupPoint.trim().toLowerCase() === "hà nội" ? (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => setDetailCombo(combo)}
                            className="px-4 py-2 bg-stone-100 text-stone-600 rounded-xl font-bold text-xs hover:bg-stone-200 transition-colors cursor-pointer"
                          >
                            Xem chi tiết
                          </button>
                          <button
                            onClick={() => handleSelectCombo(combo)}
                            id={`btn_book_combo_${combo.id}`}
                            className="px-5 py-3 bg-[#1b4332] text-white rounded-xl font-bold text-xs sm:text-sm hover:bg-[#122e22] transition-colors flex items-center space-x-1.5 shadow-sm shadow-[#1b4332]/20 cursor-pointer"
                          >
                            <span>Đặt Combo</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <a
                          href="https://zalo.me/0971050324"
                          target="_blank"
                          rel="noreferrer"
                          id={`btn_contact_${combo.id}`}
                          className="px-5 py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs sm:text-sm hover:bg-emerald-700 transition-colors flex items-center space-x-1.5 shadow-sm shadow-emerald-900/20 cursor-pointer"
                        >
                          <span>Liên hệ tư vấn</span>
                          <Phone className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* General FAQs or Features matching laviatravel style */}
            <div className="bg-emerald-50/40 border border-emerald-100 p-8 rounded-3xl text-left max-w-4xl mx-auto space-y-4">
              <h3 className="font-extrabold text-[#1b4332] text-lg flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <span>Tại sao nên mua Combo Xe + Phòng của Xe Đi Mộc Châu?</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-stone-600 pt-2">
                <div className="space-y-1">
                  <span className="font-bold text-[#1b4332] text-sm block">Giá Rẻ Hơn Đặt Lẻ</span>
                  <p className="font-sans">Hợp đồng đối tác chiến lược giữa Xe Đi Mộc Châu và hệ thống resort lớn giúp giảm trực tiếp tới 20% chi phí phòng.</p>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-[#1b4332] text-sm block">Chuẩn Khung Giờ Đón Trả</span>
                  <p className="font-sans">Xe Limousine khớp giờ khớp chuyến chính xác, đón trả tận sảnh khách sạn. Quý khách không mất công thuê taxi mệt mỏi từ ngã ba.</p>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-[#1b4332] text-sm block">Hỗ Trợ 24/7 Miễn Phí</span>
                  <p className="font-sans">Đội ngũ Điều hành của chúng tôi hỗ trợ và phục vụ check-in sớm, thuê xe máy dạo chơi, đặt ăn tiệc nướng BBQ ngay Bản Áng nhanh chóng.</p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white border border-stone-200 p-6 sm:p-8 rounded-3xl shadow-xl max-w-4xl mx-auto text-left"
            id="combo_detail_booking_form"
          >
            {/* Header section backing down option */}
            <button
              onClick={() => {
                setSelectedCombo(null);
                setSelectedAcc(null);
              }}
              className="text-stone-500 hover:text-[#1b4332] text-xs font-bold mb-6 flex items-center space-x-1 cursor-pointer"
            >
              <span>← Quay lại danh sách combo</span>
            </button>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              {/* Promo Left Sidebar */}
              <div className="md:col-span-5 space-y-5">
                <div className="h-44 w-full rounded-2xl overflow-hidden shadow-sm flex gap-1">
                  {(selectedAcc?.images || []).slice(0, 2).map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt={selectedAcc?.name}
                      className={`h-full object-cover ${(selectedAcc?.images?.length || 0) > 1 ? 'w-1/2' : 'w-full'}`}
                    />
                  ))}
                  {(selectedAcc?.images || []).length === 0 && (
                    <div className="w-full h-full bg-stone-100 flex items-center justify-center text-stone-400 text-xs font-bold uppercase tracking-widest">
                      Chưa có ảnh
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-600 block">Bạn đang lựa chọn:</span>
                  <h3 className="font-extrabold text-[#1b4332] text-base leading-snug">
                    {selectedCombo.name}
                  </h3>
                  <span className="text-xs text-stone-500 block font-sans">Điểm lưu trú khách sạn: <b>{selectedAcc?.name}</b></span>
                </div>

                <div className="bg-stone-50 p-4 rounded-2xl space-y-3">
                  <div className="text-xs font-bold text-stone-700 uppercase tracking-widest border-b border-stone-200/60 pb-2">
                    Điểm nổi bật của khách sạn
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedAcc?.amenities.map((amen, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 bg-white border border-stone-200 text-stone-600 rounded-lg">
                        {amen}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-stone-500 leading-relaxed font-sans mt-2">{selectedAcc?.description}</p>
                </div>
              </div>

              {/* Booking logic form right */}
              <div className="md:col-span-7">
                <form onSubmit={handleBookingSubmit} className="space-y-6">
                  <div className="border bg-stone-50/50 p-5 rounded-2xl border-stone-200/60 space-y-4">
                    <h4 className="text-xs font-bold text-[#1b4332] uppercase tracking-wider">
                      CẤU HÌNH COMBO & ĐÊM PHÒNG
                    </h4>

                    {/* Select Room type inside hotel */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-stone-700 block">1. Lựa chọn Hạng Phòng:</label>
                      <select
                        value={roomTypeIndex}
                        onChange={(e) => setRoomTypeIndex(Number(e.target.value))}
                        className="w-full bg-white px-3 py-2 border border-stone-200 rounded-lg text-sm font-semibold text-stone-800 cursor-pointer focus:outline-none focus:border-emerald-500"
                        id="select_room_type"
                      >
                        {selectedAcc?.roomTypes.map((room, idx) => (
                          <option key={idx} value={idx}>
                            {room.name} (+{(room.pricePerNight).toLocaleString()}đ/đêm)
                          </option>
                        ))}
                      </select>
                      <span className="text-[10px] text-stone-400 leading-tight block font-sans mt-1">
                        Sức chứa tối đa: {selectedAcc?.roomTypes[roomTypeIndex].capacity}. {selectedAcc?.roomTypes[roomTypeIndex].description}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Booking Nights */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-stone-700 block">2. Số Đêm Nghỉ:</label>
                        <select
                          value={nights}
                          onChange={(e) => setNights(Number(e.target.value))}
                          className="w-full bg-white px-3 py-2 border border-stone-200 rounded-lg text-sm font-semibold text-stone-800 cursor-pointer focus:outline-none"
                        >
                          <option value="1">1 Đêm (2N1Đ)</option>
                          <option value="2">2 Đêm (3N2Đ)</option>
                          <option value="3">3 Đêm (4N3Đ)</option>
                        </select>
                      </div>

                      {/* Number of passengers */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-stone-700 block">3a. Người lớn:</label>
                          <input
                             type="number"
                             min="1"
                             value={adults}
                             onChange={(e) => setAdults(Math.max(1, Number(e.target.value)))}
                             className="w-full bg-white px-3 py-2 border border-stone-200 rounded-lg text-sm font-semibold text-stone-800 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-stone-700 block">3b. Trẻ em (&gt; 4t):</label>
                          <input
                             type="number"
                             min="0"
                             value={children}
                             onChange={(e) => setChildren(Math.max(0, Number(e.target.value)))}
                             className="w-full bg-white px-3 py-2 border border-stone-200 rounded-lg text-sm font-semibold text-stone-800 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Route selection: Pickup & dropoff points mapping to Điểm đi & Điểm đến */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-stone-700 block">4. Điểm đi (Chọn hoặc nhập):</label>
                          <input
                            list="pickup_locations"
                            type="text"
                            required
                            value={pickupPoint}
                            onChange={(e) => setPickupPoint(e.target.value)}
                            placeholder="Ví dụ: Hà Nội, Nguyễn Tuân..."
                            className="w-full bg-white px-3 py-2 border border-stone-200 rounded-lg text-sm font-semibold text-stone-800 focus:outline-none focus:border-emerald-500"
                          />
                          <datalist id="pickup_locations">
                            {locations.filter(l => l.type === 'pickup').map(l => (
                              <option key={l.id} value={l.name} />
                            ))}
                          </datalist>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-stone-700 block">5. Điểm đến (Chọn hoặc nhập):</label>
                          <input
                            list="dropoff_locations"
                            type="text"
                            required
                            value={dropoffPoint}
                            onChange={(e) => setDropoffPoint(e.target.value)}
                            placeholder="Ví dụ: Mộc Châu, Khách sạn Mường Thanh..."
                            className="w-full bg-white px-3 py-2 border border-stone-200 rounded-lg text-sm font-semibold text-stone-800 focus:outline-none focus:border-emerald-500"
                          />
                          <datalist id="dropoff_locations">
                            {locations.filter(l => l.type === 'dropoff').map(l => (
                              <option key={l.id} value={l.name} />
                            ))}
                          </datalist>
                        </div>
                      </div>

                    {/* Travel Date */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-stone-700 block">6. Ngày Khởi Hành từ Hà Nội:</label>
                      <input
                        type="date"
                        required
                        value={travelDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setTravelDate(e.target.value)}
                        className="w-full bg-white px-3 py-2 border border-stone-200 rounded-lg text-sm font-semibold text-stone-800 cursor-pointer focus:outline-none font-sans"
                      />
                    </div>

                    {/* Travel Time & Custom slots selector */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-stone-700 block">7. Giờ Khởi Hành (Hẹn đón / Mong muốn):</label>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="time"
                          required
                          value={travelTime}
                          onChange={(e) => setTravelTime(e.target.value)}
                          className="w-full sm:w-32 bg-white px-3 py-2 border border-stone-200 rounded-lg text-sm font-semibold text-stone-800 cursor-pointer focus:outline-none font-sans"
                        />
                        <div className="flex-1 flex flex-wrap gap-1.5 items-center">
                          {["07:05", "08:30", "13:30", "17:00", "19:00"].map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setTravelTime(t)}
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                                travelTime === t
                                  ? "bg-[#1b4332] text-white border-transparent shadow-[0_2px_4px_rgba(27,67,50,0.2)]"
                                  : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customer Information form */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-stone-800 uppercase tracking-widest text-left">
                      THÔNG TIN TRƯỞNG ĐOÀN ĐẶT COMBO
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs text-stone-700 font-semibold block">Họ và Tên</label>
                        <input
                          type="text"
                          required
                          value={passengerName}
                          onChange={(e) => setPassengerName(e.target.value)}
                          placeholder="Họ và tên trưởng đoàn"
                          className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm font-semibold focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs text-stone-700 font-semibold block">Số Điện Thoại</label>
                        <input
                          type="tel"
                          required
                          value={passengerPhone}
                          onChange={(e) => setPassengerPhone(e.target.value)}
                          placeholder="Số di động để xác nhận"
                          className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm font-semibold focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-stone-700 font-semibold block">Email</label>
                      <input
                        type="email"
                        value={passengerEmail}
                        onChange={(e) => setPassengerEmail(e.target.value)}
                        placeholder="ten@example.com (Nhận voucher PDF)"
                        className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm font-semibold focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>

                    {/* Summary of Chosen Route from the upper configuration */}
                    <div className="space-y-3 p-4 bg-emerald-50/25 border border-emerald-100 rounded-2xl">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest block font-sans">
                        TÓM TẮT CHUYẾN XE KHỨ HỒI GỒM TRONG COMBO:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Điểm đón khách:</span>
                          <span className="text-sm font-bold text-[#1b4332]">{pickupPoint || "Chưa nhập"}</span>
                        </div>
                        <div className="space-y-1.5">
                          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Điểm trả khách:</span>
                          <span className="text-sm font-bold text-[#1b4332]">{dropoffPoint || `Sảnh sảnh khách sạn: ${selectedAcc?.name}`}</span>
                        </div>
                      </div>
                      <div className="text-[11px] text-stone-500 flex items-center gap-1 pt-1.5 border-t border-stone-200/50 font-sans">
                        <span>🕒 Giờ khởi hành mong muốn quý khách đã chọn:</span>
                        <strong className="text-emerald-700 font-semibold">{travelTime}</strong>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-stone-700 font-semibold block">Ghi Chú Đặc Biệt (Ví dụ: Giường cưới, ăn chay...)</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Hãy nhắn cho nhà xe và khách sạn nếu bạn cần yêu cầu thêm như check-in sớm, giường to..."
                        rows={2}
                        className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 font-sans"
                      />
                    </div>
                  </div>

                  {/* Anti-spam Verification math block */}
                  <div className="p-3 bg-amber-50/40 border border-amber-200/60 rounded-xl space-y-2 mt-2">
                    <label className="text-xs font-bold text-amber-900 flex items-center gap-1">
                      🛡️ Xác minh chống spam (Câu hỏi bảo mật):
                    </label>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold bg-white border border-stone-200 px-2.5 py-1.5 rounded-lg font-mono">
                        {mathA} + {mathB} =
                      </span>
                      <input
                        type="text"
                        required
                        value={spamAnswer}
                        onChange={(e) => setSpamAnswer(e.target.value)}
                        placeholder="Nhập kết quả"
                        className="w-24 px-2.5 py-1.5 border border-stone-200 rounded-lg text-xs font-bold focus:outline-none focus:border-amber-500 font-mono text-center bg-white"
                      />
                      <span className="text-[10px] text-stone-500 font-medium">*(Nhập số chính xác để gửi đơn)*</span>
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="text-center text-xs font-bold text-red-600 bg-red-50 p-2 rounded-lg">
                      ⚠ {errorMsg}
                    </div>
                  )}

                  {/* Coupon Code Section */}
                   <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-xl space-y-2 text-left">
                      <label className="text-xs font-extrabold text-[#1b4332] block">
                         Nhập mã giảm giá (Nếu có)
                      </label>
                      <div className="flex gap-2">
                         <input
                           type="text"
                           value={couponCodeInput}
                           onChange={(e) => setCouponCodeInput(e.target.value)}
                           disabled={!!appliedCoupon}
                           placeholder="Nhập mã giảm giá..."
                           className="flex-1 px-3 py-2 text-xs font-bold border border-stone-200 rounded-lg focus:border-emerald-500 focus:outline-none disabled:bg-stone-100 uppercase"
                         />
                         {!appliedCoupon ? (
                           <button
                             type="button"
                             onClick={handleApplyCoupon}
                             className="px-4 py-2 text-xs font-bold bg-[#1b4332] text-white rounded-lg hover:bg-emerald-800 transition-colors"
                           >
                             Áp dụng
                           </button>
                         ) : (
                           <button
                             type="button"
                             onClick={() => { setAppliedCoupon(null); setCouponCodeInput(""); setCouponError(""); }}
                             className="px-4 py-2 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors uppercase"
                           >
                             Hủy
                           </button>
                         )}
                      </div>
                      {couponError && <p className="text-[10px] text-red-500 font-bold">{couponError}</p>}
                      {appliedCoupon && (
                         <p className="text-[10px] text-emerald-700 font-bold">
                           ✓ Áp dụng mã {appliedCoupon.code} giảm {appliedCoupon.discountPercentage}% (-{((calculateTotalComboPrice() * appliedCoupon.discountPercentage) / 100).toLocaleString()}đ)
                         </p>
                      )}
                   </div>

                   {/* Point usage for authenticated customers */}
                   {currentUser && currentUser.role === "customer" && currentUser.points > 0 && (
                     <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-100 flex flex-col space-y-3">
                       {isEligibleForPointsDeduction ? (
                         <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                               <Award className="w-5 h-5 text-emerald-700" />
                             </div>
                             <div>
                               <p className="text-xs font-bold text-emerald-900">Sử dụng điểm tích lũy</p>
                               <p className="text-[10px] text-emerald-700">Ví điểm: {currentUser.points.toLocaleString()} điểm ({ (currentUser.points * 1000).toLocaleString() } VNĐ)</p>
                             </div>
                           </div>
                           <button
                             type="button"
                             onClick={() => setUsePoints(!usePoints)}
                             className={`w-12 h-6 rounded-full transition-colors relative ${usePoints ? 'bg-emerald-600' : 'bg-stone-300'}`}
                           >
                             <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${usePoints ? 'left-7' : 'left-1'}`} />
                           </button>
                         </div>
                       ) : (
                         <div className="space-y-1.5 text-left">
                           <div className="flex items-start gap-2.5 pb-1">
                             <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center shrink-0">
                               <Award className="w-4.5 h-4.5 text-stone-400" />
                             </div>
                             <div>
                               <span className="text-xs font-bold text-stone-600">
                                 Sử dụng điểm trực tiếp (Đang khóa 🔒)
                               </span>
                               <span className="text-[10px] text-stone-500 block">Ví điểm khả dụng: {currentUser.points} điểm (~{(currentUser.points * 1000).toLocaleString()}đ)</span>
                             </div>
                           </div>
                           <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg text-[10px] text-amber-800 leading-normal font-sans font-medium">
                             🚀 Hệ thống tự động kích hoạt tính năng trừ điểm trực tiếp vào tiền thanh toán từ <b>lần đặt vé thứ 3 trở đi</b> (Lịch sử đặt vé của bạn ghi nhận: <b>{userBookingsCount}/2 chuyến đã đặt</b>).
                             <br />
                             <span className="text-stone-500 font-normal mt-1 block"><b>Gợi ý:</b> Bạn vẫn có thể truy cập vào <b>Trang cá nhân ➔ Lịch sử & Đổi quà</b> để quy đổi tích lũy thành các coupon ưu đãi lớn bất cứ lúc nào!</span>
                           </div>
                         </div>
                       )}
                     </div>
                   )}
 
                   {/* Pricing dynamic summary visual box */}
                   <div className="p-5 bg-gradient-to-tr from-amber-50 to-amber-100/50 border border-amber-200 rounded-2xl flex flex-wrap justify-between items-center text-left">
                     <div className="text-left space-y-1 max-w-sm">
                       <span className="text-xs text-amber-800 font-extrabold uppercase tracking-wider block">Tổng chi phí gói Combo:</span>
                       <span className="text-[11px] text-stone-500 block leading-tight font-sans">
                         Gồm vé khứ hồi Limousine VIP cho {adults + children} người + {nights} đêm ở phòng {selectedAcc?.roomTypes[roomTypeIndex].name}.
                       </span>
                       
                       {appliedCoupon && (
                         <span className="text-[11px] text-emerald-700 font-bold block pt-1">
                           ✓ Mã giảm giá {appliedCoupon.discountPercentage}%: -{((calculateTotalComboPrice() * appliedCoupon.discountPercentage) / 100).toLocaleString()}đ
                         </span>
                       )}

                       {usePoints && isEligibleForPointsDeduction && currentUser && currentUser.role === "customer" && (
                         <span className="text-[11px] text-emerald-700 font-bold block pt-1">
                           ✓ Đã giảm trừ điểm tích lũy: -{Math.min(calculateTotalComboPrice(), usablePoints * 1000).toLocaleString()}đ
                         </span>
                       )}
                     </div>
                     <div className="text-right mt-1 sm:mt-0">
                       <span className="text-2xl font-extrabold text-amber-600 font-mono block">
                         {Math.max(0, calculateTotalComboPrice() - ((appliedCoupon ? (calculateTotalComboPrice() * appliedCoupon.discountPercentage) / 100 : 0) + (usePoints && isEligibleForPointsDeduction && currentUser ? Math.min(calculateTotalComboPrice(), usablePoints * 1000) : 0))).toLocaleString()} VNĐ
                       </span>
                       <span className="text-[10px] text-stone-400 block font-sans">Đã bao gồm toàn bộ thuế VAT</span>
                     </div>
                   </div>

                  {/* Submission triggers */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCombo(null)}
                      className="py-3 px-4 border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors text-sm font-bold rounded-xl cursor-pointer"
                    >
                      Chọn Combo Khác
                    </button>
                    
                    {pickupPoint.trim().toLowerCase() === "hà nội" ? (
                      <button
                        type="submit"
                        id="submit_combo_booking_btn"
                        disabled={isSubmitting}
                        className={`py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-[#1b4332] text-white transition-all font-bold text-sm tracking-wide rounded-xl flex items-center justify-center space-x-2 cursor-pointer ${
                          isSubmitting ? "opacity-60 cursor-not-allowed" : "hover:from-emerald-700 hover:to-[#122e22] shadow-md"
                        }`}
                      >
                        <ShieldCheck className="w-5 h-5" />
                        <span>{isSubmitting ? "Đang xử lý đặt Combo..." : "Xác nhận đặt Combo"}</span>
                      </button>
                    ) : (
                      <a
                        href="https://zalo.me/0971050324"
                        target="_blank"
                        rel="noreferrer"
                        id="btn_contact_booking_submit"
                        className="py-3.5 px-4 bg-emerald-600 text-white transition-all font-bold text-sm tracking-wide rounded-xl flex items-center justify-center space-x-2 cursor-pointer hover:bg-emerald-700 shadow-md"
                      >
                        <Phone className="w-5 h-5" />
                        <span>Liên hệ tư vấn</span>
                      </a>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {detailCombo && (
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="relative h-64 shrink-0 overflow-hidden group">
                <img src={detailCombo.images?.[0] || "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=cover&w=800&q=80"} alt={detailCombo.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <button 
                  onClick={() => setDetailCombo(null)}
                  className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 border border-white/20 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-6 left-8 right-8">
                  <span className="bg-emerald-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-3.5 py-1.5 rounded-full shadow-lg inline-block mb-3">
                    {detailCombo.tag}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                    {detailCombo.name}
                  </h2>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 sm:p-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  <div className="lg:col-span-7 space-y-8">
                    <div>
                      <h4 className="text-sm font-black text-[#1b4332] uppercase tracking-widest flex items-center gap-2 mb-4">
                        <Compass className="w-5 h-5 text-emerald-600" />
                        Lịch trình dự kiến (Gợi ý)
                      </h4>
                      <div className="space-y-6 relative ml-4 border-l-2 border-emerald-100 pl-8 py-2">
                        {detailCombo.itinerary && detailCombo.itinerary.length > 0 ? (
                          detailCombo.itinerary.map((item) => (
                            <div key={item.day} className="relative">
                              <div className="absolute -left-[41px] top-0 w-5 h-5 rounded-full bg-emerald-600 border-4 border-white shadow-sm" />
                              <h5 className="font-bold text-stone-900 text-sm">Ngày {item.day}: {item.title}</h5>
                              <p className="text-stone-500 text-xs mt-1.5 font-sans leading-relaxed">{item.content}</p>
                            </div>
                          ))
                        ) : (
                          <div className="text-stone-400 text-xs italic">Đang cập nhật chi tiết lịch trình...</div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-[#1b4332] uppercase tracking-widest flex items-center gap-2 mb-4">
                        <Building className="w-5 h-5 text-emerald-600" />
                        Chi tiết Khách sạn & Hình ảnh
                      </h4>
                      {(() => {
                        const acc = accommodations.find(a => a.id === detailCombo.accommodationId);
                        if (!acc) return null;
                        return (
                          <div className="space-y-4">
                            <div className="flex items-center gap-3">
                              <h5 className="font-bold text-stone-900">{acc.name}</h5>
                              <div className="flex text-amber-500">
                                {acc.rating === 0 ? (
                                  <span className="bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded text-[9px] font-black border border-stone-200">TIÊU CHUẨN</span>
                                ) : acc.rating === 1 ? (
                                  <span className="bg-stone-50 text-stone-500 px-1.5 py-0.5 rounded text-[9px] font-black border border-stone-200">0 SAO</span>
                                ) : (
                                  Array.from({ length: acc.rating - 1 }).map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {(acc.images || []).map((img, idx) => (
                                <img 
                                  key={idx} 
                                  src={img} 
                                  className="w-full h-32 rounded-xl object-cover hover:brightness-90 cursor-pointer border border-stone-100" 
                                  alt={`${acc.name} ${idx}`}
                                />
                              ))}
                              {(!acc.images || acc.images.length === 0) && (
                                <div className="col-span-full py-10 bg-stone-50 rounded-2xl border border-dashed border-stone-200 text-center text-stone-400 text-xs">
                                  Chưa có hình ảnh cập nhật cho khách sạn này.
                                </div>
                              )}
                            </div>
                            <p className="text-stone-500 text-xs font-sans leading-relaxed">{acc.description}</p>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="lg:col-span-5 space-y-6">
                    <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100 shadow-sm border-dashed">
                      <h4 className="text-xs font-black text-emerald-900 uppercase tracking-widest mb-4">Dịch vụ bao gồm trọn gói</h4>
                      <ul className="space-y-3">
                        {detailCombo.highlights.map((h, i) => (
                          <li key={i} className="flex items-start gap-2 text-[11px] text-stone-700">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span className="font-medium font-sans leading-relaxed">{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-[#1b4332] p-6 rounded-3xl text-white space-y-4">
                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">Giá khởi hành từ HN</span>
                          <div className="flex items-center gap-2">
                            <span className="text-stone-400 line-through text-xs font-mono">{detailCombo.originalPrice.toLocaleString()}đ</span>
                            <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">-{Math.round((1 - detailCombo.pricePerPerson/detailCombo.originalPrice)*100)}%</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black text-emerald-400 font-mono">
                            {(() => {
                              if (!travelDate) return (detailCombo.priceWeekday || detailCombo.pricePerPerson).toLocaleString();
                              const date = new Date(travelDate);
                              const day = date.getDay();
                              const price = (day >= 1 && day <= 4) 
                                ? (detailCombo.priceWeekday || detailCombo.pricePerPerson)
                                : (detailCombo.priceWeekend || detailCombo.pricePerPerson);
                              return price.toLocaleString();
                            })()}đ
                          </span>
                          <span className="text-[9px] text-stone-300 block font-bold">/ khách ({travelDate ? "Ngày bạn chọn" : "Ngày thường"})</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          handleSelectCombo(detailCombo);
                          setDetailCombo(null);
                        }}
                        className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-black text-sm transition-all shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Ticket className="w-5 h-5" />
                        Đặt Combo Ngay
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
