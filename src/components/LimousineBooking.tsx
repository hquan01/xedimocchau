import React, { useState, useEffect, useMemo } from "react";
import {eligibleForNextBookingReward, redeemablePoints, POINT_VALUE_VND} from "../lib/loyalty";
import { Seat, LimousineTrip, LimousineConfig, LocationPoint } from "../types";
import { Compass, Users, Check, Phone, Mail, User, Info, MapPin, Armchair, ShieldCheck, CreditCard, Award, Tag, ArrowLeftRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LimousineBookingProps {
  onAddBooking: (booking: any) => Promise<void>;
  searchParams: { from: string; to: string; date: string; time?: string; pickup?: string; dropoff?: string } | null;
  onOpenPayment: (booking: any) => void;
  bookings: any[];
  blockedSeats: any[];
  currentUser: any | null;
  onDeductPoints: (deducted: number) => void;
  limousineConfig: LimousineConfig;
  coupons?: any[];
  locations?: LocationPoint[];
}

export const DEFAULT_SCHEDULES_HN_MC = ["06:00", "06:30", "07:00", "07:30", "08:00", "08:30", "09:00", "16:00", "17:00", "18:00", "19:00"];
export const DEFAULT_SCHEDULES_MC_HN = ["11:00", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00"];

export function getOfficialSchedulesForRoute(from: string, to: string, date?: string, config?: LimousineConfig): string[] {
  const normFrom = from.toLowerCase().trim();
  const normTo = to.toLowerCase().trim();
  
  let baseSchedules: string[] = [];

  if (normTo.includes("mộc châu") || normTo.includes("moc chau") || normTo.includes("sơn la")) {
    baseSchedules = [...DEFAULT_SCHEDULES_HN_MC];
  } else if (normFrom.includes("mộc châu") || normFrom.includes("moc chau") || normFrom.includes("sơn la")) {
    baseSchedules = [...DEFAULT_SCHEDULES_MC_HN];
  } else {
    baseSchedules = [...DEFAULT_SCHEDULES_HN_MC];
  }

  if (date && config && config.scheduleExceptions) {
    const routeName = (normTo.includes("mộc châu") || normTo.includes("moc chau") || normTo.includes("sơn la")) 
      ? "Hà Nội - Mộc Châu" 
      : "Mộc Châu - Hà Nội";
    
    const dayExceptions = config.scheduleExceptions.filter(e => e.date === date && e.route === routeName);
    const blockedTimes = dayExceptions.filter(e => e.type === 'blocked').map(e => e.time);
    baseSchedules = baseSchedules.filter(time => !blockedTimes.includes(time));
    const extraTimes = dayExceptions.filter(e => e.type === 'extra').map(e => e.time);
    baseSchedules = [...baseSchedules, ...extraTimes];
    baseSchedules = Array.from(new Set(baseSchedules)).sort();
  }

  return baseSchedules;
}

export default function LimousineBooking({
  onAddBooking,
  searchParams,
  onOpenPayment,
  bookings,
  blockedSeats,
  currentUser,
  onDeductPoints,
  limousineConfig,
  coupons = [],
  locations = []
}: LimousineBookingProps) {
  // Route selection state (Mộc Châu route rule: one end must be Mộc Châu)
  const [fromType, setFromType] = useState<"Hà Nội" | "Mộc Châu" | "other">(
    searchParams?.from === "Mộc Châu" ? "Mộc Châu" : (searchParams?.from && searchParams.from !== "Hà Nội" && searchParams.from !== "Mộc Châu" ? "other" : "Hà Nội")
  );
  const [customFrom, setCustomFrom] = useState<string>(
    searchParams?.from && searchParams.from !== "Hà Nội" && searchParams.from !== "Mộc Châu" ? searchParams.from : ""
  );

  const [toType, setToType] = useState<"Hà Nội" | "Mộc Châu" | "other">(
    searchParams?.to === "Hà Nội" ? "Hà Nội" : (searchParams?.to && searchParams.to !== "Hà Nội" && searchParams.to !== "Mộc Châu" ? "other" : "Mộc Châu")
  );
  const [customTo, setCustomTo] = useState<string>(
    searchParams?.to && searchParams.to !== "Hà Nội" && searchParams.to !== "Mộc Châu" ? searchParams.to : ""
  );

  const [date, setDate] = useState(searchParams?.date || "2026-05-25");
  const [selectedTimeFilter, setSelectedTimeFilter] = useState(
    searchParams?.time && searchParams.time !== "all" && searchParams.time !== "morning" && searchParams.time !== "afternoon"
      ? searchParams.time
      : "07:05"
  );

  // Effective origin and destination strings
  const effectiveFrom = fromType === "other" ? (customFrom.trim() || "Tỉnh khác") : fromType;
  const effectiveTo = toType === "other" ? (customTo.trim() || "Tỉnh khác") : toType;

  const from = effectiveFrom;
  const to = effectiveTo;

  // Swap Route Handler (Đảo chiều)
  const handleSwapRoute = () => {
    const prevFromType = fromType;
    const prevCustomFrom = customFrom;
    const prevToType = toType;
    const prevCustomTo = customTo;

    setFromType(prevToType);
    setCustomFrom(prevCustomTo);
    setToType(prevFromType);
    setCustomTo(prevCustomFrom);

    // Đảo chiều địa chỉ đón và trả tương ứng
    const prevPickup = customPickupAddress;
    const prevDropoff = customDropoffAddress;
    setCustomPickupAddress(prevDropoff);
    setCustomDropoffAddress(prevPickup);

    // Adjust default time filter for direction if switching
    if (prevFromType === "Hà Nội") {
      // Switching to Mộc Châu -> Hà Nội (Afternoon schedule)
      setSelectedTimeFilter("13:30");
    } else {
      // Switching to Hà Nội -> Mộc Châu (Morning schedule)
      setSelectedTimeFilter("07:00");
    }
    setSelectedTrip(null);
  };

  // Ensure Mộc Châu route rule: if from is not Moc Chau, to must be Moc Chau (and vice versa)
  useEffect(() => {
    if (fromType !== "Mộc Châu" && toType !== "Mộc Châu") {
      setToType("Mộc Châu");
    }
  }, [fromType, toType]);

  const finalPickupPoints = useMemo(() => {
    const safeLocations = Array.isArray(locations) ? locations : [];
    const currentPickups = safeLocations.filter(l => (l.city === from || (!l.city && from === "Hà Nội")) && l.type === "pickup" && (l.serviceType === "limousine" || l.serviceType === "both" || !l.serviceType)).map(l => l.name);
    return currentPickups.length > 0 ? currentPickups : [`Đón tận nhà tại ${from}`];
  }, [from, locations]);

  const finalDropoffPoints = useMemo(() => {
    const safeLocations = Array.isArray(locations) ? locations : [];
    const currentDropoffs = safeLocations.filter(l => (l.city === to || (!l.city && to === "Hà Nội")) && l.type === "dropoff" && (l.serviceType === "limousine" || l.serviceType === "both" || !l.serviceType)).map(l => l.name);
    return currentDropoffs.length > 0 ? currentDropoffs : [`Trả tận nhà tại ${to}`];
  }, [to, locations]);

  const isWeekend = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = d.getDay();
    return day === 0 || day === 5 || day === 6;
  };

  const isCurrentWeekend = isWeekend(date);

  const getDynamicPrice = (type: string) => {
    const base = (type === 'vip_massage') ? limousineConfig.weekendPriceVip : limousineConfig.weekendPriceStandard;
    if (isCurrentWeekend) return base;
    return Math.round(base * (1 - (limousineConfig.weekdayDiscountPercentage / 100)));
  };

  // Selection states
  const [selectedTrip, setSelectedTrip] = useState<LimousineTrip | null>(null);
  const [seatCount, setSeatCount] = useState<number>(1);
  
  // Passenger states
  const [passengerName, setPassengerName] = useState("");
  const [passengerPhone, setPassengerPhone] = useState("");
  const [passengerEmail, setPassengerEmail] = useState("");
  const [pickupPoint, setPickupPoint] = useState("");
  const [dropoffPoint, setDropoffPoint] = useState("");
  const [customPickupAddress, setCustomPickupAddress] = useState(searchParams?.pickup || "");
  const [customDropoffAddress, setCustomDropoffAddress] = useState(searchParams?.dropoff || "");

  useEffect(() => {
    if (finalPickupPoints.length > 0) {
      const isValid = finalPickupPoints.includes(pickupPoint);
      if (!isValid) {
        const doorToDoor = finalPickupPoints.find(p => p.toLowerCase().includes("tận nơi") || p.toLowerCase().includes("tận nhà"));
        setPickupPoint(doorToDoor || finalPickupPoints[0]);
      }
    }
  }, [from, finalPickupPoints]);

  useEffect(() => {
    if (finalDropoffPoints.length > 0) {
      const isValid = finalDropoffPoints.includes(dropoffPoint);
      if (!isValid) {
        const doorToDoor = finalDropoffPoints.find(p => p.toLowerCase().includes("tận nơi") || p.toLowerCase().includes("tận nhà"));
        setDropoffPoint(doorToDoor || finalDropoffPoints[0]);
      }
    }
  }, [to, finalDropoffPoints]);

  const [usePoints, setUsePoints] = useState(false);
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState("");

  const handleApplyCoupon = () => {
    setCouponError("");
    if (!eligibleForNextBookingReward(currentUser)) {
      setCouponError("Voucher chỉ được dùng từ lần đặt vé thứ hai, sau khi vé đầu tiên được xác nhận.");
      return;
    }
    if (!couponCodeInput.trim()) return;
    const found = coupons.find(c => c.code.toUpperCase() === couponCodeInput.trim().toUpperCase() && c.isActive !== false && c.isPublished === true);
    if (found) {
       if (currentUser && currentUser.usedCoupons?.includes(found.code.toUpperCase())) {
          setCouponError("Bạn đã sử dụng mã giảm giá này rồi.");
          return;
       }
       setAppliedCoupon(found);
    } else {
       setCouponError("Mã giảm giá không hợp lệ hoặc chưa công bố!");
    }
  };

  const usablePoints = redeemablePoints(currentUser);
  const isEligibleForPointsDeduction = usablePoints >= 1 && currentUser?.role === "customer";

  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mathA] = useState(() => Math.floor(Math.random() * 9) + 2);
  const [mathB] = useState(() => Math.floor(Math.random() * 9) + 2);
  const [spamAnswer, setSpamAnswer] = useState("");

  useEffect(() => {
    if (searchParams) {
      if (searchParams.date) setDate(searchParams.date);
      if (searchParams.time && searchParams.time !== "all" && searchParams.time !== "morning" && searchParams.time !== "afternoon") {
        setSelectedTimeFilter(searchParams.time);
      }
      if (searchParams.pickup) setCustomPickupAddress(searchParams.pickup);
      if (searchParams.dropoff) setCustomDropoffAddress(searchParams.dropoff);
    }
  }, [searchParams]);

  useEffect(() => {
    if (currentUser && currentUser.role === "customer") {
      setPassengerName(currentUser.name);
      setPassengerPhone(currentUser.phone);
      setPassengerEmail(currentUser.email || "");
    }
  }, [currentUser]);

  const scheduleTimes = getOfficialSchedulesForRoute(from, to, date, limousineConfig);

  const parseTimeToMinutes = (timeStr: string): number => {
    const [h, m] = timeStr.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const targetMinutes = parseTimeToMinutes(selectedTimeFilter);
  const precedingSchedules = scheduleTimes.filter((s) => parseTimeToMinutes(s) <= targetMinutes);
  precedingSchedules.sort((a, b) => parseTimeToMinutes(b) - parseTimeToMinutes(a));
  const succeedingSchedules = scheduleTimes.filter((s) => parseTimeToMinutes(s) >= targetMinutes);
  succeedingSchedules.sort((a, b) => parseTimeToMinutes(a) - parseTimeToMinutes(b));

  const beforeTime = precedingSchedules[0] || scheduleTimes[scheduleTimes.length - 1];
  const afterTime = succeedingSchedules[0] || scheduleTimes[0];

  let closestTime = scheduleTimes[0];
  let minDiff = Infinity;
  scheduleTimes.forEach((s) => {
    const diff = Math.abs(parseTimeToMinutes(s) - targetMinutes);
    if (diff < minDiff) {
      minDiff = diff;
      closestTime = s;
    }
  });

  const uniqueRecs = new Set<string>();
  uniqueRecs.add(beforeTime);
  uniqueRecs.add(closestTime);
  uniqueRecs.add(afterTime);

  if (uniqueRecs.size < 3 && precedingSchedules[1]) uniqueRecs.add(precedingSchedules[1]);
  if (uniqueRecs.size < 3 && succeedingSchedules[1]) uniqueRecs.add(succeedingSchedules[1]);

  while (uniqueRecs.size < 3 && scheduleTimes.length >= 3) {
    for (const time of scheduleTimes) {
      uniqueRecs.add(time);
      if (uniqueRecs.size === 3) break;
    }
  }

  const finalHourList = Array.from(uniqueRecs).sort((a, b) => parseTimeToMinutes(a) - parseTimeToMinutes(b));

  let filteredTrips: LimousineTrip[] = finalHourList.map((time) => {
    let recLabel = "";
    if (time === closestTime) {
      recLabel = "Gần giờ lựa chọn nhất ⭐";
    } else if (parseTimeToMinutes(time) < targetMinutes) {
      recLabel = "Trước giờ lựa chọn";
    } else if (parseTimeToMinutes(time) > targetMinutes) {
      recLabel = "Sau giờ lựa chọn";
    }

    return {
      id: `trip_custom_${time.replace(":", "_")}`,
      from,
      to,
      departureTime: time,
      duration: "4.5 giờ",
      priceStandard: getDynamicPrice('standard'),
      priceVip: getDynamicPrice('vip_massage'),
      busCompany: "Xe Đi Mộc Châu Limousine",
      facilities: ["Nước suối", "Khăn lạnh", "Cổng sạc USB", "Ghế VIP", "Wifi 4G"],
      recommendationLabel: recLabel
    };
  });

  const handleTripSelect = (trip: LimousineTrip) => {
    setSelectedTrip(trip);
    setSeatCount(1);
  };

  const getSelectedSeatsPrice = () => {
    if (!isStandardRoute) return 0;
    const pricePerSeat = selectedTrip ? selectedTrip.priceStandard : 300000;
    return seatCount * pricePerSeat;
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (isSubmitting) return;

    if (!selectedTrip) {
      setErrorMsg("Vui lòng chọn khung giờ di chuyển phù hợp!");
      return;
    }

    const systemToday = new Date().toISOString().split('T')[0];
    if (date < systemToday) {
      setErrorMsg("Ngày khởi hành không được trong quá khứ!");
      return;
    }

    if (!seatCount || seatCount < 1 || seatCount > 11) {
      setErrorMsg("Vui lòng chọn số lượng ghế hợp lệ (1 - 11 ghế)!");
      return;
    }

    const trimmedName = passengerName.trim();
    if (!trimmedName) {
      setErrorMsg("Vui lòng nhập họ và tên hành khách!");
      return;
    }

    const trimmedPhone = passengerPhone.trim();
    if (!trimmedPhone) {
      setErrorMsg("Vui lòng điền số điện thoại liên hệ!");
      return;
    }

    if (!spamAnswer.trim() || parseInt(spamAnswer.trim(), 10) !== (mathA + mathB)) {
      setErrorMsg(`Xác thực chống spam không chính xác! Hãy tính lại: ${mathA} + ${mathB} = ?`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const seatNumbers = [`${seatCount} chỗ Limousine`];
      const originalTotalPrice = getSelectedSeatsPrice();
      
      let pointsDeducted = 0;
      let pointsDiscountAmount = 0;
      if (usePoints && isEligibleForPointsDeduction) {
         pointsDiscountAmount = usablePoints * POINT_VALUE_VND;
         pointsDeducted = usablePoints; 
         if (pointsDiscountAmount > originalTotalPrice) {
            pointsDiscountAmount = originalTotalPrice;
            pointsDeducted = Math.ceil(originalTotalPrice / POINT_VALUE_VND);
         }
      }

      let couponDiscountAmount = 0;
      if (appliedCoupon) {
         couponDiscountAmount = (originalTotalPrice * appliedCoupon.discountPercentage) / 100;
      }

      const totalDiscount = pointsDiscountAmount + couponDiscountAmount;
      const finalPrice = Math.max(0, originalTotalPrice - totalDiscount);
      // Points are deducted only after successful Firestore booking submission.

      const trimmedEmail = passengerEmail.trim();

      const finalPickupPoint = customPickupAddress.trim() ? `${pickupPoint} (${customPickupAddress.trim()})` : pickupPoint;
      const finalDropoffPoint = customDropoffAddress.trim() ? `${dropoffPoint} (${customDropoffAddress.trim()})` : dropoffPoint;

      const bookingData = {
        id: "bk_" + Math.random().toString(36).substr(2, 9),
        type: 'limousine',
        bookingDate: new Date().toLocaleDateString('vi-VN'),
        travelDate: date,
        passengerName: trimmedName,
        passengerPhone: trimmedPhone,
        passengerEmail: trimmedEmail || "contact@client.vn",
        pickupPoint: finalPickupPoint,
        dropoffPoint: finalDropoffPoint,
        totalPrice: finalPrice,
        couponCode: appliedCoupon ? appliedCoupon.code : undefined,
        pointsDeducted: pointsDeducted > 0 ? pointsDeducted : undefined,
        discountAmount: totalDiscount > 0 ? totalDiscount : undefined,
        status: 'pending',
        seatNumbers,
        seatCount,
        departureTime: selectedTrip.departureTime,
        routeSelection: `${from} ➔ ${to}`
      };

      await onAddBooking(bookingData);
      if (pointsDeducted > 0) onDeductPoints(pointsDeducted);
      onOpenPayment(bookingData);

      setSelectedTrip(null);
      setSeatCount(1);
      setUsePoints(false);
      setSpamAnswer("");
    } catch (err) {
      console.error("Critical booking failure:", err);
      setErrorMsg("Có lỗi xảy ra khi xử lý đặt vé. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStandardRoute = (from === "Hà Nội" && to === "Mộc Châu") || (from === "Mộc Châu" && to === "Hà Nội");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" id="limousine_booking_section">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1b4332] tracking-tight">Đặt Vé Xe Limousine VIP</h2>
        <p className="text-stone-500 mt-2 text-sm font-sans">
          Đặt trực tuyến vé chở khách limousine ghế VIP thương gia. Tuyến {from} <span className="text-emerald-600 font-bold">⇌</span> {to}. Giữ chỗ chuẩn xác 100%.
        </p>
      </div>

      {/* Filter / Search panel with Route Rules & Swap Button */}
      <div className="bg-stone-50 border border-stone-100 p-5 rounded-2xl shadow-xs mb-8 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          
          {/* Origin Province Selector */}
          <div className="md:col-span-3 space-y-1">
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Tỉnh xuất phát</label>
            <div className="flex gap-1.5">
              <select
                value={fromType}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setFromType(val);
                  if (val !== "Mộc Châu") {
                    setToType("Mộc Châu");
                  } else {
                    setToType("Hà Nội");
                  }
                  setSelectedTrip(null);
                }}
                className="flex-1 p-2.5 bg-white border border-stone-200 rounded-xl text-xs font-bold text-[#1b4332] focus:outline-none focus:border-emerald-600 cursor-pointer"
              >
                <option value="Hà Nội">Hà Nội</option>
                <option value="Mộc Châu">Mộc Châu (Sơn La)</option>
                <option value="other">Tỉnh khác (tự nhập)</option>
              </select>
            </div>
            {fromType === "other" && (
              <input
                type="text"
                value={customFrom}
                onChange={(e) => { setCustomFrom(e.target.value); setSelectedTrip(null); }}
                placeholder="Nhập tên tỉnh/thành..."
                className="w-full mt-1.5 p-2 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-none"
              />
            )}
          </div>

          {/* Swap Route Button (Đảo chiều) */}
          <div className="md:col-span-1 flex justify-center py-1">
            <button
              type="button"
              onClick={handleSwapRoute}
              className="p-3 bg-emerald-50 hover:bg-emerald-100 text-[#1b4332] rounded-2xl border border-emerald-200 transition-all shadow-xs cursor-pointer flex items-center justify-center"
              title="Đảo chiều tuyến đường"
            >
              <ArrowLeftRight className="w-5 h-5" />
            </button>
          </div>

          {/* Destination Province Selector */}
          <div className="md:col-span-3 space-y-1">
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Điểm đến</label>
            <div className="flex gap-1.5">
              <select
                value={toType}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setToType(val);
                  setSelectedTrip(null);
                }}
                className="flex-1 p-2.5 bg-white border border-stone-200 rounded-xl text-xs font-bold text-[#1b4332] focus:outline-none focus:border-emerald-600 cursor-pointer"
              >
                {fromType === "Mộc Châu" ? (
                  <>
                    <option value="Hà Nội">Hà Nội</option>
                    <option value="other">Tỉnh khác (tự nhập)</option>
                  </>
                ) : (
                  <option value="Mộc Châu">Mộc Châu (Sơn La)</option>
                )}
              </select>
            </div>
            {toType === "other" && (
              <input
                type="text"
                value={customTo}
                onChange={(e) => { setCustomTo(e.target.value); setSelectedTrip(null); }}
                placeholder="Nhập tên tỉnh/thành..."
                className="w-full mt-1.5 p-2 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-none"
              />
            )}
          </div>

          {/* Date Picker */}
          <div className="md:col-span-3 space-y-1">
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Ngày đi</label>
            <input
              type="date"
              value={date}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2.5 bg-white border border-stone-200 rounded-xl text-xs font-bold text-[#1b4332] focus:outline-none cursor-pointer"
            />
          </div>

          {/* Time Filter */}
          <div className="md:col-span-2 space-y-1">
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Giờ đi</label>
            <input
              type="time"
              required
              value={selectedTimeFilter}
              onChange={(e) => {
                setSelectedTimeFilter(e.target.value);
                setSelectedTrip(null);
              }}
              className="w-full p-2.5 bg-white border border-stone-200 rounded-xl text-xs font-bold text-[#1b4332] focus:outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Specific Pickup & Dropoff Address Quick Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-stone-200/80">
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-[#1b4332] uppercase tracking-wider block flex items-center justify-between">
              <span>📍 Điểm đón dự kiến ({from}):</span>
              <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">Đón tận nhà</span>
            </label>
            <input
              type="text"
              value={customPickupAddress}
              onChange={(e) => setCustomPickupAddress(e.target.value)}
              placeholder={from === "Mộc Châu" ? "Tên Homestay, Khách sạn, Bản làng đón tại Mộc Châu..." : `Số nhà, tên đường, phố đón tại ${from}...`}
              className="w-full p-2.5 bg-white border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 focus:outline-none focus:border-emerald-600"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-[#1b4332] uppercase tracking-wider block flex items-center justify-between">
              <span>🏠 Điểm trả / điểm đến dự kiến ({to}):</span>
              <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">Trả tận cửa</span>
            </label>
            <input
              type="text"
              value={customDropoffAddress}
              onChange={(e) => setCustomDropoffAddress(e.target.value)}
              placeholder={to === "Mộc Châu" ? "Homestay Bản Áng, Khách sạn, Thung lũng trả tại Mộc Châu..." : `Số nhà, tên đường, khu vực trả tại ${to}...`}
              className="w-full p-2.5 bg-white border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        <div className="text-xs text-stone-500 font-sans pt-1 flex justify-between items-center">
          {isStandardRoute ? (
            <span>Tìm thấy <span className="font-bold text-[#1b4332]">{filteredTrips.length}</span> chuyến chạy trong ngày</span>
          ) : (
            <span className="text-amber-800 font-bold bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">
              💡 Tuyến đặc biệt: Tổng đài QT Limousine sẽ liên hệ tư vấn lộ trình và báo giá riêng cho Quý khách.
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column: List of Trips */}
        <div className="lg:col-span-6 space-y-4">
          <h3 className="text-base font-bold text-stone-800 uppercase tracking-wider mb-2 flex items-center space-x-2">
            <span>BƯỚC 1: CHỌN GIỜ ĐI KHỞI HÀNH</span>
          </h3>

          {filteredTrips.map((trip) => {
            const isChosen = selectedTrip?.id === trip.id;
            return (
              <motion.div
                key={trip.id}
                id={`trip_card_${trip.id}`}
                whileHover={{ scale: 1.01 }}
                onClick={() => handleTripSelect(trip)}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer text-left relative overflow-hidden ${
                  isChosen
                    ? "border-emerald-600 bg-emerald-50/40 shadow-md"
                    : "border-stone-100 bg-white hover:border-emerald-200 hover:shadow-xs"
                }`}
              >
                {isChosen && (
                  <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-bl-xl flex items-center space-x-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Đã chọn</span>
                  </div>
                )}

                {trip.recommendationLabel && (
                  <div className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full mb-3 tracking-wide select-none ${
                    trip.recommendationLabel.includes("Gần")
                      ? "bg-amber-100 text-amber-800 border border-amber-200"
                      : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  }`}>
                    {trip.recommendationLabel.includes("Gần") && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
                    <span>{trip.recommendationLabel}</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <div className="flex items-baseline space-x-2">
                      <span className="text-2xl font-extrabold text-[#1b4332] font-mono">{trip.departureTime}</span>
                      <span className="text-xs text-stone-400 font-sans">({trip.duration})</span>
                    </div>
                    <p className="text-xs text-stone-600 font-bold">
                      {trip.from} ➔ {trip.to}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Giá vé</div>
                    {isStandardRoute ? (
                      <span className="text-lg font-extrabold text-amber-600 font-mono">
                        {trip.priceStandard.toLocaleString()} VNĐ
                      </span>
                    ) : (
                      <div className="text-right space-y-1">
                        <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 block">
                          Liên hệ báo giá chi tiết
                        </span>
                        <div className="flex gap-1 justify-end text-[10px] font-bold">
                          <a href="tel:0971050324" onClick={(e) => e.stopPropagation()} className="px-2 py-1 bg-emerald-600 text-white rounded-md hover:bg-emerald-700">
                            📞 0971050324
                          </a>
                          <a href="https://zalo.me/0971050324" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                            💬 Zalo
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-stone-100/60 flex flex-wrap gap-1">
                  {trip.facilities.map((fac, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 bg-stone-100 text-stone-600 rounded-md font-sans">
                      {fac}
                    </span>
                  ))}
                </div>

                <div className="mt-3 text-[11px] text-emerald-800 font-medium flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping mr-1" />
                  <span>Dòng xe DCar Limousine VIP 10–12 chỗ đời mới</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Right column: Interactive Limousine Seating Chart & Checkout Form */}
        <div className="lg:col-span-6 space-y-6">
          <AnimatePresence mode="wait">
            {!selectedTrip ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-stone-50 border border-stone-200 border-dashed rounded-3xl p-10 text-center text-stone-400 min-h-[400px] flex flex-col justify-center"
                id="seat_select_placeholder"
              >
                <Armchair className="w-12 h-12 mx-auto stroke-1 text-stone-300 mb-2.5 animate-bounce" />
                <h4 className="text-[#1b4332] font-extrabold text-base">CHỌN CHỖ NGỒI VÀ THÔNG TIN</h4>
                <p className="text-stone-400 text-xs mt-1.5 max-w-sm mx-auto">
                  Vui lòng chọn một khung giờ chạy từ danh sách bên trái để mở sơ đồ xe DCar Limousine VIP 10–12 chỗ và chọn đúng số ghế của bạn.
                </p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white border border-stone-200 p-6 rounded-3xl shadow-md space-y-6"
                id="active_booking_form_parent"
              >
                {/* Header info of chosen trip */}
                <div className="bg-gradient-to-r from-emerald-900 to-[#1b4332] text-white p-4 rounded-2xl flex justify-between items-center text-left">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-300 uppercase block tracking-widest">Đang Đặt Vé</span>
                    <h4 className="font-extrabold text-base leading-tight">Chuyến xe lúc {selectedTrip.departureTime}</h4>
                    <span className="text-[11px] opacity-85 font-sans">{date} - Tuyến {selectedTrip.from} đến {selectedTrip.to}</span>
                  </div>
                  <div className="bg-white/10 px-3 py-1.5 rounded-lg text-center font-mono">
                    <span className="text-xs block opacity-75">Giá từ</span>
                    <span className="text-sm font-bold text-amber-300">300k - 380k</span>
                  </div>
                </div>

                {/* Seat Quantity Selector (1 to 11) */}
                <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200">
                  <h4 className="text-xs font-bold text-stone-800 uppercase tracking-widest mb-3">
                    CHỌN SỐ LƯỢNG GHẾ ĐẶT XE LIMOUSINE
                  </h4>
                  <div className="grid grid-cols-6 sm:grid-cols-11 gap-1.5">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setSeatCount(num)}
                        className={`h-10 rounded-xl font-mono font-bold text-xs transition-all cursor-pointer flex items-center justify-center ${
                          seatCount === num
                            ? "bg-[#1b4332] text-white shadow-md scale-105"
                            : "bg-white text-stone-700 border border-stone-200 hover:bg-stone-100"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-stone-500 mt-2.5 font-sans leading-relaxed">
                    💡 <strong>Lưu ý:</strong> Quý khách chọn từ 1 đến 11 ghế. Nhà xe sẽ sắp xếp vị trí ghế ngồi tốt nhất trên dòng xe Limousine 10-12 chỗ.
                  </p>
                </div>

                {/* Selected summary */}
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex justify-between items-center text-left">
                  <div>
                    <span className="text-xs text-emerald-800 font-bold block">Số lượng đặt:</span>
                    <span className="font-extrabold text-[#1b4332] text-sm font-mono">
                      {seatCount} ghế Limousine VIP
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-stone-500 block">Tổng tạm tính</span>
                    {isStandardRoute ? (
                      <span className="font-extrabold text-emerald-700 text-base font-mono">
                        {getSelectedSeatsPrice().toLocaleString()}đ
                      </span>
                    ) : (
                      <div className="text-right space-y-1.5 mt-1">
                        <span className="font-extrabold text-amber-800 text-[11px] block bg-amber-100/90 px-2.5 py-1 rounded-lg border border-amber-200">
                          Liên hệ trực tiếp báo giá
                        </span>
                        <div className="flex gap-1.5 justify-end text-xs font-bold">
                          <a href="tel:0971050324" className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-xs flex items-center space-x-1">
                            <span>📞 Gọi: 0971050324</span>
                          </a>
                          <a href="https://zalo.me/0971050324" target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-xs flex items-center space-x-1">
                            <span>💬 Zalo: 0971050324</span>
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Form inputs for passenger */}
                <form onSubmit={handleBookingSubmit} className="space-y-4 text-left border-t border-stone-100 pt-6">
                  <h4 className="text-xs font-bold text-stone-800 uppercase tracking-widest">
                    THÔNG TIN CHI TIẾT HÀNH KHÁCH
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs text-stone-700 font-semibold block">Họ và Tên</label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                        <input
                          type="text"
                          required
                          value={passengerName}
                          onChange={(e) => setPassengerName(e.target.value)}
                          placeholder="Nguyễn Văn A"
                          className="w-full pl-9 pr-2.5 py-2 border border-stone-200 rounded-lg text-sm font-semibold focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-stone-700 font-semibold block">Số Điện Thoại Đón</label>
                      <div className="relative font-mono">
                        <Phone className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                        <input
                          type="tel"
                          required
                          value={passengerPhone}
                          onChange={(e) => setPassengerPhone(e.target.value)}
                          placeholder="0912xxxxxx"
                          className="w-full pl-9 pr-2.5 py-2 border border-stone-200 rounded-lg text-sm font-semibold focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-stone-700 font-semibold block">Email Nhận Vé Điện Tử</label>
                    <div className="relative font-mono">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                      <input
                        type="email"
                        value={passengerEmail}
                        onChange={(e) => setPassengerEmail(e.target.value)}
                        placeholder="ten@example.com (không bắt buộc)"
                        className="w-full pl-9 pr-2.5 py-2 border border-stone-200 rounded-lg text-sm font-semibold focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    <div className="space-y-1.5">
                      <label className="text-xs text-stone-700 font-semibold block">
                        Điểm đón tại {from}
                      </label>
                      <select
                        value={pickupPoint}
                        onChange={(e) => setPickupPoint(e.target.value)}
                        className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 cursor-pointer text-stone-800 font-medium"
                      >
                        {finalPickupPoints.map((p, i) => (
                          <option key={i} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-stone-700 font-semibold block">
                        Điểm trả tại {to}
                      </label>
                      <select
                        value={dropoffPoint}
                        onChange={(e) => setDropoffPoint(e.target.value)}
                        className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 cursor-pointer text-stone-800 font-medium"
                      >
                        {finalDropoffPoints.map((p, i) => (
                          <option key={i} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2 p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-xl">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-[#1b4332] font-bold block">
                          Địa chỉ đón & trả cụ thể tận nơi
                        </label>
                        <span className="text-[10px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-md border border-emerald-200 shadow-2xs">
                          {from} ➔ {to}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-1">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-stone-700 block">
                            {from === "Mộc Châu" 
                              ? "Địa chỉ đón tại Mộc Châu (Homestay / Khách sạn):" 
                              : `Địa chỉ đón tại ${from} (Số nhà, tên đường):`}
                          </label>
                          <input
                            type="text"
                            value={customPickupAddress}
                            onChange={(e) => setCustomPickupAddress(e.target.value)}
                            placeholder={from === "Mộc Châu" 
                              ? "Ví dụ: Homestay Bản Áng, Mama's House, TT Nông Trường..." 
                              : `Ví dụ: Số 12 Nguyễn Trãi, ngõ/phố tại ${from}...`}
                            className="w-full px-3 py-2 border border-emerald-300 rounded-lg text-xs font-semibold bg-white text-stone-800 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-stone-700 block">
                            {to === "Mộc Châu" 
                              ? "Địa chỉ trả tại Mộc Châu (Homestay / Khách sạn):" 
                              : `Địa chỉ trả tại ${to} (Số nhà, tên đường):`}
                          </label>
                          <input
                            type="text"
                            value={customDropoffAddress}
                            onChange={(e) => setCustomDropoffAddress(e.target.value)}
                            placeholder={to === "Mộc Châu" 
                              ? "Ví dụ: Khách sạn Mường Thanh, Homestay Bản Áng..." 
                              : `Ví dụ: Số nhà, tên đường trả tại ${to}...`}
                            className="w-full px-3 py-2 border border-emerald-300 rounded-lg text-xs font-semibold bg-white text-stone-800 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

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
                     {couponError && <p className="text-[11px] text-red-600 font-medium">{couponError}</p>}
                     {appliedCoupon && (
                        <p className="text-[11px] text-emerald-700 font-bold">
                           🎉 Đã áp dụng mã {appliedCoupon.code}: Giảm {appliedCoupon.discountPercentage}% tổng đơn!
                        </p>
                     )}
                  </div>

                  {/* Points deduction option */}
                  {isEligibleForPointsDeduction && (
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                      <label className="flex items-center space-x-2 text-xs font-bold text-amber-900 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={usePoints}
                          onChange={(e) => setUsePoints(e.target.checked)}
                          className="rounded border-amber-400 text-amber-700 focus:ring-amber-600 w-4 h-4"
                        />
                        <span>Sử dụng điểm tích lũy VIP ({currentUser.points} điểm hiện có)</span>
                      </label>
                      {usePoints && (
                        <p className="text-[11px] text-amber-800 pl-6">
                          Dùng <strong>{usablePoints} điểm</strong> để giảm ngay <strong>{(usablePoints * POINT_VALUE_VND).toLocaleString()}đ</strong> vào giá vé.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Security anti-spam math challenge */}
                  <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-xl space-y-1.5">
                    <label className="text-xs font-bold text-stone-700 block">
                      Xác thực bảo mật chống spam: Tính tổng <span className="font-mono text-[#1b4332] font-extrabold">{mathA} + {mathB} = ?</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={spamAnswer}
                      onChange={(e) => setSpamAnswer(e.target.value)}
                      placeholder="Nhập kết quả..."
                      className="w-full px-3 py-2 text-xs font-bold border border-stone-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  {errorMsg && (
                    <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-semibold">
                      {errorMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-gradient-to-r from-emerald-600 to-[#1b4332] text-white rounded-2xl font-extrabold text-sm tracking-wider uppercase shadow-lg shadow-emerald-900/20 hover:from-emerald-700 hover:to-[#122e22] transition-colors flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Đang xử lý đặt vé...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 text-amber-300" />
                        <span>Xác Nhận Đặt {seatCount} Ghế Ngay</span>
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
