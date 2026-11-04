# Khôi phục quyền quản trị sau khi chuyển đăng nhập sang Firebase Authentication

Cảnh báo: mã nguồn cũ có đăng nhập quản trị giả trong trình duyệt và mật khẩu cố định. Bản mới đã loại bỏ cách xác thực này vì không an toàn. **Thao tác này không xóa người dùng hoặc đơn hàng trong Firestore**, nhưng người từng đăng nhập chỉ bằng phiên giả sẽ không thể dùng lại mật khẩu đó để vào Admin.

## Dành cho chủ dự án Firebase
1. Mở Firebase Console đúng dự án đã cấu hình trong `firebase-applet-config.json`. Trong Authentication > Users, tìm tài khoản Auth của bạn bằng email hoặc số điện thoại đã xác minh. Đừng tạo tài khoản mới nếu tài khoản của bạn đã tồn tại.
2. Nếu đăng nhập bằng email và quên mật khẩu, sử dụng nút **Quên mật khẩu?** trong ứng dụng. Nếu tài khoản trước đây chỉ là phiên giả trong `localStorage`, cần đăng ký/tạo tài khoản Firebase Auth mới bằng email hoặc số điện thoại thuộc quyền sở hữu của bạn; dữ liệu cũ không tự xóa và không tự gắn với UID mới.
3. Với tài khoản chủ đã **xác minh quyền sở hữu**, sử dụng **Firebase Admin SDK** trong môi trường bảo mật phía server (KHÔNG chạy trong trình duyệt, KHÔNG đưa service-account key lên GitHub) để đặt custom claim: `admin: true` cho UID đó. Nếu muốn giữ claim khác, lấy `customClaims` hiện tại và hợp nhất trước khi cập nhật.
4. Đăng xuất, đăng nhập lại để lấy token mới; vào **Quản lý** kiểm tra quyền. Kiểm tra admin có thể xem đơn dịch vụ, chỉnh nội dung; tài khoản khách không thể truy cập.
5. Trước khi siết `firestore.rules`, sao lưu Firestore thật và kiểm thử Firebase Emulator với tài khoản Admin và khách, đặc biệt các luồng đơn xe cũ. Quy tắc cũ còn `allow read, write: if true` ở nhiều collection; chưa được coi là an toàn.

## Đăng nhập SĐT không SMS ở giai đoạn đầu
1. Mộc Châu Travel dùng **email/mật khẩu thật của Firebase** và cho phép SĐT làm tên đăng nhập sau khi email khôi phục được xác minh.
2. Không bật Phone Authentication hoặc chi phí SMS ở giai đoạn này. Cần cấu hình Firebase Admin SDK **chỉ trên máy chủ** để ánh xạ SĐT với đúng UID và xác minh mật khẩu an toàn.
3. Khách quên mật khẩu nhập SĐT đã liên kết; hệ thống gửi **email đặt lại mật khẩu**, không tạo mật khẩu mặc định.
4. Xem hướng dẫn đầy đủ tại `docs/PHONE_PASSWORD_SETUP.md`.

**Riêng tài khoản Admin cũ:** SĐT và mật khẩu mặc định từng nằm trong mã nguồn frontend không phải một tài khoản Firebase Auth thật. Cần dùng chủ dự án Firebase xác minh danh tính, đăng ký/khôi phục tài khoản thật và cấp custom claim `admin: true`. Tuyệt đối không đưa lại mật khẩu cũ vào frontend.

Không có cách an toàn để khôi phục quyền Admin chỉ bằng cách chép lại mật khẩu cố định trước đây vào mã frontend.
