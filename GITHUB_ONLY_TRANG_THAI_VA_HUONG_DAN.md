# QT Limousine — Chuyển dữ liệu sang GitHub (BẢN THỬ NGHIỆM)

**Nguồn:** ZIP `xedimocchau.zip` do chủ website cung cấp ngày 05/11/2026.

**Kết luận quan trọng:** Đây **chưa phải bản đã chuyển toàn bộ website sang GitHub**. Không được đưa lên nhánh `main` hoặc Vercel Production như bản thay thế Firebase. Đã xây dựng API GitHub mã hóa và màn hình thử nghiệm riêng nhưng các màn hình website cũ vẫn dùng Firebase. Việc sử dụng Firebase thật chưa được thay thế, vì điều đó yêu cầu kiểm thử lại toàn bộ luồng.

## 1. Đã làm được trong gói này

- `src/server/githubOnly/githubStore.ts`: đọc, ghi, xóa bản ghi GitHub bằng API, mã hóa AES-256-GCM trước khi commit, khóa chỉ ở biến môi trường máy chủ; khóa không hợp lệ thì từ chối ghi. Có kiểm tra SHA nhằm phát hiện xung đột.
- `src/server/githubOnly/githubAuth.ts`: đăng nhập Admin bằng mật khẩu chỉ lưu trên server; đăng ký hội viên email/mật khẩu với scrypt, cộng 10 điểm một lần; đăng nhập hội viên; xác minh Google ID token ở server (cần cấu hình); phiên đăng nhập bằng cookie ký HMAC, HttpOnly, SameSite.
- `src/server/githubOnly/githubRoutes.ts`: API CRUD trên dữ liệu mã hóa, phân quyền công khai/Admin/khách. Khách báo chuyển cọc **không** tự duyệt vé; Admin duyệt đơn được +1 điểm một lần bằng commit có kiểm tra xung đột.
- `src/components/GithubBackendPreview.tsx`: màn hình thử trực quan để đăng nhập, xem, thêm, sửa, xóa JSON đối với dữ liệu được phép; mở bằng `/?github-preview=1`.
- `src/client/githubApi.ts`: gọi API từ frontend qua cookie, không có token GitHub ở trình duyệt.
- `tests/githubStore.test.mjs`: 5 bài test mã hóa, khóa sai, đường dẫn nguy hiểm, thiếu khóa và thao tác CRUD mô phỏng GitHub API; đã chạy đạt 5/5.
- Giữ **nguyên** giao diện khách hiện hữu, các đường dẫn và Firebase cũ để không xóa hoặc làm mất dữ liệu khách khi chưa chuyển xong.

## 2. Chưa hoàn thành và tuyệt đối không được nói đã hoạt động

- Chưa thay mọi `firebase/auth`, `firebase/firestore`, `firebase/storage`, `firebase-admin` trên website cũ.
- Chưa chuyển khách hàng và đơn đặt vé đang nằm trong Firebase sang GitHub; tuyệt đối chưa xóa Firebase hoặc dữ liệu thật.
- Chưa thay dashboard điều hành/đặt vé/ảnh/banner để dùng GitHub Data API. Màn Preview hiện là giao diện kiểm tra backend, **không phải bản sao đầy đủ website**.
- Chưa triển khai đặt vé tích điểm/voucher từ trình duyệt qua server GitHub. Mọi yêu cầu giảm điểm từ người dùng đang bị chặn an toàn, chưa thể coi là hoàn chỉnh.
- Chưa kiểm thử Google OAuth, đặt vé, thông báo, ghế, trừ voucher, phân quyền, giới hạn GitHub API trong nhiều khách dùng đồng thời với dữ liệu thực.
- Chưa chạy build TypeScript/bundle Vite đầy đủ do không có dependencies tải sẵn; đã kiểm tra cú pháp 94 file TypeScript/TSX (0 lỗi parse).
- Chưa được cấp và không sử dụng token thật GitHub, Firebase, Google hoặc môi trường Vercel Production.

