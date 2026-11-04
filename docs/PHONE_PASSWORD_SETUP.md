# Mộc Châu Travel — Đăng nhập SĐT + mật khẩu (không SMS) 

## Luồng khách hàng
- Đăng ký với **họ tên, SĐT, email khôi phục và mật khẩu**. Firebase tạo duy nhất một tài khoản Email/Password và UID.
- Hệ thống gửi liên kết **xác minh email**. Khách quay lại nhấn **Tôi đã xác minh email** để liên kết SĐT làm tên đăng nhập. SĐT **chưa được xác minh quyền sở hữu**, không được dùng làm bằng chứng nhận voucher hoặc đổi mật khẩu.
- Sau khi kích hoạt, khách đăng nhập bằng **SĐT + mật khẩu** hoặc **email + mật khẩu**, cùng một Firebase UID/lịch sử.
- Quên mật khẩu: nhập SĐT đã liên kết hoặc email; hệ thống gửi liên kết đặt lại **qua email đã xác minh**. Không tự tạo mật khẩu `12345678`, không gửi SMS.
- Tài khoản email cũ phải **đăng nhập bằng email một lần** sau khi đã xác minh email để kích hoạt SĐT từ hồ sơ `users/{uid}.phone`. Không tự tạo tài khoản trùng.
- Đăng nhập bằng Google vẫn giữ nguyên; tài khoản Google-only không tự có mật khẩu SĐT.

## Bật tính năng, không cần nâng gói để gửi SMS
1. Firebase Console > Authentication > Sign-in method: bật **Email/Password**; có thể bật Google. Không cần bật Phone/SMS.
2. Firebase Console > Authentication > Settings > Authorized domains: xác nhận tên miền thực tế.
3. Đúng Firebase project trong `firebase-applet-config.json`, đúng **database ID** (có thể là named database).
4. Trên máy chủ Vercel, cấu hình biến môi trường **server-side** `FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON` chứa JSON service account thuộc chính Firebase project đó. Chỉ đặt qua Settings > Environment Variables; KHÔNG tạo biến `VITE_...`, không thêm vào GitHub, không gửi qua chat. Có thể thay bằng Application Default Credentials trong môi trường được quản lý tương ứng.
5. Thiết lập `PHONE_AUTH_RATE_LIMIT_SALT` là chuỗi bí mật ngẫu nhiên dài ở môi trường máy chủ để làm muối hash của bộ giới hạn yêu cầu.
6. Redeploy Preview và thử trên tài khoản khách kiểm thử. API trả `503` nếu máy chủ chưa được cấp quyền — email/password vẫn dùng được.
7. Không tự merge vào `main` hoặc Publish production khi chưa chạy kiểm thử thực tế.

## Kiểm thử bắt buộc
- Đăng ký email + SĐT; nhận email xác minh; không thể dùng SĐT đăng nhập trước khi xác minh.
- Sau khi xác minh, nút kích hoạt số điện thoại thành công; dùng SĐT + mật khẩu và email + mật khẩu đều vào cùng UID.
- Quên mật khẩu bằng SĐT; email đặt lại được gửi tới địa chỉ đã xác minh; đặt mật khẩu mới; lịch sử vé/voucher giữ nguyên.
- Kiểm thử SĐT chưa đăng ký, email sai, mật khẩu sai, yêu cầu quá nhiều lần: không tiết lộ tài khoản có tồn tại.
- SĐT trùng trên tài khoản khác: không được chuyển quyền sở hữu hay thay UID; liên hệ hỗ trợ.
- Người dùng Google-only không thể bị chuyển thành tài khoản SĐT + mật khẩu không có xác minh.
- Admin vẫn nhận quyền qua **server-issued Firebase custom claims**, không qua mật khẩu cố định.
- Kiểm tra `/api/auth/phone/register`, `/api/auth/phone/login`, `/api/auth/phone/reset` chạy từ cùng origin và đọc/ghi named Firestore database.

## Bảo mật & giới hạn
- `phone_login_aliases` và `phone_auth_rate_limits` là collection private chỉ được truy cập bằng Firebase Admin SDK phía máy chủ; không thêm quy tắc `allow read: if true` cho chúng.
- Giới hạn yêu cầu đang lưu trên Firestore; cần giám sát spam và bổ sung CAPTCHA/WAF khi lưu lượng tăng. Không có SMS, nên **không xác minh được quyền sở hữu SĐT**.
- Không đặt lại mật khẩu bằng SĐT đơn thuần; chỉ gửi email tới tài khoản đã xác minh.
- Bản hiện tại không xóa bất kỳ collection nào của hệ thống booking cũ.
- Cần xử lý riêng các `allow read, write: if true` của Firestore rules cũ, vì backend auth không tự sửa lỗ hổng đó.
