# NOTE MANAGEMENT - HƯỚNG DẪN VẬN HÀNH DỰ ÁN

Tài liệu này cung cấp hướng dẫn chi tiết để thiết lập môi trường phát triển (Local) 
và các lưu ý quan trọng khi phát triển, deploy hệ thống.

---

## I. CÔNG NGHỆ SỬ DỤNG (TECH STACK)
**Frontend:** ReactJS (Vite), Bootstrap 5, FontAwesome.
**Backend:** Laravel 11.
**Database:** MySQL 8.0.
**DevOps:** Docker, Docker Compose.

---

## II. HƯỚNG DẪN KHỞI ĐỘNG DỰ ÁN Ở LOCAL

### Bước 1: Thiết lập biến môi trường (Environment)
1.  Vào thư mục `backend/`, copy file `.env.example` thành `.env`.
2.  Kiểm tra các thông số Database trong `.env` để khớp với `docker-compose.yml` 
    (mặc định đã được cấu hình sẵn).

### Bước 2: Khởi động hệ thống với Docker
Mở terminal tại thư mục gốc của dự án và chạy lệnh:
```bash
docker compose up --build -d
```

### Bước 3: Đợi hệ thống tự động thiết lập (Initialization)
Dự án đã được cấu hình để tự động cài đặt thư viện, tạo App Key và chạy Migration ngay khi container khởi động. 

**Lưu ý:** Ở lần đầu tiên, quá trình này mất khoảng 1-2 phút tùy tốc độ mạng. Bạn có thể theo dõi tiến trình bằng lệnh:
```bash
docker compose logs -f backend
```
Khi thấy log thông báo hoàn tất các bước (Composer, Key, Migrate), hệ thống đã sẵn sàng.

### Bước 4: Truy cập ứng dụng
*   **Giao diện người dùng (Frontend):** [http://localhost](http://localhost)
*   **Cổng API (Nginx Gateway):** [http://localhost/api](http://localhost/api)
*   **Mailpit (Kiểm tra Email local):** [http://localhost:8025](http://localhost:8025)

---

## III. NHỮNG LƯU Ý QUAN TRỌNG

### 1. Quản lý Database (Migration)
*   **TUYỆT ĐỐI KHÔNG** chỉnh sửa trực tiếp cấu trúc DB trong MySQL.
*   Mọi thay đổi cấu trúc table phải được thực hiện thông qua **Laravel Migration**.
    ```bash
    docker compose exec backend php artisan make:migration [tên_thành_phần]
    ```
*   Khi có code mới từ team, hãy chạy lại migration: `php artisan migrate`.

### 2. Biến môi trường & Bảo mật
*   **Không bao giờ** commit file `.env` lên Git.
*   Khi thêm biến environment mới, hãy cập nhật vào `.env.example` để Team Member khác biết.
*   Các secret key trên Production (Render/Vercel) phải được cấu hình trong tab **Environment Variables** của Platform.

### 3. Lưu ý khi Deploy
*   **Backend (Render):** Sử dụng file `render.yaml`. Migration production được chạy tự động qua `preDeployCommand`.
*   **Frontend (Vercel):** Đảm bảo `VITE_API_BASE_URL` trên Vercel trỏ đúng về URL Backend của Render.
*   **Database (Aiven):** Cấu hình đúng `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD` từ Aiven vào Render.

---

## IV. CÁC LỆNH THƯỜNG DÙNG
| Lệnh | Tác dụng |
| :--- | :--- |
| `docker compose up -d` | Khởi động lại các container đã có |
| `docker compose down` | Dừng và xóa toàn bộ container |
| `docker compose ps` | Kiểm tra trạng thái các service |
| `docker compose logs -f [service]` | Xem log realtime (backend/frontend/db) |

---
**Note Management Project - 2026**