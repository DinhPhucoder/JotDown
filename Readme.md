# NOTE MANAGEMENT — Hướng dẫn chạy local

Tài liệu này hướng dẫn chạy dự án ở local bằng Docker Compose, cách reset database (đặc biệt trước khi chạy migration), và cách kiểm tra DB bằng extension MySQL trong VSCode.

## 1) Yêu cầu
- Đã cài Docker Desktop (có `docker compose`).
- Chạy lệnh trong thư mục gốc dự án (nơi có `docker-compose.yml`).

## 2) Thiết lập môi trường
1. Vào `backend/`, tạo file `backend/.env` (copy từ `backend/.env.example`).
2. Cấu hình DB mặc định chạy trong Docker (đã khớp với `.env.example`).
3. **Lưu ý về App Key & Migration:** Dự án đã được cấu hình tự động chạy `php artisan key:generate --force` và `php artisan migrate --force` ngay khi bạn chạy lệnh `docker compose up`. Các thành viên **không cần** chạy tay các lệnh này.

## 3) Khởi động dự án (lần đầu / bình thường)
```bash
docker compose up --build -d
```

Xem log backend:
```bash
docker compose logs -f backend
```

Kiểm tra container:
```bash
docker compose ps
```

## 4) Reset database (Khi vừa thay đổi schema)
Dự án đang mount dữ liệu MySQL vào `./docker/mysql_data` (bind mount), nên reset DB có 2 mức:

### A) Reset schema bằng Laravel (giữ nguyên volume MySQL)
Dùng khi muốn “đập lại” toàn bộ bảng theo migration hiện tại:
```bash
docker compose exec backend php artisan migrate:fresh --force
```

Nếu có seed:
```bash
docker compose exec backend php artisan migrate:fresh --seed --force
```

### B) Reset sạch MySQL 
Dùng khi DB bị lệch lâu ngày, hoặc cần clean tuyệt đối:
1) Dừng containers:
```bash
docker compose down
```
2) Xóa dữ liệu MySQL local:
- Xóa thư mục `docker/mysql_data/` (xóa cả folder hoặc xóa toàn bộ file bên trong).
(Lưu ý: `docker compose down -v` **không** xóa được dữ liệu trong trường hợp này vì MySQL đang dùng bind mount.)
3) Chạy lại:
```bash
docker compose up --build -d
```
## 5) Truy cập & health check
- Frontend (Vite dev server): http://localhost:5173
- API (qua Nginx gateway): http://localhost/api
- Backend health: http://localhost/api/health

## 6) Kiểm tra database bằng VSCode MySQL extension
MySQL được expose ra host ở `127.0.0.1:3306`:
- Host: `127.0.0.1`
- Port: `3306`
- User: `root`
- Password: `root`
- Database: `notes_db`

Chạy các query sau để kiểm tra migration + routines:
```sql
SHOW TABLES;
SHOW TRIGGERS;
SHOW PROCEDURE STATUS WHERE Db = DATABASE();
SHOW FUNCTION STATUS WHERE Db = DATABASE();
```
Note Management Project — 2026