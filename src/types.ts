export interface Seat {
  id: string;
  number: string;
  type: 'standard' | 'vip_massage' | 'front';
  price: number;
  isBooked: boolean;
}

export interface LimousineTrip {
  id: string;
  from: string;
  to: string;
  departureTime: string;
  duration: string; // e.g., "4.5 giờ"
  priceStandard: number;
  priceVip: number;
  busCompany: string; // e.g., "Xe Đi Mộc Châu Limousine"
  facilities: string[];
  recommendationLabel?: string;
}

export interface Accommodation {
  id: string;
  name: string;
  rating: number; // 1-5 stars
  type: string; // Khách Sạn, Resort, Homestay, Nhà Nghỉ, Căn Hộ
  description: string;
  images: string[];
  location: string;
  amenities: string[];
  roomTypes: {
    name: string;
    pricePerNight: number;
    capacity: string;
    description: string;
  }[];
}

export interface TourCombo {
  id: string;
  name: string;
  accommodationId: string;
  images: string[];
  slug: string;
  tag: string;
  durationText: string; // e.g., "2N1Đ hoặc 3N2Đ"
  pricePerPerson: number;
  priceWeekday: number;
  priceWeekend: number;
  originalPrice: number;
  highlights: string[];
  description: string;
  itinerary?: {
    day: number;
    title: string;
    content: string;
  }[];
  isActive?: boolean;
}

export interface Booking {
  id: string;
  userId?: string;
  type: 'limousine' | 'combo' | 'shared_car' | 'private_charter';
  bookingDate: string;
  travelDate: string;
  returnDate?: string;
  passengerName: string;
  passengerPhone: string;
  passengerEmail: string;
  pickupPoint: string;
  dropoffPoint: string;
  totalPrice: number;
  depositAmount?: number; // Tiền khách đã cọc (VNĐ)
  operatorNotes?: string; // Ghi chú điều hành / thu tiền của nhà xe
  driverName?: string; // Tên tài xế / lái xe đi khách này
  driverPhone?: string; // Số điện thoại lái xe
  vehiclePlate?: string; // Biển số xe đưa đón khách
  status: 'pending' | 'success' | 'completed' | 'cancelled';
  notes?: string;
  couponCode?: string;
  couponId?: string;
  pointsDeducted?: number;
  pointsRefunded?: boolean; // Prevent double refunds when a reservation is cancelled.
  discountAmount?: number;
  
  // Limousine specific
  seatNumbers?: string[];
  departureTime?: string;
  routeSelection?: string;
  
  // Combo specific
  comboId?: string;
  accommodationName?: string;
  roomTypeName?: string;
  roomQuantity?: number;
  nights?: number;
  isReturningCustomer?: boolean;
  isPrepaid?: boolean;
  seatCount?: number;
  deviceId?: string;
}

export interface Review {
  id: string;
  destinationId: string;
  userName: string;
  userEmail?: string;
  userAvatar?: string;
  rating: number; // 1-5
  comment: string;
  timestamp: string;
}

export interface Destination {
  id: string;
  name: string;
  image: string;
  tag: string;
  distance: string; // e.g., "Cách trung tâm 5km"
  description: string;
  bestTime: string;
  tips: string;
}

export interface GuideArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string[]; // Current structure in TravelGuide.tsx uses array of strings
  imageUrl: string;
  category: "checkin" | "food" | "tips" | "season";
  categoryLabel: string;
  readTime: string;
  date: string;
  views: number;
  likes: number;
  saves: number;
  isHot?: boolean;
  albumImages?: string[];
}

export interface User {
  id: string;
  phone: string;
  name: string;
  email?: string;
  role: 'customer' | 'operator';
  points: number; // Available credit; 1 point = 1,000 VND, discounts start on second order
  welcomeBonusGranted?: boolean; // True once a new membership receives its 10-point welcome reward
  welcomeBonusPoints?: number;
  welcomeBonusAt?: string;
  rewardedBookingIds?: string[]; // Unique confirmed orders, prevents duplicate +1 awards
  completedBookingsCount?: number; // Legacy-safe count, at least rewardedBookingIds.length
  usedCoupons?: string[];
  address?: string;
  favPickup?: string;
  favDropoff?: string;
  avatarDataUrl?: string; // Compressed thumbnail only, never original photograph
  gender?: 'male' | 'female' | 'other' | 'undisclosed';
  birthDate?: string; // Optional YYYY-MM-DD, used for birthday/month and age
  passwordResetToDefault?: boolean;
  customPassword?: string;
}

export interface BlockedSeat {
  tripId: string; // trip.id e.g. "trip_1" or "trip_custom_*"
  travelDate: string; // format "YYYY-MM-DD" or similar
  seatId: string; // s1-s9
  customerPhone?: string;
  customerName?: string;
  pickupPoint?: string;
  dropoffPoint?: string;
  note?: string;
}

export interface LocationPoint {
  id: string;
  name: string;
  type: "pickup" | "dropoff";
  city: "Hà Nội" | "Mộc Châu";
  serviceType: "limousine" | "shared" | "both";
}

export interface DailyScheduleException {
  id: string;
  date: string; // YYYY-MM-DD
  route: string; // "Hà Nội - Mộc Châu" or "Mộc Châu - Hà Nội"
  time: string; // e.g. "07:30"
  type: 'blocked' | 'extra';
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string; // ISO string
  type: 'booking_new' | 'booking_confirmed' | 'system' | 'admin_manual';
  isRead: boolean;
  deviceId?: string;
  targetPhone?: string;
  metadata?: {
    bookingId?: string;
    customerName?: string;
    customerPhone?: string;
    seats?: string[];
    travelDate?: string;
    departureTime?: string;
    route?: string;
    totalPrice?: number;
    pickupPoint?: string;
    dropoffPoint?: string;
  };
}

export interface LimousineConfig {
  weekendPriceStandard: number;
  weekendPriceVip: number;
  weekdayDiscountPercentage: number;
  scheduleExceptions?: DailyScheduleException[];
}

export interface SharedCarConfig {
  weekendPriceStandard: number;
  weekdayDiscountPercentage: number;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  plate: string;
  carType?: string;
  note?: string;
  status?: 'active' | 'busy' | 'off';
  avatar?: string;
  experienceYears?: number;
}

export interface Coupon {
  id: string;
  code: string;
  discountPercentage: number;
  isActive?: boolean;
  isPublished?: boolean;
  title?: string;
  audience?: 'all' | 'male' | 'female' | 'birthday' | 'holiday' | 'random' | 'age';
  validFrom?: string; // YYYY-MM-DD in Vietnam
  validUntil?: string;
  birthdayWindow?: 'day' | 'month';
  minAge?: number;
  maxAge?: number;
  assignedUserIds?: string[]; // Explicit one-time random selection by Admin
  usageLimit?: number; // Maximum times this coupon can be redeemed across all members
  usageCount?: number; // Times this coupon has been successfully redeemed
}

export interface ZaloGroup {
  id: string;
  name: string;
  topic: string;
  description: string;
  zaloUrl: string;
  iconEmoji: string;
  imageUrl?: string;
  memberCountNote?: string;
  order: number;
  isActive: boolean;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CommunityQuestion {
  id: string;
  authorId?: string;
  authorName: string;
  authorPhone?: string;
  authorRole?: string;
  topic: string;
  title: string;
  content: string;
  timestamp: string;
  likes: number;
  status: 'published' | 'pending' | 'reported' | 'hidden';
  reportCount?: number;
  comments: {
    id: string;
    authorName: string;
    content: string;
    timestamp: string;
  }[];
}

