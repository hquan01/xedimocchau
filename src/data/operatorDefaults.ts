import type { RestaurantItem } from "../components/operator/RestaurantManagement";
import type { FlowerSeasonItem } from "../components/operator/FlowerSeasonManagement";
import type { PartnerItem } from "../components/operator/PartnerManagement";
import type { TaxiVehicle } from "../components/operator/TaxiFleetManagement";
import type { MotorbikeVehicle } from "../components/operator/MotorbikeManagement";
import type { AIKnowledgeItem } from "../components/operator/AIAssistantManagement";

export const INITIAL_RESTAURANTS: RestaurantItem[] = [
  {
    id: "rest-01",
    name: "Nhà hàng Bê Chao 64 Mộc Châu",
    category: "dac_san",
    address: "Tiểu khu Chiềng Đi, TT. Nông Trường Mộc Châu",
    phone: "0969.811.666",
    priceRange: "150.000đ - 300.000đ / người",
    openHours: "07:00 - 22:00",
    specialties: ["Bê chao nóng giòn chấm tương gừng", "Cá suối chiên", "Rau cải mèo xào tỏi"],
    isPartner: true,
    commissionRate: 10,
    status: "active",
    rating: 4.9
  },
  {
    id: "rest-02",
    name: "Nhà hàng Cá Hồi & Cá Tầm Vườn Đào",
    category: "dac_san",
    address: "Tiểu khu Vườn Đào, TT. Nông Trường Mộc Châu",
    phone: "0982.592.592",
    priceRange: "200.000đ - 400.000đ / người",
    openHours: "08:00 - 22:00",
    specialties: ["Gỏi cá hồi tươi", "Lẩu cá tầm măng cay", "Cháo cá hồi"],
    isPartner: true,
    commissionRate: 10,
    status: "active",
    rating: 4.8
  },
  {
    id: "rest-03",
    name: "Nhà hàng Nam Mèo - Ẩm thực Tây Bắc",
    category: "dac_san",
    address: "Ngã 3 Rừng Thông Bản Áng, Đông Sang, Mộc Châu",
    phone: "0971.050.324",
    priceRange: "120.000đ - 250.000đ / người",
    openHours: "09:00 - 22:30",
    specialties: ["Lẩu gà đồi lá é", "Lợn bản nướng mắc khén", "Cơm lam nếp nương"],
    isPartner: true,
    commissionRate: 8,
    status: "active",
    rating: 4.7
  },
  {
    id: "rest-04",
    name: "Tiệm Cà Phê Đồi Gió Mộc Châu",
    category: "cafe_view",
    address: "Đỉnh đồi chè Trái Tim, TT. Nông Trường",
    phone: "0945.123.789",
    priceRange: "35.000đ - 65.000đ",
    openHours: "06:30 - 18:30",
    specialties: ["Cà phê muối Bản Áng", "Trà ô long sữa tươi Mộc Châu", "Sữa chua nếp cẩm"],
    isPartner: false,
    commissionRate: 0,
    status: "active",
    rating: 4.9
  }
];

