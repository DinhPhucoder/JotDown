# Đồ án cuối kỳ - Web Programming & Applications (503073)


## 1. Thông tin Deploy Online 
Nếu giám khảo muốn trải nghiệm trực tiếp hệ thống đã được triển khai, vui lòng truy cập: `https://www.jotdown.space`


## 2. Tài khoản Test (Pre-loaded Data)
Hệ thống đã có sẵn dữ liệu mẫu (Notes, Labels, Share...). Sử dụng các tài khoản sau để kiểm tra:

**Tài khoản 1:**
- Email: `coding1703@gmail.com`
- Password: `123123123`

**Tài khoản 2:** *(Dùng để kiểm tra chức năng Share Note & Realtime)*
- Email: `dinhphan1209@gmail.com`
- Password: `123123123`

> **Lưu ý:** Để kiểm tra chức năng **Real-time collaboration**, vui lòng mở 2 trình duyệt ẩn danh khác nhau và đăng nhập bằng 2 tài khoản trên để thấy dữ liệu đồng bộ tức thời.

> **Lưu ý:** Để kiểm tra chức năng gửi mail (mã otp, xác thực, thông báo nhận được ghi chú chia sẻ), vui lòng tạo tài khoản với email của giám khảo.

**Trong trường hợp môi trường online gặp trục trặc hãy sử dụng môi trường local sau đây.**
## 3. Hướng dẫn chạy project ở Local (Sử dụng Docker Compose)

Dự án đã được thiết lập sẵn môi trường tự động hóa bằng Docker Compose (Bao gồm Frontend, Backend Laravel, và MySQL Database). 

### Yêu cầu cài đặt trước:
- Máy tính cần cài đặt sẵn **Docker** và **Docker Compose**.

### Các bước chạy:

**Bước 1:** Mở terminal tại thư mục gốc của project (nơi chứa file `docker-compose.yml`).

**Bước 2:** Khởi chạy toàn bộ hệ thống bằng lệnh:
```bash
docker-compose up -d --build
```
*(Hệ thống sẽ tự động build image, cài đặt Composer packages, NPM packages, và chạy migrate database. Vui lòng chờ 1-5 phút cho lần chạy đầu tiên).*

*(Seeder dữ liệu mẫu cũng sẽ tự động chạy trong môi trường local ngay sau migrate.)*

**Bước 3:** Truy cập ứng dụng tại các địa chỉ sau:
- **Trang web (Frontend):** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:8000](http://localhost:8000)
