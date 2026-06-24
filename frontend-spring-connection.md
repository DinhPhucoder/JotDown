# Frontend & Spring Boot Connection Plan

## Overview
Kế hoạch tích hợp Frontend (React/Vite) hiện tại với Backend Spring Boot mới. Hệ thống Frontend trước đây được thiết kế cho Laravel (sử dụng Cookie Sanctum), nay cần cấu hình lại để giao tiếp thông suốt với Spring Boot thông qua JWT (JSON Web Token) và đảm bảo các tính năng Realtime (Pusher), Sync hoạt động trơn tru.

## Project Type
WEB

## Success Criteria
- Frontend Vite (`http://localhost:5173`) gọi API thành công tới Spring Boot (`http://localhost:8080/api`) mà không gặp lỗi CORS.
- Người dùng có thể đăng nhập thành công và JWT Token được lưu/quản lý đúng cách qua `sessionStorage`.
- Không còn bất kỳ request nào gọi tới `/sanctum/csrf-cookie`.
- Realtime Pusher kết nối thành công qua endpoint `/api/broadcasting/auth`.
- Frontend xử lý được đúng cấu trúc JSON trả về từ ExceptionHandler của Spring Boot (đặc biệt là HTTP 422 Validation).

## Tech Stack
- **Frontend**: React 19, Vite, TailwindCSS, Laravel Echo (Pusher)
- **Backend**: Spring Boot 3.4, Java 21, Spring Security (JWT)
- **CORS**: Spring WebMvcConfigurer

## File Structure
Những thay đổi dự kiến sẽ tập trung ở các khu vực:
```text
frontend/
├── .env                  # Cập nhật VITE_API_URL
├── vite.config.js        # Cập nhật proxy (nếu dùng)
├── src/
│   ├── features/auth/    # Kiểm tra/xóa bỏ logic Sanctum CSRF
│   └── services/         # Kiểm tra API Base URL logic
backend-spring/
└── src/main/java/com/jotdown/api/config/
    └── CorsConfig.java   # Mở port 5173 (Vite default)
```

---

## Task Breakdown

### Task 1: Cấu hình Môi trường & CORS
- **Agent**: `backend-specialist` & `frontend-specialist`
- **Skills**: `clean-code`
- **Priority**: P1
- **Dependencies**: None
- **INPUT**: Cấu hình mặc định của Spring Boot và Vite.
- **OUTPUT**: 
  - `backend-spring/src/main/java/com/jotdown/api/config/CorsConfig.java` cho phép `http://localhost:5173`.
  - `frontend/.env` được cấu hình `VITE_API_BASE_URL=http://localhost:8080/api`.
  - `vite.config.js` (frontend) cập nhật proxy sang `http://localhost:8080` (thay vì 8000 của Laravel).
- **VERIFY**: Gọi lệnh `fetch('http://localhost:8080/api/ping')` từ console của trình duyệt trên trang `http://localhost:5173` trả về 200 OK.

### Task 2: Dọn dẹp Laravel Sanctum & Cập nhật API Base
- **Agent**: `frontend-specialist`
- **Skills**: `frontend-design`
- **Priority**: P1
- **Dependencies**: Task 1
- **INPUT**: Code gọi `/sanctum/csrf-cookie` (thường ở `authService.js` hoặc file boot).
- **OUTPUT**: 
  - Đảm bảo đã xóa hoàn toàn bất kỳ hàm nào gọi request lấy CSRF cookie của Sanctum.
  - Các requests đã tự động đính kèm `Authorization: Bearer <token>` từ `sessionStorage`.
- **VERIFY**: Đăng nhập (Login) thành công, tab Network không xuất hiện API `/sanctum/csrf-cookie`.

### Task 3: Xác thực luồng Realtime (Pusher / Laravel Echo)
- **Agent**: `frontend-specialist`
- **Skills**: `clean-code`
- **Priority**: P2
- **Dependencies**: Task 2
- **INPUT**: `frontend/src/services/noteRealtime.js`.
- **OUTPUT**: `noteRealtime.js` kết nối đúng với `http://localhost:8080/api/broadcasting/auth` và gắn Authorization header chứa JWT Token.
- **VERIFY**: Sau khi đăng nhập, Console log `[Realtime] Echo instance created successfully` và không có lỗi 403 ở `/broadcasting/auth`.

### Task 4: Kiểm thử đồng bộ Exception Format (HTTP 422)
- **Agent**: `test-engineer`
- **Skills**: `webapp-testing`
- **Priority**: P3
- **Dependencies**: Task 2
- **INPUT**: Form đăng ký (Register) hoặc Form tạo Note (Create Note).
- **OUTPUT**: Test và đảm bảo thông báo lỗi validation từ Spring (VD: `Email đã tồn tại`) được hiển thị chính xác lên UI, không bị Crash.
- **VERIFY**: Gửi form với thông tin không hợp lệ, UI hiển thị lỗi màu đỏ chính xác bên dưới input.

---

## Phase X: Final Verification
- [x] Chạy `npm run lint` ở frontend không báo lỗi logic.
- [x] Backend Spring Boot khởi chạy không lỗi.
- [x] End-to-end flow: Đăng nhập -> Tạo ghi chú mới -> Sửa ghi chú bằng tab ẩn danh khác -> Cập nhật realtime thành công.

## ✅ PHASE X COMPLETE
- Lint: ✅ Pass
- Security: ✅ No critical issues
- Build: ✅ Success
- Date: 2026-06-23