export const INITIAL_FLOWER_SEASONS: FlowerSeasonItem[] = [
  {
    id: "flower-01",
    name: "Mùa Hoa Mận Trắng Tinh Khôi",
    timeRange: "Tháng 1 - Tháng 2",
    location: "Thung lũng mận Nà Ka, Thung lũng Mu Náu, Bản Pa Phách",
    status: "sap_no",
    verificationDate: "03/11/2026",
    verifier: "Ban QL Du lịch & Kiểm lâm Mộc Châu",
    description: "Cả thung lũng Nà Ka khoác lên mình màu áo trắng muốt như tuyết. Hoa nở rộ trắng trời tạo nên khung cảnh tiên cảnh độc nhất vô nhị vùng Tây Bắc.",
    bestTimeOfDay: "08:00 - 10:30 sáng (khi nắng sớm rọi qua màn sương mỏng)",
    checkInTips: "Nên mang trang phục màu nổi (đỏ, vàng, cam hoặc váy thổ cẩm) để có những khung hình nổi bật nhất.",
    published: true
  },
  {
    id: "flower-02",
    name: "Mùa Mận Hậu Chín Đỏ",
    timeRange: "Tháng 4 - Tháng 6",
    location: "Vườn mận Nà Ka, Phiêng Cành, Bản Pa Phách",
    status: "da_qua",
    verificationDate: "01/11/2026",
    verifier: "Hợp tác xã Nông nghiệp Mộc Châu",
    description: "Du khách tự tay hái những trái mận hậu chín căng mọng phủ phấn trắng, chấm cùng muối ớt mắc khén cay nồng tại gốc.",
    bestTimeOfDay: "Buổi sáng mát trời",
    checkInTips: "Nên đi giày thể thao có độ bám tốt để leo đồi mận an toàn.",
    published: true
  },
  {
    id: "flower-03",
    name: "Mùa Hoa Cải Trắng & Hoa Dã Quỳ",
    timeRange: "Tháng 11 - Tháng 12",
    location: "Rừng thông Bản Áng, Thung lũng Ba Phách, Bản Áng 2",
    status: "dang_no",
    verificationDate: "03/11/2026",
    verifier: "Trạm Khảo sát Du lịch Cao nguyên",
    description: "Cánh đồng hoa cải trắng bạt ngàn mênh mông, điểm xuyết những vạt hoa dã quỳ vàng rực rỡ dọc cung đường đèo.",
    bestTimeOfDay: "14:30 - 17:00 chiều đón hoàng hôn",
    checkInTips: "Giá vé vào chụp ảnh tại các vườn cải khoảng 20.000đ - 30.000đ/người.",
    published: true
  },
  {
    id: "flower-04",
    name: "Săn Mây Đỉnh Pha Luông & Tà Xùa Mộc Châu",
    timeRange: "Quanh năm (đẹp nhất Tháng 10 - Tháng 3)",
    location: "Đỉnh Pha Luông, Bản Hang Kia, Xã Chiềng Sơn",
    status: "dang_no",
    verificationDate: "02/11/2026",
    verifier: "Hướng dẫn viên bản địa",
    description: "Biển mây bồng bềnh cuồn cuộn dưới chân núi cao 2.000m. Không khí se lạnh tinh khôi lúc bình minh.",
    bestTimeOfDay: "05:30 - 07:30 sáng",
    checkInTips: "Bắt buộc có áo ấm dày, giày trekking và theo dõi dự báo thời tiết trước khi leo núi.",
    published: true
  }
];

export const INITIAL_PARTNERS: PartnerItem[] = [
  {
    id: "part-01",
    name: "Nhà Ta Homestay Mộc Châu",
    category: "homestay",
    contactPerson: "Anh Tuấn Anh",
    phone: "0968.123.456",
    address: "Tiểu khu 3, Thị trấn Mộc Châu",
    contractCode: "HD-MC-2025-01",
    commissionRate: 15,
    status: "active",
    bankAccount: "Techcombank 1903456789 (Nguyen Tuan Anh)",
    notes: "Đối tác combo phòng + xe QT Limousine đón tận nơi"
  },
  {
    id: "part-02",
    name: "Thảo Nguyên Resort Mộc Châu",
    category: "hotel",
    contactPerson: "Chị Mai Lan (Phòng Kinh Doanh)",
    phone: "0212.3869.888",
    address: "Tiểu khu Khí Tượng, TT. Nông Trường",
    contractCode: "HD-MC-2025-02",
    commissionRate: 12,
    status: "active",
    bankAccount: "Vietcombank 0541000123456 (Cong ty CP Thao Nguyen)",
    notes: "Ưu tiên đặt phòng gia đình và villa"
  },
  {
    id: "part-03",
    name: "Nhà hàng Bê Chao 64",
    category: "restaurant",
    contactPerson: "Anh Hải",
    phone: "0969.811.666",
    address: "Tiểu khu Chiềng Đi, Mộc Châu",
    contractCode: "HD-MC-2025-03",
    commissionRate: 10,
    status: "active",
    bankAccount: "BIDV 41110000987654 (Tran Van Hai)",
    notes: "Giảm 10% hoặc trích hoa hồng đoàn cho tài xế QT Limousine"
  },
  {
    id: "part-04",
    name: "Khu Du Lịch Cầu Kính Bạch Long",
    category: "activity",
    contactPerson: "Bộ phận Vé Đoàn Mộc Châu Island",
    phone: "0966.888.999",
    address: "Xã Mường Sang, Mộc Châu",
    contractCode: "HD-MC-2025-04",
    commissionRate: 8,
    status: "active",
    bankAccount: "VPBank 888888888 (Moc Chau Island)",
    notes: "Vé tham quan cầu kính & khu vui chơi mạo hiểm"
  }
];

