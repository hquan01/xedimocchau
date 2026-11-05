# Checklist kiểm thử quản trị GitHub — QT Limousine

1. Mở `/quan-tri`, không đăng nhập thấy form Admin. Mật khẩu sai trả lỗi; đúng vào Dashboard.
2. Khi GitHub token sai/hết hạn, trạng thái kết nối báo lỗi; không có thông báo lưu thành công giả.
3. Với từng mục menu Quản trị: nhấn tên mục → nội dung phù hợp xuất hiện; đổi mục con; Tải lại. Không có nút điều hướng vô dụng.
4. Dữ liệu nội dung: tạo thử một địa điểm tên `TEST-ONLY`, lưu → tải lại vẫn có → sửa tên → tải lại vẫn đúng → xóa → tải lại không còn.
5. Bài viết / cẩm nang, homestay / combo, nhà hàng / cafe, mùa hoa, giá / lịch xe, tài xế, taxi, xe máy, Zalo, FAQ, voucher: thực hiện thêm/sửa/xóa với bản ghi thử; so sánh dữ liệu repo Private.
6. Cấu hình có ID cố định: khi đã tồn tại không được tạo thêm cấu hình trùng; chỉ Sửa và Lưu.
7. Khách hàng: đăng ký một tài khoản hội viên MỚI từ form đăng ký GitHub; xem ở Admin; không cho chỉnh role/password trên form thông thường.
8. Đơn đặt vé: tạo một đơn giả vào backend; bấm Duyệt trước khi kiểm tra cọc phải xuất hiện câu hỏi xác nhận; sau khi xác nhận vé mới đổi `success`, tài khoản đúng được cộng +1 và không cộng lần hai.
9. Khách nhấn báo chuyển khoản không được tự duyệt vé. Mọi đơn giả không được chứa số điện thoại khách thật.
10. Xóa bản ghi không tồn tại trên GitHub phải báo lỗi, không báo thành công.
11. Nút Sao lưu tạo JSON đọc được; file không có `passwordHash`, `guestHash` hoặc token.
12. Khi không có mục trong GitHub, hệ thống phải báo danh mục rỗng và không tự khôi phục bài cũ. Chỉ nhập mẫu từ ZIP khi được Admin chủ động xác nhận.
13. Trên điện thoại 375px, sidebar mở/đóng, danh sách và form sửa/xóa hoạt động, không tràn ngang.
14. Kiểm tra GitHub Rate Limit với hơn 50 bản ghi; không để API Vercel timeout.
15. Sau khi pass tất cả, mới quyết định hợp nhất main; không dùng repo dữ liệu Production để test xóa.

**Trạng thái kiểm thử tại thời điểm tạo tài liệu:** 8/8 bài test tự động cho registry/crypto/CRUD giả lập đạt; chưa kiểm thử Vercel/Firebase/Google OAuth/Chrome UI với tài khoản thật.
