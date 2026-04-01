========================================================================
    NOTE MANAGEMENT - DOCKER SETUP (4 CONTAINERS)
========================================================================

YÊU CẦU: Hệ thống giả định bạn đã cài đặt Docker và docker-compose.
KIẾN TRÚC 4 CONTAINERS BAO GỒM:
  1. Nginx Reverse Proxy (Gateway)
  2. Frontend (React/Vite)
  3. Backend (Laravel FPM)
  4. Database (MySQL)

Có 2 kịch bản chạy song song:
 - Môi trường Code (Dev): Có hot-reload (Vite).
 - Môi trường Nộp bài (Production): Chế độ Compile build tĩnh .prod để chấm điểm siêu nhanh.

========================================================================
I. MÔI TRƯỜNG PHÁT TRIỂN (DEVELOPMENT - CHẠY KHI ĐANG CODE)
========================================================================
1. Khởi chạy toàn bộ hệ thống (có thể tốn chút thời gian lần đầu để npm/composer tải dependencies tự động):
   > docker-compose up --build -d

2. Cài đặt các thư viện Backend (bắt buộc ở lần đầu chạy project):
   > docker-compose exec backend composer install
   > docker-compose exec backend php artisan key:generate
   > docker-compose exec backend php artisan migrate --seed

3. Truy cập vào giao diện web:
   Trang chủ: http://localhost (Các API sẽ nằm ở sub-path http://localhost/api/...)

**Khi chỉnh sửa source code (Frontend/Backend), sự thay đổi sẽ hiển thị ngay lập tức không cần restart.

========================================================================
II. MÔI TRƯỜNG NỘP CHẤM ĐIỂM (PRODUCTION/MULTI-STAGE - CHẠY KHI ĐÁNH GIÁ END-PRODUCT)
========================================================================
1. Khởi chạy bằng file cấu hình riêng (Sẽ sử dụng Dockerfile.prod của Frontend để build mode production cho ReactJS):
   > docker-compose -f docker-compose.prod.yml up --build -d

2. Nếu DB ở môi trường cũ chưa được migrate, chạy lệnh tương tự bước 2 ở phần I:
   > docker-compose -f docker-compose.prod.yml exec backend composer install (nếu chưa có vendor)
   > docker-compose -f docker-compose.prod.yml exec backend php artisan migrate --seed

3. Truy cập vào hệ thống tại:
   http://localhost

========================================================================
LƯU Ý QUAN TRỌNG VỀ DATABASE VOLUME
========================================================================
Dữ liệu của Database được ánh xạ thẳng xuống thư mục `./docker/mysql_data` gốc trên máy tính thật. 
Do vậy nếu bạn có gõ `docker-compose down` và tắt máy, thì dữ liệu những tài khoản/ghi chú đã tạo lúc đánh giá hay chạy demo vẫn còn nguyên không bị clear đâu nhé.
