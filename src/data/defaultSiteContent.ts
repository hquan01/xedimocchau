/* Static content seed isolated from Firebase for the GitHub Admin preview. */
export const defaultSiteContent = {
  siteName:'MỘC CHÂU TRAVEL', tagline:'Cẩm nang & Dịch vụ du lịch Mộc Châu',
  logoUrl:'/mocchau-logo-v4.png',heroImageUrl:'/mocchau-hero-v5.jpg',
  heroTitle:'Khám phá Mộc Châu',heroDescription:'Thiên nhiên Tây Bắc · Mùa hoa · Những trải nghiệm đáng nhớ',
  hotline:'0971050324',zaloUrl:'https://zalo.me/0971050324',messengerUrl:'https://m.me/1277673239073987',
  tiles:[
    {id:'weather',title:'Thời tiết',subtitle:'Mộc Châu hôm nay',icon:'cloud-sun',target:'moc_chau_today',visible:true},
    {id:'planner',title:'Lịch trình AI',subtitle:'Gợi ý cá nhân',icon:'sparkles',target:'ai',visible:true},
    {id:'flower',title:'Mùa hoa',subtitle:'Đẹp theo mùa',icon:'flower',target:'moc_chau_today',visible:true},
    {id:'guide',title:'Cẩm nang',subtitle:'Kinh nghiệm hay',icon:'book-open',target:'guide',visible:true},
    {id:'destinations',title:'Địa điểm',subtitle:'Check-in đáng đi',icon:'map-pin',target:'explore_legacy',visible:true},
    {id:'hot',title:'Bài viết Hot',subtitle:'Đang quan tâm',icon:'flame',target:'hot',visible:true},
    {id:'limousine',title:'QT Limousine',subtitle:'Hà Nội – Mộc Châu',icon:'bus',target:'limousine',visible:true},
    {id:'taxi',title:'Taxi du lịch',subtitle:'4 · 7 · 9 · 16 chỗ',icon:'car',target:'services',visible:true},
    {id:'motorbike',title:'Thuê xe máy',subtitle:'Khám phá tự do',icon:'bike',target:'motorbike',visible:true},
    {id:'stay',title:'Lưu trú',subtitle:'Homestay · Khách sạn',icon:'home',target:'services',visible:true},
    {id:'food',title:'Ăn uống',subtitle:'Đặc sản · Nhà hàng',icon:'utensils',target:'services',visible:true},
    {id:'tour',title:'Giá vé tham quan',subtitle:'Điểm du lịch Mộc Châu',icon:'ticket',target:'ticket-prices',visible:true},
  ],
  // Price ranges are editorial references, not an online ticket-selling service.
  // Reviewed against public ticket pages in November 2026; recheck before travel.
  attractionTickets:[
    {id:'dai-yem',name:'Thác Dải Yếm',adultPrice:'80.000đ',childPrice:'30.000đ (cao 1m–1,3m)',note:'Vé tham quan thác; cầu kính Tình Yêu tính riêng. Trẻ dưới 1m miễn phí theo bảng giá tham khảo.',sourceUrl:'https://mocchaumoc.com/thac-dai-yem-cau-kinh-tinh-yeu/',visible:true},
    {id:'tinh-yeu',name:'Cầu kính Tình Yêu',adultPrice:'100.000đ',childPrice:'50.000đ (theo chiều cao)',note:'Nằm trong khu Thác Dải Yếm; vé riêng, không đồng nghĩa đã gồm vé thác.',sourceUrl:'https://mocchaumoc.com/thac-dai-yem-cau-kinh-tinh-yeu/',visible:true},
    {id:'ban-ang',name:'Rừng thông Bản Áng (Phoenix)',adultPrice:'80.000đ',childPrice:'Miễn phí dưới 1m',note:'Giá tham khảo cho vé tham quan; các dịch vụ trải nghiệm khác có thể thu phí riêng.',sourceUrl:'https://mocchaumoc.com/phoenix-rung-thong-ban-ang/',visible:true},
    {id:'happy-land',name:'Happy Land Mộc Châu',adultPrice:'100.000đ',childPrice:'Kiểm tra theo chiều cao',note:'Gói tham quan cơ bản đang được giới thiệu kèm một số trò chơi; chính sách trẻ em cần xác nhận tại điểm.',sourceUrl:'https://mocchaumoc.com/mua-ve/',visible:true},
    {id:'nang-tien',name:'Thác Nàng Tiên',adultPrice:'30.000đ',childPrice:'Liên hệ điểm tham quan',note:'Giá tham khảo; kiểm tra điều kiện thời tiết và giờ mở cửa trước khi đi.',sourceUrl:'https://mocchaumoc.com/mua-ve/',visible:true},
    {id:'bach-long',name:'Cầu kính Bạch Long – Mộc Châu Island',adultPrice:'650.000đ (Thứ 6–CN và ngày lễ)',childPrice:'350.000đ (cao 1m–1,4m)',note:'Theo bảng giá vé cuối tuần/ngày lễ của đơn vị vận hành; ngày thường và các combo có thể khác.',sourceUrl:'https://mocchauisland.com/en/orderTicket?ticket_type_id=4',visible:true}
  ],
  heroSlides:[
    {id:'flower',imageUrl:'/mocchau-flower-v5.jpg',title:'Mùa hoa Mộc Châu',description:'Tìm mùa hoa và thời điểm ngắm cảnh phù hợp',target:'moc_chau_today',visible:true},
    {id:'tea',imageUrl:'/mocchau-tea-v5.jpg',title:'Những đồi chè xanh',description:'Điểm check-in và kinh nghiệm tham quan',target:'explore_legacy',visible:true},
    {id:'waterfall',imageUrl:'/mocchau-waterfall-v5.jpg',title:'Khám phá Thác Dải Yếm',description:'Địa điểm nổi bật tại Mộc Châu',target:'explore_legacy',visible:true}
  ],
  stories:[
    {id:'flower',title:'Mùa hoa mận Mộc Châu có gì đẹp?',description:'Thời điểm tham khảo, địa điểm ngắm hoa và lưu ý khi check-in.',imageUrl:'/mocchau-flower-v5.jpg',label:'Mùa hoa',target:'moc_chau_today',visible:true},
    {id:'waterfall',title:'Thác Dải Yếm',description:'Một điểm tham quan nổi tiếng tại Mộc Châu.',imageUrl:'/mocchau-waterfall-v5.jpg',label:'Địa điểm',target:'explore_legacy',visible:true},
    {id:'tea',title:'Đồi chè Mộc Châu',description:'Đường đồi chè xanh và góc chụp đáng nhớ.',imageUrl:'/mocchau-tea-v5.jpg',label:'Đáng chú ý',target:'explore_legacy',visible:true},
    {id:'stay',title:'Homestay được quan tâm',description:'Xem danh sách lưu trú và tìm lựa chọn phù hợp.',imageUrl:'/mocchau-stay-v5.jpg',label:'Lưu trú',target:'services',visible:true}
  ]
};
