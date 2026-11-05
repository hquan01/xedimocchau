# Bản vá QT Limousine — dành cho Google AI Studio

**Nguồn:** file ZIP "xe-đi-mộc-châu (4).zip" người dùng cung cấp ngày 05/11/2026.

**CẢNH BÁO:** Bản vá được sửa dựa trên ZIP cũ, KHÔNG phải toàn bộ GitHub main mới nhất. Đây là nhánh REVIEW riêng, không merge, không triển khai Production. Những sửa đổi chưa qua `npm run build`, Firebase Emulator hoặc thử dữ liệu thật.

## Tệp kèm theo
- `QT_Limousine_ban_va_cho_du_an_hien_tai.zip`: 24 tệp mã nguồn mới/sửa và 3 tệp hướng dẫn, đúng bản ZIP đã chuẩn bị trong cuộc trò chuyện.
- `GOOGLE_AI_FIX.patch`: bản diff so với ZIP gốc, đọc được bằng trình soạn thảo; **không áp dụng mù quáng** lên main vì source khác phiên bản.

## Cách mở bằng Google AI Studio
1. Mở dự án GitHub `hquan01/xedimocchau` và nhánh `review/google-ai-repairs-20261105` nếu Google AI Studio hỗ trợ chọn nhánh.
2. Đọc file README này, `GOOGLE_AI_FIX.patch` và ZIP trong thư mục này.
3. Yêu cầu AI **so sánh từng thay đổi với code mới nhất của main**, chỉ tích hợp sửa lỗi chưa có; không xóa tính năng mới từ GitHub.
4. Ưu tiên: lỗi đăng nhập Admin; quyền đọc/ghi Firebase; thêm/sửa/xóa trong Quản lý; không tự tạo lại dữ liệu mẫu; không báo thành công khi lưu thất bại.
5. Giữ quy trình: khách chuyển khoản cọc 50% bằng VietQR → báo đã chuyển → nhà xe kiểm tra tiền → **chỉ Admin xác nhận vé**. Không dùng cổng thanh toán tự động.
6. Chạy `npm ci`, `npm run build`, `npm run lint`, Firebase Emulator, kiểm thử đăng nhập/CRUD với dữ liệu thử. **Không triển khai `firestore.rules` trước khi kiểm thử.**
7. Sau kiểm thử, đưa thay đổi đã hợp nhất vào nhánh mới để review; chỉ merge main khi đảm bảo không mất dữ liệu và không gây lỗi Production.

**Prompt dùng cho Google AI Studio:**
> Hãy đọc tệp `imports/qt-limousine-fix-20261105/GOOGLE_AI_FIX.patch`, ZIP đi kèm và README này. So sánh với nhánh main mới nhất. Hợp nhất các sửa lỗi đăng nhập và CRUD, giữ mọi tính năng mới, sửa thêm các mâu thuẫn Firebase Rules. Giữ cọc 50% thủ công và quyền duyệt vé chỉ của Admin. Đừng ghi đè nguyên các tệp ZIP lên main. Hãy báo cáo test build, Firebase emulator và diff trước khi merge.

**Trạng thái:** Nhánh chỉ chứa bộ bản vá và hướng dẫn ở thư mục `imports/qt-limousine-fix-20261105`. Các file nguồn tại `src/` của nhánh này vẫn giống main ở thời điểm tạo nhánh; chưa áp dụng bản vá vào app đang chạy.