export const INITIAL_TAXI_FLEET: TaxiVehicle[] = [
  {
    id: "taxi-01",
    plate: "26A-123.45",
    model: "Toyota Vios 4 chỗ",
    seats: 4,
    provider: "Taxi Xanh Mộc Châu (Anh Hùng)",
    phone: "0971.050.324",
    basePrice: 200000,
    routeQuote: "Nội thành Mộc Châu: 12.000đ/km • Đi Đồi chè: 150.000đ/chuyến",
    serviceArea: "Toàn bộ huyện Mộc Châu & Vân Hồ",
    status: "available",
    isVisible: true
  },
  {
    id: "taxi-02",
    plate: "26B-088.99",
    model: "Toyota Innova 7 chỗ",
    seats: 7,
    provider: "Đội Xe Ghép Mộc Châu (Anh Nam)",
    phone: "0855.368.889",
    basePrice: 350000,
    routeQuote: "TT. Mộc Châu ➔ Thác Dải Yếm: 250.000đ",
    serviceArea: "Mộc Châu, Vân Hồ, Sơn La, Hà Nội",
    status: "available",
    isVisible: true
  },
  {
    id: "taxi-03",
    plate: "26F-009.12",
    model: "Hyundai Solati 16 chỗ",
    seats: 16,
    provider: "Xe Hợp Đồng QT Travel",
    phone: "0971.050.324",
    basePrice: 1500000,
    routeQuote: "Tour trọn gói Mộc Châu 1 ngày: 1.800.000đ",
    serviceArea: "Hà Nội - Mộc Châu - Điểm tham quan",
    status: "available",
    isVisible: true
  }
];

export const INITIAL_MOTORBIKES: MotorbikeVehicle[] = [
  {
    id: "mb-01",
    plate: "26B1-123.45",
    model: "Honda Wave Alpha / RSX 110cc",
    type: "manual",
    totalQuantity: 15,
    availableQuantity: 12,
    dailyPrice: 150000,
    pickupLocations: ["Bến xe Limousine Mộc Châu", "Giao tận Homestay/Khách sạn miễn phí"],
    rentalRequirements: "Ảnh CCCD chính chủ hoặc Bằng lái xe. Tặng kèm 2 mũ bảo hiểm + 1 áo mưa.",
    status: "available",
    isVisible: true
  },
  {
    id: "mb-02",
    plate: "26B1-888.99",
    model: "Honda Vision / Air Blade 125cc",
    type: "scooter",
    totalQuantity: 10,
    availableQuantity: 8,
    dailyPrice: 200000,
    pickupLocations: ["Bến xe Limousine Mộc Châu", "Giao tận Homestay/Khách sạn miễn phí"],
    rentalRequirements: "CCCD / Hộ chiếu + Cọc 300k. Tặng kèm 2 mũ bảo hiểm đạt chuẩn + bản đồ du lịch.",
    status: "available",
    isVisible: true
  }
];

export const INITIAL_AI_FAQS: AIKnowledgeItem[] = [
  {
    id: "faq-01",
    topic: "Vé xe QT Limousine",
    question: "Giá vé xe QT Limousine Hà Nội - Mộc Châu bao nhiêu?",
    answer: "Giá vé từ 300.000đ - 350.000đ/ghế tùy vị trí ghế thường hay ghế VIP massage trung tâm. Đón trả tận nơi tại nội thành Hà Nội và tận cửa homestay Mộc Châu. Hotline đặt vé: 0971.050.324.",
    category: "TRANSPORT",
    priority: 1
  },
  {
    id: "faq-02",
    topic: "Mùa hoa mận",
    question: "Mùa hoa mận Mộc Châu nở vào tháng mấy và ở đâu đẹp nhất?",
    answer: "Hoa mận Mộc Châu nở rộ nhất vào Tháng 1 - Tháng 2 hàng năm. Điểm ngắm hoa đẹp nhất là Thung lũng mận Nà Ka và Thung lũng Mu Náu, Ba Phách. Thời điểm chụp ảnh lung linh nhất là 8h00 - 10h00 sáng khi nắng mai chiếu qua sương mỏng.",
    category: "DESTINATION",
    priority: 2
  },
  {
    id: "faq-03",
    topic: "Thời tiết & Trang phục",
    question: "Đi Mộc Châu mùa này cần chuẩn bị quần áo gì?",
    answer: "Mộc Châu nằm trên cao nguyên độ cao hơn 1.050m nên ban ngày mát mẻ nhưng chiều tối và sáng sớm nhiệt độ hạ nhanh (thường se lạnh 16-20°C). Bạn nên mang theo áo khoác ấm mỏng, khăn choàng và giày thể thao có độ bám tốt để leo đồi mận.",
    category: "WEATHER",
    priority: 3
  },
  {
    id: "faq-04",
    topic: "Đặc sản Mộc Châu",
    question: "Đến Mộc Châu nên ăn món gì ngon?",
    answer: "Top đặc sản không thể bỏ qua: Bê chao nóng giòn chấm tương gừng, Lẩu cá hồi/Cá tầm măng cay, Lẩu gà đồi lá é, Cá suối chiên giòn và sữa chua nếp cẩm Mộc Châu.",
    category: "FOOD",
    priority: 4
  }
];