## 3. Cách chạy thử trên Google AI Studio / môi trường phát triển

1. Mở ZIP thành **dự án mới** trong AI Studio. Không ghi đè `main` ngay.
2. Tạo **repository dữ liệu riêng** trên GitHub, khuyến nghị Private để không phát sinh Preview Vercel mỗi khi khách đặt xe. Đây vẫn là GitHub, không phải Firebase.
3. Tạo nhánh dữ liệu `main` (mặc định của repo riêng) với một README.
4. Cấp Fine-grained GitHub PAT quyền **Contents: Read and write** *chỉ cho repository dữ liệu*, lưu trong Vercel Environment Variables, không đưa vào GitHub, không chèn vào frontend.
5. Tạo 2 bí mật ngẫu nhiên: `GITHUB_DATA_ENCRYPTION_KEY` (32 byte base64) và `GITHUB_SESSION_SECRET` (ít nhất 32 ký tự). Thiết lập `GITHUB_ADMIN_PASSWORD` (ít nhất 20 ký tự). Xem `.env.example`.
6. Chạy `npm install`, `npm run lint`, `npm run build`, `npm run test:github-store` (không được bỏ qua lỗi).
7. Mở `/?github-preview=1`, đăng nhập Admin bằng mật khẩu từ biến môi trường; thử thêm/sửa/xóa một bản ghi **dữ liệu giả** trên repository thử. Tải lại và xác nhận dữ liệu vẫn tồn tại.
8. Khi đã kiểm thử backend, mới chuyển dần các màn hình hiện hữu sang API mới, kiểm thử lại bằng tài khoản/thông tin giả trước khi đưa Production.

## 4. Quy trình xe và cọc 50% cần duy trì

- Khách tạo đơn `pending`.
- Khách chuyển khoản ngoài website theo VietQR hiện có.
- Khách bấm “Đã chuyển cọc 50%”, API chỉ ghi `paymentReported=true` khi đúng chủ đơn; không xác nhận đã nhận tiền.
- Admin kiểm tra sao kê và duyệt vé `success`. Nếu có `userId`, server chỉ cộng +1 điểm một lần khi chuyển trạng thái thành công.
- Không tích hợp cổng thanh toán tự động.

## 5. Vì sao không nên commit khách hàng dạng plaintext lên repo Public?

`hquan01/xedimocchau` là repository Public. Người khác có thể tải nội dung và toàn bộ lịch sử commit; chỉ mình bạn có quyền **sửa**, không có nghĩa chỉ mình bạn có quyền **xem**. Bản thử mã hóa trước khi commit, nhưng nếu khóa lộ, lịch sử chứa bản mã cũ cũng có thể bị đọc sau. Giữ khóa server-side và ưu tiên một repository dữ liệu Private.

## 6. Các hạn chế của GitHub làm kho dữ liệu

- Không có truy vấn, index và giao dịch ACID như cơ sở dữ liệu. Liệt kê nhiều bản ghi cần nhiều API calls, có giới hạn tốc độ.
- Nhiều khách ghi cùng lúc có thể tạo xung đột SHA. API từ chối hoặc yêu cầu thử lại, không được âm thầm báo “đã lưu”.
- Xóa bản ghi khỏi phiên bản mới không xóa lịch sử Git; không phù hợp làm nơi duy nhất lưu dữ liệu cá nhân nhạy cảm lâu dài.
- Nếu dùng cùng repository code, mỗi lần ghi dữ liệu có thể kích hoạt Vercel Preview. Repository dữ liệu riêng giúp tránh vòng lặp triển khai.

**Nguyên tắc:** Không triển khai khi chưa chuyển đầy đủ Auth, Quản lý, Đặt vé, điểm/voucher và chưa có kịch bản khôi phục dữ liệu.
