# Khôi phục quyền quản trị sau khi chuyển đăng nhập sang Firebase Authentication

Cảnh báo: mã nguồn cũ có đăng nhập quản trị giả trong trình duyệt và mật khẩu cố định. Bản mới đã loại bỏ cách xác thực này vì không an toàn. **Thao tác này không xóa người dùng hoặc đơn hàng trong Firestore**, nhưng người từng đăng nhập chỉ bằng phiên giả sẽ không thể dùng lại mật khẩu đó để vào Admin.

## Dành cho chủ dự án Firebase
1. Mở Firebase Console đúng dự án đã cấu hình trong `firebase-applet-config.json`. Trong Authentication > Users, tìm tài khoản Auth của bạn bằng email hoặc số điện thoại đã xác minh. Đừng tạo tài khoản mới nếu tài khoản của bạn đã tồn tại.
2. Nếu đăng nhập bằng email và quên mật khẩu, sử dụng nút **Quên mật khẩu?** trong ứng dụng. Nếu tài khoản trước đây chỉ là phiên giả trong `localStorage`, cần đăng ký/tạo tài khoản Firebase Auth mới bằng email hoặc số điện thoại thuộc quyền sở hữu của bạn; dữ liệu cũ không tự xóa và không tự gắn với UID mới.
3. Với tài khoản chủ đã **xác minh quyền sở hữu**, sử dụng **Firebase Admin SDK** trong môi trường bảo mật phía server (KHÔNG chạy trong trình duyệt, KHÔNG đưa service-account key lên GitHub) để đặt custom claim: `admin: true` cho UID đó. Nếu muốn giữ claim khác, lấy `customClaims` hiện tại và hợp nhất trước khi cập nhật.
4. Đăng xuất, đăng nhập lại để lấy token mới; vào **Quản lý** kiểm tra quyền. Kiểm tra admin có thể xem đơn dịch vụ, chỉnh nội dung; tài khoản khách không thể truy cập.
5. Trước khi siết `firestore.rules`, sao lưu Firestore thật và kiểm thử Firebase Emulator với tài khoản Admin và khách, đặc biệt các luồng đơn xe cũ. Quy tắc cũ còn `allow read, write: if true` ở nhiều collection; chưa được coi là an toàn.

## Đăng nhập bằng điện thoại
1. Trong Firebase Authentication > Sign-in method, bật **Phone** và **Email/Password** (và Google nếu sử dụng).
2. Cấu hình danh sách tên miền được phép, reCAPTCHA, giới hạn gửi SMS và các điều kiện giá/anti-abuse của nhà cung cấp.
3. Kiểm thử SMS bằng số thử nghiệm của Firebase trên bản preview trước khi sử dụng số thật.
4. **Đăng nhập bằng số điện thoại chưa tự liên kết với tài khoản email cũ.** Với người đã có tài khoản email, hãy đăng nhập bằng email để giữ UID/voucher/đơn hàng. Việc liên kết provider cần triển khai và kiểm thử riêng.

Không có cách an toàn để khôi phục quyền Admin chỉ bằng cách chép lại mật khẩu cố định trước đây vào mã frontend.
