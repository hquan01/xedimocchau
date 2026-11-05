/** GitHub-only admin module registry. Every legacy menu item has an actual data/action target. */
export interface GitHubAdminSection {
  collection: string;
  title: string;
  configId?: string;
  readOnly?: boolean;
}
export const GITHUB_ADMIN_MODULES: Record<string, GitHubAdminSection[]> = {
  overview: [],
  limousine_bookings: [{collection:'bookings',title:'Đơn đặt vé'}],
  limousine_seatlock: [{collection:'blocked_seats',title:'Ghế đang giữ / khóa'}],
  limousine_schedules: [{collection:'configs',title:'Lịch Limousine',configId:'limousineConfig'}, {collection:'configs',title:'Lịch xe ghép',configId:'sharedCarConfig'}],
  limousine_pricing: [{collection:'configs',title:'Giá Limousine',configId:'limousineConfig'}, {collection:'configs',title:'Giá xe ghép',configId:'sharedCarConfig'}],
  limousine_drivers: [{collection:'drivers',title:'Lái xe / Phương tiện'}],
  limousine_locations: [{collection:'configs',title:'Điểm đón / trả',configId:'locations'}],
  limousine_customers: [{collection:'users',title:'Hội viên (đăng ký qua website)'}],
  limousine_coupons: [{collection:'coupons',title:'Mã giảm giá'}],
  taxi_tourist_cars: [{collection:'taxi_fleet',title:'Danh sách xe taxi'}, {collection:'taxi_requests',title:'Yêu cầu taxi'}],
  motorbike_rental: [{collection:'motorbike_fleet',title:'Danh sách xe máy'}, {collection:'motorbike_requests',title:'Yêu cầu thuê xe'}],
  service_orders: [{collection:'service_requests',title:'Đơn dịch vụ'}, {collection:'taxi_requests',title:'Yêu cầu taxi'}, {collection:'motorbike_requests',title:'Yêu cầu xe máy'}],
  destinations: [{collection:'destinations',title:'Địa điểm tham quan'}],
  accommodations_combos: [{collection:'accommodations',title:'Lưu trú'}, {collection:'tour_combos',title:'Combo xe + phòng'}],
  restaurants_culinary: [{collection:'restaurants',title:'Nhà hàng / Cà phê'}],
  flower_seasons: [{collection:'flower_seasons',title:'Mùa hoa'}],
  site_appearance: [{collection:'site_content',title:'Nội dung trang chủ',configId:'public'}],
  articles_guide: [{collection:'guide_articles',title:'Bài viết / Cẩm nang'}],
  community_zalo: [{collection:'zalo_groups',title:'Nhóm Zalo'}, {collection:'community_posts',title:'Bài hỏi đáp'}],
  customer_reviews: [{collection:'reviews',title:'Đánh giá'}],
  ai_assistant: [{collection:'ai_faqs',title:'Kho câu hỏi AI'}, {collection:'configs',title:'Cấu hình AI',configId:'aiConfig'}],
  live_weather: [{collection:'configs',title:'Cấu hình thời tiết',configId:'weatherConfig'}],
  partner_network: [{collection:'partners',title:'Đối tác'}],
  commissions_debt: [{collection:'commissions',title:'Hoa hồng'}, {collection:'debts',title:'Công nợ'}],
  growth_analytics: [],
  security_config: [{collection:'security_audit',title:'Nhật ký thao tác',readOnly:true}],
};
export const PUBLIC_CMS_COLLECTIONS = new Set(['tour_combos','accommodations','guide_articles','destinations','restaurants','flower_seasons','partners','taxi_fleet','motorbike_fleet','ai_faqs','zalo_groups','site_content','reviews']);
export const SENSITIVE_COLLECTIONS = new Set(['bookings','users','service_requests','taxi_requests','motorbike_requests','commissions','debts','notifications','security_audit']);
export const FIXED_LABELS: Record<string,string> = {
  name:'Tên', title:'Tiêu đề', description:'Mô tả', excerpt:'Tóm tắt', content:'Nội dung',
  category:'Danh mục', categoryLabel:'Tên danh mục', imageUrl:'Đường dẫn ảnh', images:'Danh sách ảnh',
  phone:'Số điện thoại', email:'Email', address:'Địa chỉ', visible:'Hiển thị', isHot:'Bài nổi bật',
  price:'Giá', priceFrom:'Giá từ', pricePerDay:'Giá / ngày', adultPrice:'Giá vé người lớn',
  childPrice:'Giá vé trẻ em', status:'Trạng thái', passengerName:'Hành khách',passengerPhone:'SĐT khách',
  travelDate:'Ngày đi', departureTime:'Giờ đi',routeSelection:'Tuyến',pickupPoint:'Điểm đón',dropoffPoint:'Điểm trả',
  seatCount:'Số ghế',totalPrice:'Tổng tiền',depositAmount:'Tiền cọc đã nhận',paymentReported:'Khách báo đã cọc',
  operatorNotes:'Ghi chú điều hành',driverName:'Lái xe', createdAt:'Ngày tạo', points:'Điểm hội viên',
  discountPercentage:'Mức giảm (%)',code:'Mã voucher',expiresAt:'Hạn dùng',moderationStatus:'Duyệt nội dung',
  isRead:'Đã đọc',link:'Liên kết',url:'URL',location:'Vị trí', order:'Thứ tự',note:'Ghi chú'
};
export const RECOMMENDED_FIELDS: Record<string,string[]> = {
  bookings:['passengerName','passengerPhone','type','travelDate','departureTime','routeSelection','pickupPoint','dropoffPoint','seatCount','totalPrice','depositAmount','operatorNotes'],
  users:['name','email','phone','points','createdAt'],
  tour_combos:['name','description','price','imageUrl','visible'],
  accommodations:['name','description','address','price','imageUrl','visible'],
  guide_articles:['title','excerpt','content','category','imageUrl','visible'],
  destinations:['name','description','address','adultPrice','imageUrl','visible'],
  restaurants:['name','description','address','phone','imageUrl','visible'],
  flower_seasons:['name','description','startMonth','endMonth','imageUrl','visible'],
  partners:['name','phone','address','description','visible'],
  taxi_fleet:['name','type','seatCount','price','available','imageUrl'],
  motorbike_fleet:['name','type','pricePerDay','available','imageUrl'],
  ai_faqs:['question','answer','category','visible'],
  zalo_groups:['name','description','url','visible'],
  community_posts:['title','content','moderationStatus'],
  reviews:['name','content','rating','moderationStatus'],
  coupons:['code','description','discountPercentage','expiresAt','active'],
  drivers:['name','phone','licensePlate','status','note'],
  blocked_seats:['travelDate','tripId','seatId','note'],
  service_requests:['customerName','customerPhone','kind','status','quotedPrice','notes'],
  taxi_requests:['customerName','customerPhone','status','quotedPrice','notes'],
  motorbike_requests:['customerName','customerPhone','status','quotedPrice','notes'],
  commissions:['partnerId','bookingId','amount','status','dueDate','notes'],
  debts:['partnerId','amount','status','dueDate','notes'],
};
