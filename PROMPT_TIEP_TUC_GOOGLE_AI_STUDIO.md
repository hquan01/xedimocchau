# PROMPT DÙNG TRONG GOOGLE AI STUDIO — HOÀN TẤT CHUYỂN TỪ FIREBASE SANG GITHUB

Tôi đang nhập ZIP mã nguồn mới nhất của Mộc Châu Travel – QT Limousine. ZIP này đã có một nền tảng thử nghiệm GitHub-only, **chưa chuyển hết giao diện**. Trước hết hãy đọc `GITHUB_ONLY_TRANG_THAI_VA_HUONG_DAN.md` và chạy `npm run test:github-store`.

## Mục tiêu bắt buộc

- Giữ nguyên **toàn bộ giao diện** và chức năng hiện có; mọi màn đặt vé Limousine, xe ghép, combo, xe thuê, hội viên, voucher, nhận yêu cầu, đánh giá, Admin, lái xe, bảng giá, FAQ, mùa hoa, homestay, cộng đồng và nội dung trang chủ phải thực sự hoạt động ở bản thử.
- Mọi dữ liệu được đọc/ghi qua GitHub Data API trên máy chủ, tuyệt đối không để GitHub PAT hoặc khóa giải mã ở frontend.
- GitHub Public không được chứa dữ liệu cá nhân dạng plaintext. Dùng mã hóa máy chủ, và xử lý lịch sử Git theo chính sách dữ liệu; báo rõ giới hạn của GitHub.
- Thay toàn bộ `firebase/auth`, `firebase/firestore`, `firebase/storage`, `firebase-admin` và `src/firebase.ts` theo từng nhóm chức năng. Không xóa dữ liệu Firebase hiện tại; chỉ xóa dependency sau khi toàn bộ chức năng và dữ liệu được chuyển và kiểm thử.
- Giữ **đặt cọc chuyển khoản 50% thủ công**; khách bấm đã cọc chỉ ghi nhận thông báo; **chỉ Admin** mới được duyệt vé và cộng +1 điểm khi đã nhận tiền.
- Khách mới đăng ký +10 điểm đúng 1 lần; voucher và trừ điểm chỉ từ vé thứ hai; mọi thay đổi số dư và quyền Admin cần xác thực trên máy chủ.
- Đảm bảo mọi nút Thêm/Sửa/Xóa báo thành công **chỉ khi commit dữ liệu GitHub hoàn thành**; nếu xung đột/rejected phải hiển thị lỗi, cho thử lại; không tự khôi phục dữ liệu mẫu sau khi xóa hết.
- Bảo vệ thông tin cá nhân; danh sách đơn và người dùng phải giới hạn theo quyền; khách chưa đăng nhập tra cứu đơn bằng quyền truy cập riêng an toàn.
- Đồng bộ giá, lịch chạy, đặt ghế và trạng thái vé; bảo vệ khỏi sửa giá/giảm giá trực tiếp trên trình duyệt. Triển khai phương án kiểm soát đồng thời cho đặt vé/điểm thưởng; nếu GitHub không đủ bảo đảm thì nêu rõ thay vì báo đã xong.

## Quy trình bắt buộc

1. Làm việc trên nhánh GitHub thử nghiệm. Không đụng nhánh `main` và không deploy Production khi chưa duyệt.
2. Kiểm tra repo GitHub mới nhất và hợp nhất thay đổi cẩn thận; ZIP người dùng có thể khác phiên bản GitHub.
3. Dùng **Firebase Emulator hoặc dữ liệu giả** để xuất/đối chiếu dữ liệu cũ; khi chuyển sang GitHub chỉ dùng GitHub API, không tải dữ liệu cá nhân thật lên repo Public dưới dạng có thể đọc được.
4. Chạy TypeScript, build, unit, integration và E2E: đăng nhập email/Google, đăng ký +10, thử thêm/sửa/xóa sau refresh, đặt vé, báo cọc, Admin duyệt, +1 điểm đúng 1 lần, voucher lần 2, hủy đơn/hoàn điểm, phân quyền người ngoài.
5. Cho tôi URL bản Preview **hoạt động đầy đủ** có giao diện giống website; tách biệt dữ liệu thử, không để thao tác ở Preview tác động tới đơn khách thật.
6. Ghi số ca test đạt/thất bại, log lỗi còn lại, commit/nhánh, và yêu cầu tôi duyệt trước khi gộp vào `main`.

**Tuyệt đối không tuyên bố đã loại bỏ Firebase hay đã kiểm thử toàn bộ website nếu vẫn còn lời gọi Firebase hoặc thiếu E2E.**
