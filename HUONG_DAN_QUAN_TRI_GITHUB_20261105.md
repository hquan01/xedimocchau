# QT Limousine — Bản Quản trị GitHub hoạt động (bản thử nghiệm)

## Mục tiêu

Thay phần **Quản trị thử nghiệm** dùng Firebase bằng bảng điều khiển GitHub trực quan, có nút THÊM/SỬA/XÓA thật. Danh sách 25 mục của menu cũ đã được định tuyến đầy đủ sang các nhóm dữ liệu GitHub. Đây **chưa** phải quá trình chuyển đổi hoàn chỉnh trang khách đặt vé/hội viên hiện hữu; không tự thay thế website Production.

### Cách truy cập bản thử trên Vercel Preview

- `https://<preview-deployment>.vercel.app/quan-tri`
- Hoặc `https://<preview-deployment>.vercel.app/?github-preview=1`
- Đăng nhập bằng mật khẩu Admin đặt trong Vercel Environment Variables. Không dùng Firebase Auth.

### Cấu hình Vercel (bắt buộc)

Đặt các biến dưới đây trong Vercel của project ở **Preview**. Không nhập vào website, Google AI prompt, GitHub commit hoặc tài liệu công khai.

- `GITHUB_DATA_REPO=hquan01/xedimocchau-data` (repository Private đã tạo; chưa có tài khoản khách và đơn đặt vé)
- `GITHUB_DATA_BRANCH=main`
- `GITHUB_DATA_TOKEN`: fine-grained PAT chỉ có quyền Contents Read/Write cho **repo dữ liệu**, không cấp toàn bộ GitHub.
- `GITHUB_DATA_ENCRYPTION_KEY`: base64 của 32 byte ngẫu nhiên; sử dụng một khóa cố định, đừng thay khi chưa có phương án giải mã dữ liệu cũ.
- `GITHUB_SESSION_SECRET`: chuỗi ngẫu nhiên >=32 ký tự; dùng để ký cookie phiên đăng nhập.
- `GITHUB_ADMIN_PASSWORD`: mật khẩu Admin riêng >=20 ký tự; không lưu trong ZIP.
- `GITHUB_ADMIN_EMAIL`: email liên hệ của bạn (không dùng để tự động nâng quyền trong browser).
- Nếu cần đăng nhập hội viên bằng Google, cấu hình `GOOGLE_OAUTH_CLIENT_ID` sau khi cấp quyền domain.

**Lưu ý:** Repo GitHub đã khởi tạo thư mục users/bookings trống; không xóa nội dung bài viết/danh mục đang có ở website cũ. Chỉ nhập dữ liệu mẫu từ ZIP nếu đã kiểm tra chắc chắn nội dung chưa có trên GitHub. Những bài viết chỉ tồn tại ở Firebase cũ chưa được chuyển sang GitHub — cần xuất riêng trước khi ngừng Firebase.

### Các nút đã nối với API thật

- Danh sách 25 mục điều hướng từ menu Admin cũ, có nhiều nhóm con (tổng 30+ đích dữ liệu), được kiểm tra bằng test `tests/githubAdminModules.test.mjs`.
- Thêm / Sửa / Xóa gọi `POST` / `PATCH` / `DELETE` phía máy chủ; báo thành công **chỉ sau** phản hồi HTTP hợp lệ.
- Tải lại: đọc từ repo GitHub, không dùng localStorage làm dữ liệu chính.
- Sao lưu: tải danh sách hiện có về file JSON trên máy người quản trị.
- Có thể nhập mẫu từ các file bài viết, địa điểm, nhà hàng, homestay trong ZIP **chỉ khi danh mục đang rỗng**.
- Duyệt vé: nhắc Admin kiểm tra cọc 50%; server mới chuyển `pending` thành `success` và cộng +1 điểm đúng một lần.
- Hủy, hoàn thành vé: cập nhật trạng thái phía máy chủ; khách không được tự xác nhận tiền.
- Ảnh trong biểu mẫu: chọn file ảnh sẽ tự nén thành dữ liệu hình nhỏ. Đối với banner ảnh lớn, dùng URL HTTPS phù hợp; chưa có chức năng upload bộ sưu tập lớn riêng lên GitHub.
- Thống kê: chỉ hiển thị số đơn/hội viên/doanh thu tính được từ dữ liệu thực đọc được, không giả số liệu.
- Bảo mật: không hiển thị token, mật khẩu khách hay khóa mã hóa trong trình duyệt; thao tác sai quyền bị chặn.

### Những giới hạn chưa được phép coi là hoàn thành

1. Chưa nối các màn khách đặt vé, đăng ký tài khoản, sử dụng voucher ngoài website cũ sang toàn bộ GitHub API; một số trang khách vẫn gọi Firebase.
2. Bảng Quản trị GitHub **khác layout** một số biểu mẫu quản trị chuyên biệt cũ, nhưng giữ đủ tên phân hệ và chức năng CRUD cơ bản; riêng những nghiệp vụ như kho ảnh lớn, thống kê lượt truy cập thực, quản lý thông báo đẩy cần phát triển/kiểm thử tiếp.
3. Chưa kiểm thử trực quan bằng trình duyệt kết nối GitHub thật vì thiếu biến môi trường/token; chưa chạy build đủ do môi trường không tải được npm packages.
4. GitHub không phải cơ sở dữ liệu chuyên dụng; số lượng đơn/khách lớn cần phân trang và xử lý xung đột.
5. Không push thẳng vào main hoặc Production cho tới khi test tất cả nghiệp vụ với dữ liệu GIẢ trên Preview.

### Kiểm thử trước triển khai

`npm install && npm run test:admin && npm run lint && npm run build`

Xem thêm `KIEM_THU_QUAN_TRI_GITHUB.md` để kiểm thử từng phân hệ.
