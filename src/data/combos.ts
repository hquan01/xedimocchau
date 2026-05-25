import { TourCombo } from "../types";

export const INITIAL_COMBOS: TourCombo[] = [
  {
    id: "combo_1",
    name: "Combo Kỳ Nghĩ 5 Sao - Mường Thanh Luxury Mộc Châu",
    accommodationId: "acc_1",
    images: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=cover&w=800&q=80",
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=cover&w=800&q=80"
    ],
    slug: "muong-thanh-combo",
    tag: "Khuyên Dùng / Nghỉ Dưỡng",
    durationText: "2 Ngày 1 Đêm (Hỗ trợ đổi 3N2Đ)",
    pricePerPerson: 1090000,
    priceWeekday: 1090000,
    priceWeekend: 1290000,
    originalPrice: 1450000,
    highlights: [
      "Vé xe Limousine VIP khứ hồi Hà Nội - Mộc Châu đón trả tận cổng khách sạn",
      "1 Đêm nghỉ tại phòng Deluxe sang trọng view núi cực thơ",
      "Buffet sáng cao cấp hơn 50 món Việt - Á - Âu",
      "Tự do sử dụng bể bơi bốn mùa nước ấm và phòng thể thao",
      "Nước uống đón tiếp (welcome drink) khi check-in nhận phòng"
    ],
    description: "Gói combo bán chạy nhất tại hệ thống Xe Đi Mộc Châu. Trải nghiệm hành trình thư thái trên Limousine VIP kết hợp kỳ quan nghỉ dưỡng 5 sao bậc nhất của cao nguyên Mộc Châu xanh rì mướt.",
    itinerary: [
      { day: 1, title: "Hà Nội - Cao nguyên Mộc Châu", content: "Xe đón khách tại các điểm hẹn cố định tại Hà Nội. Di chuyển đến Mộc Châu bằng xe Limousine VIP. Check-in khách sạn Mường Thanh, tự do tắm hồ bơi khoáng nóng." },
      { day: 2, title: "Khám phá Mộc Châu - Hà Nội", content: "Thưởng thức Buffet sáng. Tham quan Đồi Chè Trái Tim hoặc Cầu Kính Bạch Long. Chiều xe đón trở về Hà Nội, kết thúc hành trình tốt đẹp." }
    ]
  },
  {
    id: "combo_2",
    name: "Combo Lãng Mạn Bản Áng - Phoenix Resort Bungalow Đồi Thông",
    accommodationId: "acc_2",
    images: [
      "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?ixlib=rb-4.0.3&auto=format&fit=cover&w=800&q=80",
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3&auto=format&fit=cover&w=800&q=80"
    ],
    slug: "phoenix-combo",
    tag: "Thơ Mộng / Cặp Đôi",
    durationText: "2 Ngày 1 Đêm",
    pricePerPerson: 890000,
    priceWeekday: 890000,
    priceWeekend: 990000,
    originalPrice: 1190000,
    highlights: [
      "Vé xe Limousine khứ hồi khứ hồi thương gia đón trả tận Đồi Thông Bản Áng",
      "1 Đêm ngủ Bungalow gỗ tam giác lơ lửng sườn đồi lãng mạn chuẩn Tây Bắc",
      "Bữa ăn sáng ấm áp tại nhà hàng rừng thông tươi mát",
      "Miễn phí vé tham quan check-in sâu bên trong Rừng Thông Bản Áng",
      "Tặng thêm 01 ly cà phê/trà sữa ngắm sương sớm tại Phoenix Coffee"
    ],
    description: "Dành riêng cho những tâm hồn lãng mạn yêu thiên nhiên. Bungalow gỗ nằm thoai thoải bên sườn đồi, nghe tiếng thông reo rì rào buổi chiều tà, thức giấc cùng làn sương mỏng manh bay trên mặt hồ Bản Áng.",
    itinerary: [
      { day: 1, title: "Hà Nội - Rừng Thông Bản Áng", content: "Di chuyển bằng Limousine 9 chỗ đời mới. Nhận phòng Bungalow gỗ giữa rừng thông. Tối tự do nướng BBQ ngoài trời (chi phí tự túc)." },
      { day: 2, title: "Săn sương sớm - Trải nghiệm địa phương", content: "Dạo quanh hồ Bản Áng ngắm sương mù sớm. Tham quan vườn dâu tây Chimi. Trưa trả phòng và lên xe về lại Hà Nội." }
    ]
  }
];
