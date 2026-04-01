# Kế hoạch Đóng gói Docker (4 Containers)

Đóng gói kiến trúc ứng dụng với hệ thống 4 containers: Nginx, Frontend (React/Vite), Backend (Laravel FPM) và Database (MySQL).

## Socratic Gate (Cần xác nhận trước khi tiếp tục)

> [!WARNING]
> 1. **Frontend**: Để chuyển đổi dễ dàng giữa Dev (hot-reload) và Thu hoạch (multi-stage build static), tôi sẽ tạo 2 file cấu hình tách biệt: `docker-compose.yml` (Dev) và `docker-compose.prod.yml` (Nộp bài), bạn thấy phù hợp không?
> 2. **Nginx Routing**: Mọi request bắt đầu bằng `/api` sẽ được Nginx forward sang Backend (FPM) qua cổng 9000. Các request còn lại sẽ điều phối cho Frontend. Định tuyến mặc định này có đúng thiết kế API của bạn chưa?
> 3. **Database Volume**: Dữ liệu DB sẽ được mount ra thư mục cục bộ (ví dụ: `./docker/mysql`) để đảm bảo sinh viên tự test không bị mất dữ liệu giữa các lần chạy?

## Phân rã Công việc (Task Breakdown)

### 1. Cấu trúc hạ tầng
```text
/
├── backend/
│   └── Dockerfile          (PHP-FPM, Composer, PDO)
├── frontend/
│   ├── Dockerfile          (NPM, Dev mode port 5173)
│   └── Dockerfile.prod     (Multi-stage: Node build -> Nginx static HTML)
├── nginx/
│   └── default.conf        (Reverse proxy cấu hình cho dev)
│   └── default.prod.conf   (Reverse proxy cấu hình cho production)
├── docker-compose.yml      (Chạy backend, frontend dev, proxy nginx dev, db)
├── docker-compose.prod.yml (Chạy backend, proxy nginx production, db)
└── Readme.txt              
```

### 2. Cấu hình Nginx (Gateway)
- **[NEW]** `nginx/default.conf` (Dev):
  - `location /`: Proxy_pass tới container `frontend:5173`.
  - `location /api` (và `/sanctum/csrf-cookie` nếu auth): `fastcgi_pass backend:9000`.

### 3. Cấu hình Backend (Laravel FPM)
- **[NEW]** `backend/Dockerfile`: Dùng `php:8.2-fpm` base, kết nối chung mạng nội bộ và cấp quyền cho Nginx đọc thư mục.

### 4. Cấu hình Frontend (ReactJS/Vite)
- **[NEW]** `frontend/Dockerfile` (Dev): Chạy `npm run dev -- --host`. Cập nhật HMR server socket cho chuẩn trên Vite.
- **[NEW]** `frontend/Dockerfile.prod`: Build ra thư mục `dist`. Image lúc chạy sẽ gộp với Nginx để phục vụ file HTML.

### 5. Cấu hình MySQL
- Sử dụng Image tĩnh `mysql:8.0`.

## Verification Plan (Nghiệm thu)
- **Hỗ trợ Dev**: Chạy `docker-compose up` mã nguồn React tự cập nhật liên tục mà không cần rebuild container.
- **Hỗ trợ Nộp bài**: Chạy lệnh `docker-compose -f docker-compose.prod.yml up` hoạt động mượt mà không delay hot-reload.
- **Tài liệu hoàn thiện**: Xây dựng `Readme.txt` theo format của GV yêu cầu.
