import { useEffect } from 'react';

export function useSEO(activeTab: string) {
  useEffect(() => {
    let title = "Xe Đi Mộc Châu | Đặt Vé Limousine VIP & Combo Du Lịch Giá Tốt";
    let description = "Dịch vụ đặt vé xe Limousine VIP Hà Nội - Mộc Châu đón trả tận nhà. Hệ thống đặt Combo du lịch phòng + xe tiết kiệm 20%, xe ghép 7 chỗ và thuê xe máy chuyên nghiệp.";
    
    switch (activeTab) {
      case 'limousine':
        title = "Đặt Vé Xe Limousine VIP Hà Nội ➔ Mộc Châu | Giữ Chỗ 100%";
        description = "Đặt trực tuyến xe Limousine VIP thương gia 9 chỗ tuyến Hà Nội đi Mộc Châu. Đón trả tận nhà, giữ chỗ chính xác 100%, không phụ thu vô lý.";
        break;
      case 'combo':
        title = "Siêu Combo Xe Limousine + Khách Sạn Mộc Châu Giảm 20%";
        description = "Trọn gói Combo xe Limousine khứ hồi kèm phòng khách sạn/Bunggalow cao cấp tại Mộc Châu. Tiết kiệm đến 20%, hỗ trợ hủy đổi linh hoạt.";
        break;
      case 'shared':
        title = "Xe Ghép SUV 7 Chỗ Hà Nội ➔ Mộc Châu Đón Trả Tận Nhà";
        description = "Dịch vụ xe ghép SUV 7 chỗ (Innova, Xpander) nhanh chóng, tiện lợi, giá rẻ chỉ từ 350.000đ/ghế. Đón tận cổng nhà tại Hà Nội.";
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
        title = "Khám Phá Các Địa Điểm Check-in Đẹp Nhất Mộc Châu";
        description = "Khám phá danh sách các điểm đến tuyệt đẹp tại cao nguyên Mộc Châu: Đồi chè trái tim, Thác Dải Yếm, Rừng thông Bản Áng, Thung lũng mận Nà Ka.";
        break;
      case 'dashboard':
        title = "Trang Cá Nhân & Quản Lý Đặt Vé Của Tôi | Xe Đi Mộc Châu";
        description = "Quản lý lịch sử đặt vé xe Limousine, theo dõi điểm thưởng tích lũy, đổi mã giảm giá coupon và cập nhật ưu đãi độc quyền.";
        break;
      case 'operator':
        title = "Hệ Thống Điều Hành Nhà Xe & Phân Công Lái Xe Mộc Châu";
        description = "Trang quản trị điều hành chuyến xe, sắp xếp tài xế, quản lý sơ đồ ghế, khóa chuyến offline và thống kê doanh thu.";
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

    // Update OpenGraph tags
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', title);

    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', description);

    let twitterTitle = document.querySelector('meta[property="twitter:title"]');
    if (twitterTitle) twitterTitle.setAttribute('content', title);

    let twitterDesc = document.querySelector('meta[property="twitter:description"]');
    if (twitterDesc) twitterDesc.setAttribute('content', description);

  }, [activeTab]);
}
