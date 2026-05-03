# Kịch bản thuyết trình: Note Management Website

### PHẦN 1: CÔNG NGHỆ SỬ DỤNG
Để hiện thực hóa dự án này, nhóm đã chia hệ thống thành các phần riêng biệt và lựa chọn những công nghệ phù hợp nhất cho từng mục đích:

**1. Về phía Frontend:**
*   **React 19:** Bọn em dùng React làm framework chính để xây dựng giao diện người dùng đẹp mắt và mượt mà.
*   **Bootstrap 5.3:** Được sử dụng để styling và chia layout, đảm bảo trang web hiển thị chuẩn Responsive trên mọi thiết bị.
*   **Laravel Echo & Pusher JS:** Đây là bộ công cụ WebSocket Client ở phía trình duyệt. Mục đích là để tự động lắng nghe các tín hiệu từ server, giúp thực hiện tính năng cộng tác thời gian thực mà không cần phải tải lại trang.
*   **Fetch API:** Bọn em cấu hình Fetch API để làm nhiệm vụ gửi và nhận dữ liệu từ Backend một cách đồng nhất và dễ quản lý lỗi.

**2. Về phía Backend:**
*   **Laravel 13:** Nhóm chọn framework này của PHP vì tính bảo mật rất cao và cấu trúc mã nguồn cực kỳ rõ ràng.
*   **Laravel Sanctum:** Công cụ chuyên dùng để xử lý xác thực (Authentication). Nó giúp hệ thống quản lý đăng nhập và cấp phát Token an toàn cho người dùng thay vì dùng session truyền thống.
*   **Pusher:** Đây là dịch vụ Broadcasting, làm nhiệm vụ phát tín hiệu (WebSockets) xuống Frontend mỗi khi có thay đổi dữ liệu để thực hiện tính năng Real-time.
*   **Resend:** Email Service. Nó thay thế cho SMTP truyền thống, giúp tự động gửi các email như mã xác nhận OTP hay thông báo chia sẻ ghi chú với tốc độ rất nhanh và chuyên nghiệp, tránh việc thư bị đưa vào hòm thư rác hoặc bị đánh dấu spam.
*   **Cloudinary:** Thay vì lưu file hình ảnh trực tiếp trên server gây tốn dung lượng ổ cứng, bọn em dùng Cloudinary làm dịch vụ lưu trữ đám mây chuyên dụng để chứa hình ảnh đính kèm của ghi chú và avatar.

**3. Về Cơ sở dữ liệu (Database):**
*   **MySQL:** Là hệ quản trị CSDL chính của toàn bộ hệ thống. Ngoài việc lưu trữ, bọn em còn tận dụng các công cụ nâng cao của MySQL như **Functions, Procedures và Triggers** để xử lý logic toàn vẹn dữ liệu (như tự động dọn rác, ràng buộc quyền) ngay từ tầng database.
*   **IndexedDB:** Được tích hợp trực tiếp trên trình duyệt web của người dùng. Nó đóng vai trò như một cơ sở dữ liệu cục bộ, giúp lưu tạm dữ liệu để người dùng vẫn xem và sửa được ghi chú ngay cả khi rớt mạng (Offline).
*   **Laravel Migrations:** Giúp nhóm quản lý 100% cấu trúc của các bảng dữ liệu bằng code thay vì tạo bảng thủ công, dễ dàng cài đặt lại database mọi lúc mọi nơi.
*   **Eloquent ORM:** Giúp thao tác database mà không cần viết SQL thuần.

**4. Về Hạ tầng & Triển khai (Deployment):**
*   Toàn bộ hệ thống đã được đưa lên môi trường Internet thực tế: **Frontend** chạy trên nền tảng **Vercel**, **Backend** đặt trên **Render**, và **Database MySQL** được lưu trữ đám mây qua dịch vụ **Aiven**. 
*   Bên cạnh đó, nhóm sử dụng **Docker & Docker Compose** để đóng gói toàn bộ môi trường local, kết hợp với **Nginx** làm Reverse Proxy. Điều này giúp hệ thống có thể dễ dàng khởi chạy cục bộ trên máy tính của giảng viên.

---

### PHẦN 2: KIẾN TRÚC TỔNG THỂ
Về mặt kiến trúc, ứng dụng hoạt động theo mô hình Client-Server tách biệt hoàn toàn thông qua các RESTful API.

*   **Ở phía Frontend:** Bọn em không gom tất cả code vào một nơi, mà chia cấu trúc thư mục theo cụm tính năng (gọi là Feature-based architecture). Ví dụ: code của phần xác thực (auth) sẽ tách biệt hoàn toàn với phần ghi chú (notes). Điều này giúp dễ quản lý, dễ tìm lỗi và dễ nâng cấp hơn.
*   **Ở phía Backend:** Nhóm tuân thủ mô hình **MVC** truyền thống nhưng áp dụng nguyên tắc **"Skinny Controller"**. Nghĩa là Controller chỉ làm nhiệm vụ đứng ra tiếp nhận request, còn các nghiệp vụ logic xử lý sẽ được đẩy sang tầng Service, và các ràng buộc dữ liệu được đẩy sâu xuống Database. Điều này giúp Backend không bị phình to và luôn chạy ổn định.

---

### KẾT LUẬN
Tóm lại, dự án của nhóm đã bám sát và hoàn thành trọn vẹn 28/28 tiêu chí của đề bài. Quan trọng hơn, thông qua đồ án này, nhóm không chỉ rèn luyện kỹ năng code Fullstack, biết cách vận dụng nhiều công nghệ khác nhau vào đúng mục đích của nó, mà còn học được cách thiết kế một kiến trúc phần mềm sao cho quy củ và tối ưu nhất. 

Em xin kết thúc phần trình bày của nhóm tại đây. Cảm ơn thầy đã lắng nghe ạ!
