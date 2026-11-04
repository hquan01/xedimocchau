import { useEffect } from 'react';

export function useSEO(activeTab: string) {
  useEffect(() => {
    let title = "Mộc Châu Travel | QT Limousine Hà Nội – Mộc Châu";
    let description = "Đặt xe QT Limousine Hà Nội – Mộc Châu, xem giờ chạy, giá vé và chọn ghế. Khám phá điểm tham quan, thời tiết, ẩm thực và cẩm nang du lịch Mộc Châu.";
    
    switch (activeTab) {
      case 'limousine':
        title = "Đặt Xe QT Limousine Hà Nội – Mộc Châu | Mộc Châu Travel";
        description = "Xem lịch xe QT Limousine Hà Nội – Mộc Châu, chọn tuyến, ngày đi, giờ xuất phát và số ghế trên website Mộc Châu Travel.";
        break;
      case 'combo':
        title = "Combo Xe Limousine & Lưu Trú Mộc Châu | Mộc Châu Travel";
        description = "Tham khảo combo xe QT Limousine kết hợp khách sạn, homestay và dịch vụ du lịch Mộc Châu. Chi phí tùy lịch đi và lựa chọn cụ thể.";
        break;
      case 'shared':
        title = "Xe Ghép SUV 7 Chỗ Hà Nội ➔ Mộc Châu Đón Trả Tận Nhà";
        description = "Tìm chuyến xe ghép Hà Nội – Mộc Châu, xem khung giờ, chỗ trống và mức giá được công bố khi chọn lịch trình.";
        break;
      case 'private':
        title = "Thuê Xe Riêng Hợp Đồng 4 - 7 - 16 Chỗ Đi Mộc Châu Trọn Gói";
        description = "Cho thuê xe du lịch riêng đời mới có tài xế đưa đón trọn gói tuyến Hà Nội - Mộc Châu. Phục vụ gia đình, đoàn thể, tour riêng tư.";
        break;
      case 'guide':
        title = "Cẩm Nang Du Lịch Mộc Châu Tự Túc • Kinh Nghiệm & Mùa Hoa Mận";
        description = "Tổng hợp kinh nghiệm du lịch Mộc Châu từ A-Z: thời điểm đẹp nhất săn mây, mùa hoa mận trắng, các địa điểm check-in hot và đặc sản ẩm thực.";
        break;
      case 'explore':
        title = "Mộc Châu Travel | QT Limousine Hà Nội – Mộc Châu";
        description = "Đặt xe QT Limousine Hà Nội – Mộc Châu, xem giờ chạy, giá vé và chọn ghế. Khám phá điểm tham quan, thời tiết, ẩm thực và cẩm nang du lịch Mộc Châu.";
        break;
      case 'dashboard':
        title = "Trang Cá Nhân & Quản Lý Đặt Vé Của Tôi | Xe Đi Mộc Châu";
        description = "Quản lý lịch sử đặt vé xe Limousine, theo dõi điểm thưởng tích lũy, đổi mã giảm giá coupon và cập nhật ưu đãi độc quyền.";
        break;
      case 'operator':
        title = "Hệ Thống Điều Hành Nhà Xe & Phân Công Lái Xe Mộc Châu";
        description = "Trang quản trị điều hành chuyến xe, sắp xếp tài xế, quản lý sơ đồ ghế, khóa chuyến offline và thống kê doanh thu.";
        break;
      case 'community':
        title = "Trung Tâm Cộng Đồng Du Lịch Mộc Châu • Nhóm Zalo & Hỏi Đáp";
        description = "Mạng lưới các nhóm Zalo du lịch Mộc Châu chính thức: Hỏi đáp, săn mây, cập nhật thời tiết mùa hoa mận, homestay và đặt xe QT Limousine.";
        break;
      case 'trip_prep':
        title = "Chuẩn Bị Chuyến Đi Mộc Châu • Kế Hoạch, Chi Phí & Homestay";
        description = "Lập kế hoạch du lịch Mộc Châu chi tiết: Dự toán chi phí, AI tạo lịch trình, gợi ý homestay và xe Limousine đón tận nơi.";
        break;
      case 'explore_around':
        title = "Khám Phá Quanh Tôi Tại Mộc Châu • Bản Đồ & Địa Điểm Thực Tế";
        description = "Định vị GPS tìm điểm tham quan, nhà hàng ẩm thực bản địa và dịch vụ di chuyển gần bạn nhất tại cao nguyên Mộc Châu.";
        break;
      case 'moc_chau_today':
        title = "Thời Tiết Mộc Châu & Lịch Mùa Hoa | Mộc Châu Travel";
        description = "Xem dự báo thời tiết Mộc Châu từ nguồn khí tượng trực tuyến và tham khảo các mùa hoa, điểm tham quan theo thời điểm.";
        break;
      default:
        break;
    }

    document.title = title;
    
    // Update meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', description);
    }

    // Social previews remain fixed to the homepage metadata from index.html.
    // React route tabs share the same URL, and link-preview crawlers usually do
    // not run JavaScript; changing og:* dynamically makes shared cards unstable.
  }, [activeTab]);
}
