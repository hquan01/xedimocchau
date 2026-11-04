// Cấu trúc phân nhóm 16 phân hệ Trung tâm Quản trị Mộc Châu Travel 2.0
export interface AdminModuleItem {
  id: string;
  name: string;
  shortName: string;
  group: string;
  description: string;
  icon: string;
  badge?: string | number;
  keywords: string[];
}

export interface AdminNavGroup {
  id: string;
  title: string;
  description: string;
  icon: string;
  modules: AdminModuleItem[];
}

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    id: "ops_transport",
    title: "1. Điều hành & Vận tải",
    description: "Tổng quan điều hành, xe QT Limousine & đơn dịch vụ",
    icon: "Bus",
    modules: [
      {
        id: "overview",
        name: "Tổng quan điều hành",
        shortName: "Tổng quan",
        group: "ops_transport",
        description: "Bảng điều khiển KPI, đơn mới, cảnh báo và công nợ đến hạn",
        icon: "TrendingUp",
        keywords: ["tong quan", "kpi", "doanh thu", "canh bao", "dashboard", "dieu hanh"]
      },
      {
        id: "limousine_bookings",
        name: "Đặt chỗ & Vé xe Limousine",
        shortName: "Đặt chỗ",
        group: "ops_transport",
        description: "Quản lý vé đặt online, thanh toán cọc và danh sách khách",
        icon: "Bus",
        keywords: ["dat cho", "ve xe", "limousine", "khach dat", "coc tien", "dcar"]
      },
      {
        id: "limousine_seatlock",
        name: "Sơ đồ & Khóa ghế offline",
        shortName: "Khóa ghế",
        group: "ops_transport",
        description: "Xem sơ đồ ghế thực tế, khóa/mở ghế gọi điện thoại",
        icon: "Lock",
        keywords: ["khoa ghe", "so do ghe", "ghe vip", "mo khoa", "giu cho"]
      },
      {
        id: "limousine_schedules",
        name: "Lịch xe & Khung giờ chạy",
        shortName: "Lịch xe",
        group: "ops_transport",
        description: "Cấu hình chuyến chạy 06h30–18h30 hàng ngày hai chiều",
        icon: "Clock",
        keywords: ["lich xe", "gio chay", "chuyen xe", "xuat ben", "tuyen duong"]
      },
      {
        id: "limousine_pricing",
        name: "Bảng giá vé xe",
        shortName: "Giá vé",
        group: "ops_transport",
        description: "Cấu hình giá ghế thường, ghế VIP massage và phụ phí đón trả",
        icon: "Banknote",
        keywords: ["gia ve", "bang gia", "phu phi", "ghe massage", "tien ve"]
      },
      {
        id: "limousine_drivers",
        name: "Đội ngũ Lái xe & Phương tiện",
        shortName: "Lái xe",
        group: "ops_transport",
        description: "Phân công tài xế, biển số xe DCar và số điện thoại liên hệ",
        icon: "UserCheck",
        keywords: ["tai xe", "lai xe", "bien so xe", "phan cong", "doi xe"]
      },
      {
        id: "limousine_locations",
        name: "Điểm đón & Trả tận nơi",
        shortName: "Điểm đón/trả",
        group: "ops_transport",
        description: "Danh sách điểm đón nội thành Hà Nội & homestay Mộc Châu",
        icon: "MapPin",
        keywords: ["diem don", "diem tra", "noi thanh", "homestay", "don tra"]
      },
      {
        id: "limousine_customers",
        name: "Khách hàng & Hội viên",
        shortName: "Khách hàng",
        group: "ops_transport",
        description: "Lịch sử đi xe, hạng thành viên và tích lũy ưu đãi",
        icon: "User",
        keywords: ["khach hang", "hoi vien", "so dien thoai", "lich su di xe"]
      },
      {
        id: "limousine_coupons",
        name: "Mã giảm giá & Khuyến mãi",
        shortName: "Mã giảm giá",
        group: "ops_transport",
        description: "Tạo và quản lý voucher giảm giá, hạn sử dụng",
        icon: "Tag",
        keywords: ["ma giam gia", "coupon", "voucher", "khuyen mai", "chiet khau"]
      },
      {
        id: "taxi_tourist_cars",
        name: "Taxi & Xe du lịch 4-7-9-16 chỗ",
        shortName: "Taxi & Xe du lịch",
        group: "ops_transport",
        description: "Quản lý xe taxi 4-7 chỗ, xe 16 chỗ, nhà cung cấp và báo giá chuyến",
        icon: "Car",
        keywords: ["taxi", "xe 4 cho", "xe 7 cho", "xe 16 cho", "xe du lich", "bao gia"]
      },
      {
        id: "motorbike_rental",
        name: "Cho thuê xe máy",
        shortName: "Thuê xe máy",
        group: "ops_transport",
        description: "Quản lý xe số, xe tay ga, số lượng xe trống, điểm nhận trả & đơn đặt",
        icon: "Bike",
        keywords: ["thue xe may", "xe so", "xe tay ga", "giao xe", "xe vision", "wave"]
      },
      {
        id: "service_orders",
        name: "Đơn dịch vụ du lịch",
        shortName: "Đơn dịch vụ",
        group: "ops_transport",
        description: "Yêu cầu đặt phòng, bàn ăn, thuê xe máy và tour trọn gói",
        icon: "FileText",
        keywords: ["don dich vu", "dat phong", "dat ban", "tour", "thue xe"]
      }
    ]
  },
  {
    id: "travel_ecosystem",
    title: "2. Hệ sinh thái Du lịch",
    description: "Địa điểm, lưu trú, nhà hàng, mùa hoa & combo",
    icon: "Compass",
    modules: [
      {
        id: "destinations",
        name: "Địa điểm tham quan",
        shortName: "Địa điểm",
        group: "travel_ecosystem",
        description: "Danh mục thắng cảnh, giá vé cổng, giờ mở cửa và toạ độ",
        icon: "MapPin",
        keywords: ["dia diem", "thang canh", "bach long", "dai yem", "ve vao cong"]
      },
      {
        id: "accommodations_combos",
        name: "Homestay, Khách sạn & Combo",
        shortName: "Lưu trú & Combo",
        group: "travel_ecosystem",
        description: "Cơ sở lưu trú, hạng phòng và gói combo xe Limousine + phòng",
        icon: "Star",
        keywords: ["homestay", "khach san", "resort", "combo", "phong nghi"]
      },
      {
        id: "restaurants_culinary",
        name: "Nhà hàng & Ẩm thực",
        shortName: "Nhà hàng",
        group: "travel_ecosystem",
        description: "Quán ăn, cafe, thực đơn đặc sản bê chao, cá suối",
        icon: "DollarSign",
        keywords: ["nha hang", "quan an", "cafe", "dac san", "be chao", "am thuc"]
      },
      {
        id: "flower_seasons",
        name: "Mùa hoa & Trải nghiệm",
        shortName: "Mùa hoa",
        group: "travel_ecosystem",
        description: "Trạng thái nở thực tế thung lũng mận, cải trắng, tour trải nghiệm",
        icon: "CalendarDays",
        keywords: ["mua hoa", "hoa man", "hoa cai", "san may", "trai nghiem", "na ka"]
      }
    ]
  },
  {
    id: "content_community",
    title: "3. Nội dung & Cộng đồng",
    description: "Cẩm nang, SEO, hỏi đáp Zalo & đánh giá",
    icon: "MessageSquare",
    modules: [
      {
        id: "site_appearance",
        name: "Giao diện, Logo, Banner & Bài HOT",
        shortName: "Giao diện & Ảnh",
        group: "content_community",
        description: "Quản lý banner, logo, danh mục, bài nổi bật, liên hệ và xuất bản",
        icon: "Newspaper",
        keywords: ["giao dien", "logo", "banner", "bai hot", "anh", "noi dung", "quan ly"]
      },
      {
        id: "articles_guide",
        name: "Danh mục & Cẩm nang du lịch",
        shortName: "Cẩm nang & SEO",
        group: "content_community",
        description: "Bài viết chia sẻ kinh nghiệm, lịch trình mẫu và thẻ SEO",
        icon: "Newspaper",
        keywords: ["cam nang", "bai viet", "seo", "lich trinh mau", "tin tuc"]
      },
      {
        id: "community_zalo",
        name: "Cộng đồng & Nhóm Zalo",
        shortName: "Cộng đồng & Zalo",
        group: "content_community",
        description: "Quản lý bài hỏi đáp, kiểm duyệt và link tham gia nhóm Zalo",
        icon: "MessageSquare",
        keywords: ["cong dong", "zalo", "nhom zalo", "hoi dap", "dien dan"]
      },
      {
        id: "customer_reviews",
        name: "Đánh giá & Phản hồi",
        shortName: "Đánh giá",
        group: "content_community",
        description: "Kiểm duyệt review khách hàng về xe và các điểm du lịch",
        icon: "Award",
        keywords: ["danh gia", "review", "phan hoi", "sao", "kiem duyet"]
      }
    ]
  },
  {
    id: "tech_live_data",
    title: "4. Công nghệ & Dữ liệu sống",
    description: "Trợ lý AI Gemini, kết nối trạm thời tiết",
    icon: "Layers",
    modules: [
      {
        id: "ai_assistant",
        name: "Trợ lý AI & Tri thức",
        shortName: "Trợ lý AI",
        group: "tech_live_data",
        description: "Kiểm tra model Gemini, cấu hình câu hỏi thường gặp FAQ",
        icon: "Layers",
        keywords: ["ai", "gemini", "tro ly ao", "chat bot", "faq", "tri thuc"]
      },
      {
        id: "live_weather",
        name: "Thời tiết & Dữ liệu sống",
        shortName: "Thời tiết Live",
        group: "tech_live_data",
        description: "Giám sát nguồn dubaothoitiet.edu.vn, ping trạm và cảnh báo thời tiết",
        icon: "Clock",
        keywords: ["thoi tiet", "dubaothoitiet", "nhiet do", "mua", "khi tuong"]
      }
    ]
  },
  {
    id: "partners_finance",
    title: "5. Đối tác, Doanh thu & Hệ thống",
    description: "Mạng lưới đối tác, hoa hồng, thống kê & bảo mật",
    icon: "ShieldCheck",
    modules: [
      {
        id: "partner_network",
        name: "Mạng lưới Đối tác",
        shortName: "Đối tác",
        group: "partners_finance",
        description: "Hợp đồng liên kết nhà xe, homestay, nhà hàng và hoa hồng",
        icon: "UserCheck",
        keywords: ["doi tac", "nha xe", "lien ket", "hop dong", "chi nhanh"]
      },
      {
        id: "commissions_debt",
        name: "Hoa hồng & Công nợ",
        shortName: "Hoa hồng & Nợ",
        group: "partners_finance",
        description: "Đối soát hoa hồng cuối tháng, theo dõi công nợ phải thu",
        icon: "Calculator",
        keywords: ["hoa hong", "cong no", "doi soat", "thu tien", "tai chinh"]
      },
      {
        id: "growth_analytics",
        name: "Thống kê & Tăng trưởng",
        shortName: "Thống kê",
        group: "partners_finance",
        description: "Biểu đồ chuyển đổi, lượt xem, kênh truy cập và tỷ lệ giữ chân",
        icon: "TrendingUp",
        keywords: ["thong ke", "tang truong", "phan tich", "luot xem", "chuyen doi"]
      },
      {
        id: "security_config",
        name: "Cấu hình & Bảo mật",
        shortName: "Bảo mật",
        group: "partners_finance",
        description: "Mã PIN quản trị viên, nhật ký audit logs, sao lưu & khôi phục",
        icon: "Shield",
        keywords: ["bao mat", "ma pin", "sao luu", "khoi phuc", "audit log", "admin"]
      }
    ]
  }
];

export const ALL_ADMIN_MODULES: AdminModuleItem[] = ADMIN_NAV_GROUPS.flatMap(g => g.modules);
