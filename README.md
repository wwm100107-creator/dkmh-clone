# Bản Sao 1:1 `dkmh.net/#tool` + `dkmh.net/contact` + `tools1s.com/dkmh*` (REA Reconstructed)

Dự án này là bản sao hoàn chỉnh (1:1 từ giao diện, tài nguyên tĩnh, mã nguồn JavaScript cho tới backend mô phỏng các giao thức API) được tái tạo trực tiếp từ bằng chứng **REA (Reverse Engineer Anything)**.

## Cách Chạy Nhanh

```powershell
cd C:\Users\uypc1\.gemini\antigravity\scratch\dkmh-clone
node server.js
```

Sau đó mở trình duyệt tại:
- **Trang chủ & Danh sách 53 trường (`#tool`)**: `http://localhost:3000/#tool`
- **Trang Liên hệ (`/contact`)**: `http://localhost:3000/contact`
- **Web App Đăng ký môn học Kiểu 1 — Cookie Google & Đăng ký hàng loạt (`/dkmh/`)**: `http://localhost:3000/dkmh/`
- **Web App Đăng ký môn học Kiểu 2 — Tài khoản/Mật khẩu EdusoftWeb/AQTech (`/dkmh-bdu/` và tất cả 52 đường dẫn `/dkmh-*` khác)**: `http://localhost:3000/dkmh-bdu/`

## Các Tính Năng Đã Tái Tạo Đầy Đủ

1. **Giao diện `dkmh.net/#tool` (1:1)**:
   - Đầy đủ CSS gốc (`bootstrap.min.css`, `main.css`, `animate.css`, `LineIcons.2.0.css`, `tiny-slider.css`, `glightbox.min.css`), font `LineIcons.woff2`, hình ảnh logo/icon gốc và các hiệu ứng `WOW.js`, `countUp.js`, `TinySlider`, `GLightbox`, sticky navbar.
   - Thanh chuyển đổi nhanh ở góc dưới bên trái giúp chuyển toàn bộ 53 liên kết trường trong `#tool` giữa **Local Clone (`/dkmh-*`)** và **Live Server (`https://tools1s.com/dkmh-*`)**.
2. **Trang Liên hệ `/contact` + Backend `POST /contact/process.php`**:
   - Xử lý form AJAX và trả về thông báo xác nhận ngay trên giao diện.
3. **Web App `tools1s.com/dkmh/` (`jhgjufu9ds878OJN89J.js`)**:
   - Giữ nguyên cả bản gốc (`dkmh/jhgjufu9ds878OJN89J.js`) lẫn bản đã giải mã RC4 (`dkmh/jhgjufu9ds878OJN89J.deobfuscated.js`).
   - Hỗ trợ mã hóa `EncryptMaLHP()` bằng **AES-128-CBC** (Key & IV: `"1209199012091990"`) ở trình duyệt và giải mã xác thực trực tiếp trong `server.js` (`POST /dkmh/process.php`).
   - Hỗ trợ cả 2 chế độ: **Đăng ký nhanh danh sách mã LHP** (`Type_DKMH = 0`, tự động lặp request vượt lỗi cổng trường) và **Chọn môn học từ bảng** (`Type_DKMH = 1`), kèm chức năng **Xem kết quả đăng ký** (`xem_ket_qua`) và **Hủy học phần** (`HuyLopHocPhanDangKy`).
4. **Web App `tools1s.com/dkmh-bdu/` (`Fun_Login_TK_MK_aahHFUr84989.js`)**:
   - Hỗ trợ đăng nhập MSSV/Mật khẩu qua `POST /dkmh-*/api.php`, hiển thị bảng danh sách nhóm/tổ học phần (`locdsnhomto`) và đăng ký tự động.
5. **Heartbeat Session & IndexedDB Form Persistence (`foot.js`, `function.js`, `alert_right_.js`)**:
   - Đầy đủ cơ chế `foot_session()` (`POST index.php` với khóa `a6a168b2a6af3292bed0cf4bab6c7ef2`), lưu/khôi phục dữ liệu form qua IndexedDB (`saveFormData`/`restoreFormData`), và hệ thống thông báo `[SwalAlert_*]` + `bootstrap-notify`.
