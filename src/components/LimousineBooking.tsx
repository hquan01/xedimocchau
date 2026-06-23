import React, { useState, useEffect, useMemo } from "react";
import { Seat, LimousineTrip, LimousineConfig, LocationPoint } from "../types";
import { Compass, Users, Check, Phone, Mail, User, Info, MapPin, Armchair, ShieldCheck, CreditCard, Award, Tag } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LimousineBookingProps {
  onAddBooking: (booking: any) => void;
  searchParams: { from: string; to: string; date: string; time?: string } | null;
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

// Official daily schedules defined by operator for passenger routes
export function getOfficialSchedulesForRoute(from: string, to: string, date?: string, config?: LimousineConfig): string[] {
  const normFrom = from.toLowerCase().trim();
  const normTo = to.toLowerCase().trim();
  
  let baseSchedules: string[] = [];

  // If destination corresponds directly or indirectly to Moc Chau (representing outbound direction)
  if (normTo.includes("mộc châu") || normTo.includes("moc chau") || normTo.includes("sơn la")) {
    baseSchedules = [...DEFAULT_SCHEDULES_HN_MC];
  } else if (normFrom.includes("mộc châu") || normFrom.includes("moc chau") || normFrom.includes("sơn la")) {
    // If origin corresponds directly or indirectly to Moc Chau (representing inbound direction)
    baseSchedules = [...DEFAULT_SCHEDULES_MC_HN];
  } else {
    // Fallback default outbound schedules
    baseSchedules = [...DEFAULT_SCHEDULES_HN_MC];
  }

  // Apply exceptions (Blocked and Extra)
  if (date && config && config.scheduleExceptions) {
    const routeName = (normTo.includes("mộc châu") || normTo.includes("moc chau") || normTo.includes("sơn la")) 
      ? "Hà Nội - Mộc Châu" 
      : "Mộc Châu - Hà Nội";
    
    const dayExceptions = config.scheduleExceptions.filter(e => e.date === date && e.route === routeName);
    
    // Filter out blocked
    const blockedTimes = dayExceptions.filter(e => e.type === 'blocked').map(e => e.time);
    baseSchedules = baseSchedules.filter(time => !blockedTimes.includes(time));
    
    // Add extras
    const extraTimes = dayExceptions.filter(e => e.type === 'extra').map(e => e.time);
    baseSchedules = [...baseSchedules, ...extraTimes];
    
    // Sort unique times
    baseSchedules = Array.from(new Set(baseSchedules)).sort();
  }

  return baseSchedules;
}

// Initial seats template for 9-seat DCar Limousine VIP
const INITIAL_SEATS: Seat[] = [
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

const provinceOptions = (
  <>
    <optgroup label="Cao nguyên Xanh">
      <option value="Mộc Châu">Mộc Châu (Sơn La)</option>
    </optgroup>
    <optgroup label="Hành lang Đồng bằng sông Hồng">
      <option value="Hà Nội">Hà Nội</option>
      <option value="Bắc Ninh">Bắc Ninh</option>
      <option value="Hưng Yên">Hưng Yên</option>
      <option value="Hải Phòng">Hải Phòng</option>
      <option value="Quảng Ninh">Quảng Ninh</option>
      <option value="Hải Dương">Hải Dương</option>
      <option value="Thái Bình">Thái Bình</option>
      <option value="Nam Định">Nam Định</option>
      <option value="Ninh Bình">Ninh Bình</option>
      <option value="Hà Nam">Hà Nam</option>
    </optgroup>
    <optgroup label="Trung du & Tây - Đông Bắc Bộ">
      <option value="Hòa Bình">Hòa Bình</option>
      <option value="Sơn La">Sơn La (Các huyện khác)</option>
      <option value="Vĩnh Phúc">Vĩnh Phúc</option>
      <option value="Phú Thọ">Phú Thọ</option>
      <option value="Bắc Giang">Bắc Giang</option>
      <option value="Thái Nguyên">Thái Nguyên</option>
      <option value="Lạng Sơn">Lạng Sơn</option>
      <option value="Yên Bái">Yên Bái</option>
      <option value="Lào Cai">Lào Cai (Sapa)</option>
      <option value="Hà Giang">Hà Giang</option>
      <option value="Tuyên Quang">Tuyên Quang</option>
      <option value="Cao Bằng">Cao Bằng</option>
    </optgroup>
  </>
);

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
  // Query parameters
  const [from, setFrom] = useState(searchParams?.from || "Hà Nội");
  const [to, setTo] = useState(searchParams?.to || "Mộc Châu");
  const [date, setDate] = useState(searchParams?.date || "2026-05-25");
  const [selectedTimeFilter, setSelectedTimeFilter] = useState(
    searchParams?.time && searchParams.time !== "all" && searchParams.time !== "morning" && searchParams.time !== "afternoon"
      ? searchParams.time
      : "07:05"
  );

  // Derive dynamic location lists based on current route
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

  // Determine if it is weekend for pricing (Weekend = Fri, Sat, Sun)
  const isWeekend = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = d.getDay();
    return day === 0 || day === 5 || day === 6; // 0=Sunday, 5=Friday, 6=Saturday
  };

  const isCurrentWeekend = isWeekend(date);

  const getDynamicPrice = (type: string) => {
    const base = (type === 'vip_massage') ? limousineConfig.weekendPriceVip : limousineConfig.weekendPriceStandard;
    if (isCurrentWeekend) return base;
    return Math.round(base * (1 - (limousineConfig.weekdayDiscountPercentage / 100)));
  };

  const getFreshSeats = (): Seat[] => [
    { id: "s1", number: "A1", type: "front", price: getDynamicPrice('front'), isBooked: false },
    { id: "s2", number: "A2", type: "front", price: getDynamicPrice('front'), isBooked: false },
    { id: "s3", number: "A3", type: "vip_massage", price: getDynamicPrice('vip_massage'), isBooked: false },
    { id: "s4", number: "A4", type: "vip_massage", price: getDynamicPrice('vip_massage'), isBooked: false },
    { id: "s5", number: "A5", type: "vip_massage", price: getDynamicPrice('vip_massage'), isBooked: false },
    { id: "s6", number: "A6", type: "vip_massage", price: getDynamicPrice('vip_massage'), isBooked: false },
    { id: "s7", number: "A7", type: "standard", price: getDynamicPrice('standard'), isBooked: false },
    { id: "s8", number: "A8", type: "standard", price: getDynamicPrice('standard'), isBooked: false },
    { id: "s9", number: "A9", type: "standard", price: getDynamicPrice('standard'), isBooked: false },
  ];

  // Selection states
  const [selectedTrip, setSelectedTrip] = useState<LimousineTrip | null>(null);
  const [seats, setSeats] = useState<Seat[]>(getFreshSeats());
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  
  // Passenger states
  const [passengerName, setPassengerName] = useState("");
  const [passengerPhone, setPassengerPhone] = useState("");
  const [passengerEmail, setPassengerEmail] = useState("");
  const [pickupPoint, setPickupPoint] = useState("");
  const [dropoffPoint, setDropoffPoint] = useState("");
  const [customHanoiAddress, setCustomHanoiAddress] = useState("");

  // Sync pickupPoint and dropoffPoint automatically when route changes, or when the current selected point is not available in the list
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

  // Point deduction state for customers
  const [usePoints, setUsePoints] = useState(false);
  
  // Coupon state
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState("");

  const handleApplyCoupon = () => {
    setCouponError("");
    if (!couponCodeInput.trim()) return;
    
    // Find published coupon
    const found = coupons.find(c => c.code.toUpperCase() === couponCodeInput.trim().toUpperCase() && c.isActive !== false);
    
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
  
  // Rule: each 50 points can be used if they have at least 50 points. Max 1000 points.
  const usablePoints = currentUser ? Math.min(1000, Math.floor(currentUser.points / 50) * 50) : 0;
  const isEligibleForPointsDeduction = usablePoints >= 50 && currentUser?.role === "customer";

  // Form notifications
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mathA] = useState(() => Math.floor(Math.random() * 9) + 2);
  const [mathB] = useState(() => Math.floor(Math.random() * 9) + 2);
  const [spamAnswer, setSpamAnswer] = useState("");

  // Sync search parameters from Hero
  useEffect(() => {
    if (searchParams) {
      if (searchParams.from) setFrom(searchParams.from);
      if (searchParams.to) setTo(searchParams.to);
      if (searchParams.date) setDate(searchParams.date);
      if (searchParams.time && searchParams.time !== "all" && searchParams.time !== "morning" && searchParams.time !== "afternoon") {
        setSelectedTimeFilter(searchParams.time);
      }
    }
  }, [searchParams]);

  // Pre-populate passenger name and phone if profile exists
  useEffect(() => {
    if (currentUser && currentUser.role === "customer") {
      setPassengerName(currentUser.name);
      setPassengerPhone(currentUser.phone);
      setPassengerEmail(currentUser.email || "");
      
      if (currentUser.favPickup) setPickupPoint(currentUser.favPickup);
      if (currentUser.favDropoff) setDropoffPoint(currentUser.favDropoff);
    }
  }, [currentUser]);

  // Sync seats dynamically with operator offline blocks & active customer bookings
  useEffect(() => {
    const dynamicPriceSeats = getFreshSeats();
    if (selectedTrip) {
      const liveSeats = dynamicPriceSeats.map((seat) => {
        const isBlockedOffline = blockedSeats.some(
          (b) => b.tripId === selectedTrip.id && b.travelDate === date && b.seatId === seat.id
        );

        const isBookedOnline = bookings.some(
          (b) =>
            b.type === "limousine" &&
            b.status !== "cancelled" &&
            b.travelDate === date &&
            b.departureTime === selectedTrip.departureTime &&
            b.seatNumbers?.includes(seat.number)
        );

        return {
          ...seat,
          isBooked: isBlockedOffline || isBookedOnline
        };
      });
      setSeats(liveSeats);
      // Empty selection if it was already selected but now occupied
      setSelectedSeatIds((prev) => prev.filter((id) => !liveSeats.find(ls => ls.id === id)?.isBooked));
    } else {
      setSeats(dynamicPriceSeats.map(s => ({ ...s, isBooked: false })));
    }
  }, [selectedTrip, date, bookings, blockedSeats, limousineConfig]);

  // Sync state whenever searchParams changes
  useEffect(() => {
    if (searchParams) {
      setFrom(searchParams.from);
      setTo(searchParams.to);
      setDate(searchParams.date);
      setSelectedTimeFilter(
        searchParams.time && searchParams.time !== "all" && searchParams.time !== "morning" && searchParams.time !== "afternoon"
          ? searchParams.time
          : "07:05"
      );
      setSelectedTrip(null);
    }
  }, [searchParams]);

  // Dynamic retrieval of matching official operator schedules
  const scheduleTimes = getOfficialSchedulesForRoute(from, to, date, limousineConfig);

  // Convert "HH:MM" string representation to integer minutes of the day for robust math
  const parseTimeToMinutes = (timeStr: string): number => {
    const [h, m] = timeStr.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const targetMinutes = parseTimeToMinutes(selectedTimeFilter);

  // Divide schedules into preceding (before or exact) and succeeding (after)
  const precedingSchedules = scheduleTimes.filter((s) => parseTimeToMinutes(s) <= targetMinutes);
  precedingSchedules.sort((a, b) => parseTimeToMinutes(b) - parseTimeToMinutes(a)); // closest preceding first

  const succeedingSchedules = scheduleTimes.filter((s) => parseTimeToMinutes(s) >= targetMinutes);
  succeedingSchedules.sort((a, b) => parseTimeToMinutes(a) - parseTimeToMinutes(b)); // closest succeeding first

  // Select recommended times
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

  // Construct a unique set of exactly 3 recommended schedules
  const uniqueRecs = new Set<string>();
  uniqueRecs.add(beforeTime);
  uniqueRecs.add(closestTime);
  uniqueRecs.add(afterTime);

  // Expand to adjacent times if set contains fewer than 3 items
  if (uniqueRecs.size < 3 && precedingSchedules[1]) uniqueRecs.add(precedingSchedules[1]);
  if (uniqueRecs.size < 3 && succeedingSchedules[1]) uniqueRecs.add(succeedingSchedules[1]);

  // General fallback to guarantee 3 elements if the total schedule list is >= 3
  while (uniqueRecs.size < 3 && scheduleTimes.length >= 3) {
    for (const time of scheduleTimes) {
      uniqueRecs.add(time);
      if (uniqueRecs.size === 3) break;
    }
  }

  // Convert Set back to a chronologically sorted array of hours
  const finalHourList = Array.from(uniqueRecs).sort((a, b) => parseTimeToMinutes(a) - parseTimeToMinutes(b));

  // Construct the resulting 3 trip objects
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
    setSelectedSeatIds([]);
  };

  const toggleSeat = (seatId: string) => {
    const seat = seats.find((s) => s.id === seatId);
    if (!seat || seat.isBooked) return;

    if (selectedSeatIds.includes(seatId)) {
      setSelectedSeatIds(selectedSeatIds.filter((id) => id !== seatId));
    } else {
      setSelectedSeatIds([...selectedSeatIds, seatId]);
    }
  };

  const selectAllNineSeats = () => {
    if (selectedSeatIds.length === seats.length) {
      setSelectedSeatIds([]);
    } else {
      setSelectedSeatIds(seats.map((s) => s.id));
    }
  };

  const getSelectedSeatsPrice = () => {
    return selectedSeatIds.reduce((total, id) => {
      const s = seats.find((seat) => seat.id === id);
      return total + (s ? s.price : 0);
    }, 0);
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
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
    if (date === systemToday) {
      const liveD = new Date();
      const currentResStr = `${String(liveD.getHours()).padStart(2, '0')}:${String(liveD.getMinutes()).padStart(2, '0')}`;
      if (selectedTrip.departureTime < currentResStr) {
        setErrorMsg("Giờ khởi hành đã diễn ra ở quá khứ! Vui lòng chọn khung giờ trống khác.");
        return;
      }
    }

    if (selectedSeatIds.length === 0) {
      setErrorMsg("Vui lòng chọn ít nhất một ghế ngồi trên xe!");
      return;
    }

    const trimmedName = passengerName.trim();
    if (!trimmedName) {
      setErrorMsg("Vui lòng nhập họ và tên hành khách!");
      return;
    }
    const nameRegex = /^[a-zA-ZÀ-ỹ\s]{2,50}$/;
    if (!nameRegex.test(trimmedName)) {
      setErrorMsg("Họ và tên hành khách không hợp lệ! Vui lòng nhập đầy đủ chữ cái tiếng Việt có dâu/không dấu (2 - 50 ký tự), không chứa số hay ký tự đặc biệt.");
      return;
    }

    const trimmedPhone = passengerPhone.trim();
    if (!trimmedPhone) {
      setErrorMsg("Vui lòng điền số điện thoại liên hệ để nhà xe gọi đón!");
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

    // Anti-spam security challenge
    if (!spamAnswer.trim()) {
      setErrorMsg("Vui lòng nhập kết quả phép tính chống spam câu hỏi bảo mật!");
      return;
    }
    if (parseInt(spamAnswer.trim(), 10) !== (mathA + mathB)) {
      setErrorMsg(`Xác thực chống spam không chính xác! Hãy tính lại: ${mathA} + ${mathB} = ?`);
      return;
    }

    const isPickupCustom = pickupPoint.toLowerCase().includes("tận nơi") || pickupPoint.toLowerCase().includes("tại nhà") || pickupPoint.toLowerCase().includes("tận cổng");
    const isDropoffCustom = dropoffPoint.toLowerCase().includes("tận nơi") || dropoffPoint.toLowerCase().includes("tại nhà") || dropoffPoint.toLowerCase().includes("tận cổng");
    const needsDetail = isPickupCustom || isDropoffCustom;
    
    if (needsDetail && !customHanoiAddress.trim()) {
      setErrorMsg("Vui lòng nhập địa chỉ đón/trả chi tiết!");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const selectedSeats = seats.filter((s) => selectedSeatIds.includes(s.id));
      const seatNumbers = selectedSeats.map((s) => s.number);
      const originalTotalPrice = getSelectedSeatsPrice();
      
      let pointsDeducted = 0;
      let pointsDiscountAmount = 0;
      if (usePoints && isEligibleForPointsDeduction) {
         pointsDiscountAmount = usablePoints * 1000;
         pointsDeducted = usablePoints; 
         // cap it to not exceed originalTotalPrice
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

      const finalPickupPoint = (pickupPoint.toLowerCase().includes("tận nơi") || pickupPoint.toLowerCase().includes("tại nhà") || pickupPoint.toLowerCase().includes("tận cổng"))
        ? `${pickupPoint} (${customHanoiAddress})`
        : pickupPoint;

      const finalDropoffPoint = (dropoffPoint.toLowerCase().includes("tận nơi") || dropoffPoint.toLowerCase().includes("tại nhà") || dropoffPoint.toLowerCase().includes("tận cổng"))
        ? `${dropoffPoint} (${customHanoiAddress})`
        : dropoffPoint;

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
        departureTime: selectedTrip.departureTime,
        routeSelection: `${from} ➔ ${to}`
      };

      // Callback to save to state / local storage
      onAddBooking(bookingData);
      
      // Open payment instruction screen
      onOpenPayment(bookingData);

      // Reset steps
      setSelectedTrip(null);
      setSelectedSeatIds([]);
      setUsePoints(false);
      setSpamAnswer("");
      
      if (!currentUser) {
        setPassengerName("");
        setPassengerPhone("");
        setPassengerEmail("");
      }
    } catch (err) {
      console.error("Critical booking failure:", err);
      setErrorMsg("Có lỗi xảy ra khi xử lý đặt vé. Quý khách vui lòng thử lại hoặc gọi Hotline hỗ trợ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isHanoiMocChau = (from === "Hà Nội" && to === "Mộc Châu") || (from === "Mộc Châu" && to === "Hà Nội");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" id="limousine_booking_section">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1b4332] tracking-tight">Đặt Vé Xe Limousine VIP</h2>
        <p className="text-stone-500 mt-2 text-sm font-sans">
          Đặt trực tuyến vé chở khách limousine ghế VIP thương gia tuyến Hà Nội <span className="text-emerald-600 font-bold">⇌</span> Mộc Châu. Giữ chỗ chuẩn xác 100%.
        </p>
      </div>

      {/* Filter / Search panel */}
      <div className="bg-stone-50 border border-stone-100 p-5 rounded-2xl flex flex-wrap gap-4 items-center justify-between shadow-xs mb-8">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2 bg-white px-3 py-2 border border-stone-200 rounded-lg">
            <span className="text-xs text-stone-400 font-bold">Từ:</span>
            <select
              value={from}
              onChange={(e) => {
                const val = e.target.value;
                setFrom(val);
                setSelectedTrip(null);
              }}
              className="text-xs font-semibold text-[#1b4332] bg-transparent focus:outline-none w-28 sm:w-36 text-stone-800 cursor-pointer"
            >
              {provinceOptions}
            </select>
          </div>
          <div className="text-stone-400 font-sans">➔</div>

          <div className="flex items-center space-x-2 bg-white px-3 py-2 border border-stone-200 rounded-lg">
            <span className="text-xs text-stone-400 font-bold">Đến:</span>
            <select
              value={to}
              onChange={(e) => {
                const val = e.target.value;
                setTo(val);
                setSelectedTrip(null);
              }}
              className="text-xs font-semibold text-[#1b4332] bg-transparent focus:outline-none w-28 sm:w-36 text-stone-800 cursor-pointer"
            >
              {provinceOptions}
            </select>
          </div>

          <div className="flex items-center space-x-2 bg-white px-3 py-2 border border-stone-200 rounded-lg">
            <span className="text-xs text-stone-400 font-bold">Ngày:</span>
            <input
              type="date"
              value={date}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDate(e.target.value)}
              className="text-sm font-semibold text-[#1b4332] bg-transparent focus:outline-none cursor-pointer font-sans"
            />
          </div>

          <div className="flex items-center space-x-2 bg-white px-3 py-2 border border-stone-200 rounded-lg">
            <span className="text-xs text-stone-400 font-bold">Giờ đi:</span>
            <input
              type="time"
              required
              value={selectedTimeFilter}
              onChange={(e) => {
                setSelectedTimeFilter(e.target.value);
                setSelectedTrip(null);
              }}
              className="text-sm font-semibold text-[#1b4332] bg-transparent focus:outline-none cursor-pointer w-24 px-1"
            />
          </div>
        </div>

        <div className="text-xs text-stone-500 font-sans">
          {isHanoiMocChau ? (
            <>
              Tìm thấy <span className="font-bold text-[#1b4332]">{filteredTrips.length}</span> chuyến chạy trong ngày
            </>
          ) : (
            <span className="font-bold text-amber-700">Tuyến đặc biệt</span>
          )}
        </div>
      </div>

      {isHanoiMocChau ? (
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
                    <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Giá vé từ</div>
                    <span className="text-lg font-extrabold text-amber-600 font-mono">
                      {trip.priceStandard.toLocaleString()} VNĐ
                    </span>
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
                  <span>Dòng xe DCar Limousine VIP 9 chỗ đời mới 2025</span>
                </div>
              </motion.div>
            );
          })}

          {filteredTrips.length === 0 && (
            <div className="p-10 border border-dashed border-stone-200 rounded-2xl text-center text-stone-400">
              <Compass className="w-10 h-10 mx-auto opacity-30 mb-2 stroke-1" />
              <p className="text-sm font-semibold">Không tìm thấy chuyến đi nào trong ngày được chọn</p>
              <p className="text-xs mt-1">Vui lòng chọn ngày khác hoặc liên hệ hotline để đặt chuyến khẩn cấp</p>
            </div>
          )}
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
                  Vui lòng chọn một khung giờ chạy từ danh sách bên trái để mở sơ đồ xe DCar Limousine VIP 9 chỗ và chọn đúng số ghế của bạn.
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

                {/* LIMITLESS SOLATI BUS SCHEMATIC DESIGN */}
                <div>
                  <h4 className="text-xs font-bold text-stone-800 uppercase tracking-widest text-center mb-4">
                    SƠ ĐỒ CHỌN GHẾ XE DCAR VIP (9 CHỖ)
                  </h4>
                  
                  <div className="flex flex-col items-center mb-6">
                    <button
                      type="button"
                      onClick={selectAllNineSeats}
                      className={`text-xs font-extrabold px-4 py-2 rounded-full border transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs ${
                        selectedSeatIds.length === seats.length
                          ? "bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200"
                          : "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100"
                      }`}
                    >
                      <span>🌟</span>
                      <span>
                        {selectedSeatIds.length === seats.length
                          ? "Hủy chọn toàn bộ 9 ghế"
                          : "Chọn đặt nhanh nguyên xe 9 chỗ"}
                      </span>
                    </button>
                    <p className="text-[10px] text-stone-400 mt-2 text-center max-w-xs font-sans">
                      * Khách hàng được tự do chọn lẻ các ghế hoặc bao trọn toàn bộ 9 ghế của dòng xe limousine này.
                    </p>
                  </div>
                  
                  <div className="w-[280px] sm:w-[320px] mx-auto bg-stone-950 p-6 rounded-3xl border-4 border-stone-800 shadow-inner text-center relative">
                    {/* Front view marker */}
                    <div className="text-[10px] tracking-widest font-extrabold text-stone-500 uppercase border-b border-stone-800 pb-2.5 mb-6 text-center">
                      ĐẦU XE / KÍNH LÀI
                    </div>

                    {/* Driver and pilot seats */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      <div className="w-12 h-12 rounded-lg bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-500 text-[10px] font-bold">
                        Vô lăng
                      </div>
                      
                      {/* Seat 1 and 2 (Front) */}
                      {seats.slice(0, 2).map((seat) => {
                        const isSelected = selectedSeatIds.includes(seat.id);
                        return (
                          <button
                            key={seat.id}
                            type="button"
                            onClick={() => toggleSeat(seat.id)}
                            className={`w-12 h-12 rounded-lg flex flex-col justify-center items-center text-[10px] font-mono leading-none transition-all relative ${
                              seat.isBooked
                                ? "bg-stone-800 border border-stone-700 text-stone-600 cursor-not-allowed"
                                : isSelected
                                ? "bg-emerald-500 border border-emerald-400 text-white scale-105 shadow-md shadow-emerald-500/20"
                                : "bg-stone-700 border border-stone-600 text-stone-200 hover:bg-stone-600"
                            }`}
                            disabled={seat.isBooked}
                            title={`Ghế ${seat.number}: ${seat.price.toLocaleString()}đ`}
                          >
                            <span className="font-sans text-[10px] leading-tight block">{seat.number}</span>
                            <span className="text-[8px] opacity-80 font-mono mt-0.5">{seat.price / 1000}k</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Cabin aisle spacer line */}
                    <div className="h-px bg-stone-800 w-full mb-6" />

                    {/* Executive row 2 & 3 VIP chairs */}
                    <div className="space-y-4 mb-6">
                      {/* Row 2 (Seat 3, 4) */}
                      <div className="grid grid-cols-2 gap-8 px-4">
                        {seats.slice(2, 4).map((seat) => {
                          const isSelected = selectedSeatIds.includes(seat.id);
                          return (
                            <button
                              key={seat.id}
                              type="button"
                              onClick={() => toggleSeat(seat.id)}
                              className={`h-14 rounded-xl flex flex-col justify-center items-center font-mono leading-none transition-all relative ${
                                seat.isBooked
                                  ? "bg-stone-850 text-stone-700 border border-stone-800 cursor-not-allowed"
                                  : isSelected
                                  ? "bg-emerald-600 text-white scale-105 border-2 border-emerald-400 shadow-md shadow-emerald-500/20"
                                  : "bg-[#1b4332] text-stone-100 border border-emerald-800 hover:bg-[#2d5a45]"
                              }`}
                              disabled={seat.isBooked}
                            >
                              <span className="font-extrabold text-xs block">{seat.number}</span>
                              <span className="text-[9px] text-amber-400 mt-1 font-bold">VIP</span>
                              <span className="text-[9px] block text-amber-200/90 font-mono">{seat.price / 1000}k</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Row 3 (Seat 5, 6) */}
                      <div className="grid grid-cols-2 gap-8 px-4">
                        {seats.slice(4, 6).map((seat) => {
                          const isSelected = selectedSeatIds.includes(seat.id);
                          return (
                            <button
                              key={seat.id}
                              type="button"
                              onClick={() => toggleSeat(seat.id)}
                              className={`h-14 rounded-xl flex flex-col justify-center items-center font-mono leading-none transition-all relative ${
                                seat.isBooked
                                  ? "bg-stone-850 text-stone-700 border border-stone-800 cursor-not-allowed"
                                  : isSelected
                                  ? "bg-emerald-600 text-white scale-105 border-2 border-emerald-400 shadow-md shadow-emerald-500/20"
                                  : "bg-[#1b4332] text-stone-100 border border-emerald-800 hover:bg-[#2d5a45]"
                              }`}
                              disabled={seat.isBooked}
                            >
                              <span className="font-extrabold text-xs block">{seat.number}</span>
                              <span className="text-[9px] text-amber-400 mt-1 font-bold">VIP</span>
                              <span className="text-[9px] block text-amber-200/90 font-mono">{seat.price / 1000}k</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Back standard bench (Seat 7, 8, 9) */}
                    <div className="grid grid-cols-3 gap-2.5 pt-4 border-t border-stone-900">
                      {seats.slice(6, 9).map((seat) => {
                        const isSelected = selectedSeatIds.includes(seat.id);
                        return (
                          <button
                            key={seat.id}
                            type="button"
                            onClick={() => toggleSeat(seat.id)}
                            className={`h-12 rounded-lg flex flex-col justify-center items-center font-mono leading-none transition-all ${
                              seat.isBooked
                                ? "bg-stone-800 border border-stone-700 text-stone-600 cursor-not-allowed"
                                : isSelected
                                ? "bg-emerald-500 border border-emerald-400 text-white scale-105 shadow-md shadow-emerald-500/20"
                                : "bg-stone-700 border border-stone-600 text-stone-200 hover:bg-stone-600"
                            }`}
                            disabled={seat.isBooked}
                          >
                            <span className="font-sans text-[10px] leading-tight block">{seat.number}</span>
                            <span className="text-[8px] opacity-80 font-mono mt-0.5">{seat.price / 1000}k</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Seat category legend */}
                  <div className="mt-4 flex justify-between text-[11px] text-stone-500 max-w-sm mx-auto p-2 bg-stone-50 rounded-lg">
                    <span className="flex items-center space-x-1">
                      <span className="w-3 h-3 bg-[#1b4332] border border-emerald-800 rounded-xs inline-block" />
                      <span>VIP</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-3 h-3 bg-stone-750 border border-stone-650 rounded-xs inline-block" />
                      <span>Phổ thông / Phụ</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-3 h-3 bg-stone-800 rounded-xs inline-block" />
                      <span>Đặc khít / Đã khóa</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-3 h-3 bg-emerald-500 rounded-xs inline-block" />
                      <span>Đã chọn</span>
                    </span>
                  </div>
                </div>

                {/* Selected summary */}
                {selectedSeatIds.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex justify-between items-center text-left"
                  >
                    <div>
                      <span className="text-xs text-amber-800 font-bold block">Ghế đã chọn của bạn:</span>
                      <span className="font-extrabold text-[#1b4332] text-sm">
                        {seats
                          .filter((s) => selectedSeatIds.includes(s.id))
                          .map((s) => s.number)
                          .join(", ")}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-amber-800 font-bold block">Tổng cộng tạm tính</span>
                      <span className="font-extrabold text-lg text-amber-600 font-mono">
                        {getSelectedSeatsPrice().toLocaleString()} VNĐ
                      </span>
                    </div>
                  </motion.div>
                )}

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
                        {from === "Mộc Châu" ? "Điểm đón tại Mộc Châu" : `Điểm đón tại ${from}`}
                      </label>
                      <select
                        value={pickupPoint}
                        onChange={(e) => setPickupPoint(e.target.value)}
                        className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 cursor-pointer text-stone-800 font-medium"
                      >
                        {finalPickupPoints.map((p, i) => (
                          <option key={i} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-stone-700 font-semibold block">
                        {from === "Mộc Châu" ? `Điểm trả tại ${to}` : "Điểm trả tại Mộc Châu"}
                      </label>
                      <select
                        value={dropoffPoint}
                        onChange={(e) => setDropoffPoint(e.target.value)}
                        className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 cursor-pointer text-stone-800 font-medium"
                      >
                        {finalDropoffPoints.map((p, i) => (
                          <option key={i} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>

                    {((pickupPoint.toLowerCase().includes("tận nơi") || pickupPoint.toLowerCase().includes("tại nhà") || pickupPoint.toLowerCase().includes("tận cổng")) || 
                      (dropoffPoint.toLowerCase().includes("tận nơi") || dropoffPoint.toLowerCase().includes("tại nhà") || dropoffPoint.toLowerCase().includes("tận cổng"))) && (
                      <div className="space-y-1.5 p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-xl" id="custom_address_wrapper">
                        <label className="text-xs text-[#1b4332] font-bold block">Địa chỉ đón/trả chi tiết</label>
                        <input
                          type="text"
                          required
                          value={customHanoiAddress}
                          onChange={(e) => setCustomHanoiAddress(e.target.value)}
                          placeholder="Mời nhập số nhà, tên khách sạn/homestay, ngõ/phố chi tiết..."
                          className="w-full px-3 py-2 border border-emerald-300 rounded-lg text-xs font-semibold focus:outline-none focus:border-emerald-500 bg-white text-stone-800"
                        />
                        <p className="text-[10px] text-amber-600 font-sans font-bold leading-relaxed">
                          * Quý khách vui lòng cung cấp địa chỉ chính xác để nhà xe sắp xếp lệnh đón/trả thuận tiện nhất. Phụ phí (nếu có) sẽ được tổng đài viên thông báo khi xác nhận.
                        </p>
                      </div>
                    )}
                  </div>

                   {/* Coupon Code Section */}
                   <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-xl space-y-2 text-left" id="coupon_redemption_box">
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
                           ✓ Áp dụng mã {appliedCoupon.code} giảm {appliedCoupon.discountPercentage}% (-{((getSelectedSeatsPrice() * appliedCoupon.discountPercentage) / 100).toLocaleString()}đ)
                         </p>
                      )}
                   </div>

                   {/* Point Deduction Section for logged-in customer */}
                   {currentUser && currentUser.role === "customer" && currentUser.points > 0 && (
                     <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-xl space-y-2 text-left" id="point_redemption_box">
                       {isEligibleForPointsDeduction ? (
                         <>
                           <div className="flex items-center justify-between">
                             <span className="text-xs font-extrabold text-[#1b4332] flex items-center gap-1">
                               <Award className="w-4 h-4 text-emerald-600" />
                               Phần thưởng tích lũy: Sẵn có {currentUser.points} điểm ({ (currentUser.points * 1000).toLocaleString() }đ)
                             </span>
                             <label className="relative inline-flex items-center cursor-pointer">
                               <input
                                 type="checkbox"
                                 checked={usePoints}
                                 onChange={(e) => setUsePoints(e.target.checked)}
                                 className="sr-only peer"
                               />
                               <div className="w-9 h-5 bg-stone-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-emerald-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                             </label>
                           </div>
                           <p className="text-[10px] text-stone-500">
                             * Tích điểm: Nhận ngay 5% giá trị quy đổi tiền mặt vào ví điểm cho mỗi chuyến đi hoàn thành thành công.
                           </p>
                           {usePoints && (
                             <div className="p-2 bg-white rounded-lg border border-emerald-200 flex justify-between items-center text-xs text-emerald-800 font-bold">
                               <span>Số tiền được giảm:</span>
                               <span className="font-mono text-red-600">-{ Math.min(getSelectedSeatsPrice(), currentUser.points * 1000).toLocaleString() } VNĐ</span>
                             </div>
                           )}
                         </>
                       ) : (
                         <div className="space-y-1.5">
                           <div className="flex items-start gap-1 pb-1">
                             <Award className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                             <div>
                               <span className="text-xs font-bold text-stone-600">
                                 Sử dụng điểm trực tiếp (Đang khóa 🔒)
                               </span>
                               <span className="text-[10px] text-stone-500 block">Ví điểm khả dụng: {currentUser.points} điểm (~{(currentUser.points * 1000).toLocaleString()}đ)</span>
                             </div>
                           </div>
                           <div className="bg-amber-50 border border-amber-100 p-2.5 rounded-lg text-[10px] text-amber-800 leading-normal font-sans font-medium">
                             🚀 Tính năng áp điểm trực tiếp khấu trừ vào đơn hàng sẽ được kích hoạt từ **lần đặt vé thứ 3 trở đi** (Hiện tại lịch sử của bạn ghi nhận: <b>{userBookingsCount}/2 chuyến hoàn thành</b>).
                             <br />
                             <span className="text-stone-500 font-normal mt-1 block"><b>Mẹo:</b> Bạn vẫn luôn có thể vào <b>Trang cá nhân ➔ Lợi ích điểm thưởng</b> để đổi điểm thành các mã Coupon siêu rẻ giảm giá ngay bất kì lúc nào!</span>
                           </div>
                         </div>
                       )}
                     </div>
                   )}
 
                   {/* Summary dynamic pricing display */}
                   <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs space-y-1.5" id="checkout_price_totals_summary">
                     <div className="flex justify-between text-stone-600">
                       <span>Số ghế đã chọn ({selectedSeatIds.length} ghế):</span>
                       <span className="font-mono font-bold text-stone-800">{seats.filter(s => selectedSeatIds.includes(s.id)).map(s => s.number).join(", ")}</span>
                     </div>
                     <div className="flex justify-between text-stone-600">
                       <span>Đơn giá gốc:</span>
                       <span className="font-mono">{getSelectedSeatsPrice().toLocaleString()}đ</span>
                     </div>
                     
                     {appliedCoupon && (
                       <div className="flex justify-between text-emerald-700 font-bold">
                         <span>Mã giảm giá ({appliedCoupon.discountPercentage}%):</span>
                         <span className="font-mono">- {((getSelectedSeatsPrice() * appliedCoupon.discountPercentage) / 100).toLocaleString()}đ</span>
                       </div>
                     )}

                     {usePoints && isEligibleForPointsDeduction && currentUser && currentUser.role === "customer" && (
                       <div className="flex justify-between text-emerald-700 font-bold">
                         <span>Giảm trừ điểm tích lũy ({Math.min(getSelectedSeatsPrice() / 1000, usablePoints)} điểm):</span>
                         <span className="font-mono">- {Math.min(getSelectedSeatsPrice(), usablePoints * 1000).toLocaleString()}đ</span>
                       </div>
                     )}
                     <div className="h-px bg-stone-200 my-2" />
                     <div className="flex justify-between items-center">
                       <span className="text-sm font-extrabold text-stone-850">Tổng thanh toán thực tế:</span>
                       <span className="text-lg font-black text-[#1b4332] font-mono">
                         {Math.max(0, getSelectedSeatsPrice() - ((appliedCoupon ? (getSelectedSeatsPrice() * appliedCoupon.discountPercentage) / 100 : 0) + (usePoints && isEligibleForPointsDeduction ? Math.min(getSelectedSeatsPrice(), usablePoints * 1000) : 0))).toLocaleString()}đ
                       </span>
                     </div>
                   </div>

                  {/* Informational advice */}
                  <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 flex items-start space-x-2.5 text-stone-500 text-[11px] leading-relaxed">
                    <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      * Quý khách vui lòng có mặt tại điểm đón trước 15 phút. Lái xe sẽ liên hệ gọi điện xác nhận đón trước 30-45 phút so với giờ xuất bến. Vé có giá trị trong ngày và chuyến đi đã ghi.
                    </span>
                  </div>

                  {/* Anti-spam Verification math block */}
                  <div className="p-3 bg-amber-50/40 border border-amber-200/60 rounded-xl space-y-2">
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
                      <span className="text-[10px] text-stone-500 font-medium">*(Nhập số chính xác để xác thực)*</span>
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="text-center text-xs font-bold text-red-600 bg-red-50 p-2 rounded-lg">
                      ⚠ {errorMsg}
                    </div>
                  )}

                  {/* Booking Trigger Button */}
                  <button
                    type="submit"
                    id="submit_booking_limousine"
                    disabled={isSubmitting}
                    className={`w-full py-3.5 bg-gradient-to-r from-emerald-600 to-[#1b4332] text-white rounded-xl font-bold text-sm tracking-wide transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                      isSubmitting ? "opacity-60 cursor-not-allowed" : "shadow-md shadow-emerald-800/20 hover:from-emerald-700 hover:to-[#122e22]"
                    }`}
                  >
                    <ShieldCheck className="w-4.5 h-4.5" />
                    <span>{isSubmitting ? "Đang xử lý giữ chỗ..." : "Xác Nhận Giữ Ghế & Đặt Vé"}</span>
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      ) : (
        <div className="bg-stone-50 p-8 rounded-3xl border border-stone-200 text-center shadow-sm mt-8">
          <div className="text-emerald-700 font-bold mb-4">Để đặt xe cho tuyến này ( {from} ➔ {to} ), vui lòng liên hệ chúng tôi qua:</div>
          <div className="flex justify-center gap-4">
            <a href="tel:0971050324" className="bg-emerald-600 text-white px-6 py-3 rounded-full font-bold">Hotline: 0971050324</a>
            <a href="https://zalo.me/0971050324" className="bg-sky-600 text-white px-6 py-3 rounded-full font-bold">Zalo: 0971050324</a>
          </div>
        </div>
      )}
    </div>
  );
}
