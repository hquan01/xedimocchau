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
  originalPrice: number;
  highlights: string[];
  description: string;
  itinerary?: {
    day: number;
    title: string;
    content: string;
  }[];
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
  status: 'pending' | 'success' | 'completed' | 'cancelled';
  notes?: string;
  couponCode?: string;
  pointsDeducted?: number;
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
  points: number; // Earned points: 1 point = 1,000 VND
  usedCoupons?: string[];
  address?: string;
  favPickup?: string;
  favDropoff?: string;
  passwordResetToDefault?: boolean;
  customPassword?: string;
}

export interface BlockedSeat {
  tripId: string; // trip.id e.g. "trip_1" or "trip_custom_*"
  travelDate: string; // format "YYYY-MM-DD" or similar
  seatId: string; // s1-s9
  customerPhone?: string;
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
  type: 'booking_new' | 'system';
  isRead: boolean;
  deviceId?: string;
  metadata?: {
    bookingId?: string;
    customerName?: string;
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

export interface Coupon {
  id: string;
  code: string;
  discountPercentage: number;
  isActive?: boolean;
  isPublished?: boolean;
}
