# Mộc Châu Travel — bản nâng cấp thử nghiệm, chưa đủ điều kiện đưa lên production

## Điều đã được cải thiện
- Giao diện Khám phá mobile theo mẫu đã chọn; ảnh hero, logo, 12 ô, bài nổi bật.
- CMS Admin chỉnh logo/banner, mô tả, các ô, bài nổi bật, đường dẫn liên hệ, tải ảnh lên Firebase Storage và xuất bản.
- Gộp liên hệ AI / Zalo / Messenger / gọi điện trong một nút.
- Đăng ký và đăng nhập qua Firebase Authentication (Google, email), không còn mật khẩu quản trị hardcode hay session Admin giả trong giao diện mới.
- Taxi và xe máy gửi yêu cầu trực tiếp tới Firestore `service_requests`, chỉ xác nhận sau khi Firebase ghi thành công.
- Admin `service_orders` đọc và cập nhật trạng thái taxi/xe máy; giữ phần combo cũ.
- Giữ nguyên component đặt vé Limousine, xe ghép và xe nguyên chuyến.

## Bắt buộc trước khi triển khai
1. **Sao lưu Firestore production** và kiểm tra bản chạy mới nhất; không cập nhật thẳng `main` khi có auto-deploy.
2. **Khẩn cấp: firestore.rules hiện vẫn có `allow read, write: if true` với các collection cũ.** Đây là rủi ro lộ/mất dữ liệu. Không triển khai nguyên rules này; phải thiết kế lại truy vấn và quyền theo `request.auth.uid`, kiểm thử Firebase Emulator trước khi chuyển đổi. Không thể đơn giản đổi mọi rule sang `false` vì sẽ làm hỏng đơn xe cũ.
3. **Admin custom claims:** cấp `admin: true` phía server bằng Firebase Admin SDK cho UID thật; không lấy role từ Firestore hoặc số điện thoại. Đăng xuất/đăng nhập lại để làm mới token. Không để Admin SDK key trong GitHub.
4. **Firebase Storage:** áp dụng `storage.rules` cho đường dẫn `site-media/` và thử tải ảnh từ Admin; nếu chưa triển khai sẽ có lỗi permission-denied.
5. **Firestore `service_requests` và `site_content`:** thử quyền tạo từ khách, đọc/đổi trạng thái từ admin, từ chối truy cập của khách khác; cần chống spam bằng backend/App Check/rate limiting trước khi mở công khai.
6. **Vercel/hosting:** xác nhận `/api/weather` và `/api/ai/chat` thực sự chạy; cấu hình `vercel.json` hiện có thể rewrite tới index.html thay vì server Express, nên không được coi AI/thời tiết hoạt động trước khi test.
7. **Voucher:** hệ thống coupon cũ còn cần rà soát chống cấp quyền lợi/điểm từ phía client. Voucher mới không tự phát khi đăng ký; chỉ áp dụng nếu Admin cấu hình, kiểm chứng trên backend.
8. **Kiểm thử runtime:** `npm ci`, `npm run lint`, `npm run build`, smoke test trình duyệt mobile, thử khách tạo đơn và Admin xử lý bằng 2 tài khoản khác nhau; hiện bản này mới kiểm tra cú pháp do thiếu dependency.
9. **Rà soát dữ liệu và giá:** có những card dịch vụ hiện chứa giá tham khảo hardcode; Admin phải xác minh và thay bằng giá thật trước khi quảng bá.
10. **Không xác nhận website hoàn chỉnh/đã triển khai** nếu những mục này chưa hoàn thành.
