## Nhóm Trang Xác Thực (Authentication Pages): (Quang)
**Đăng nhập (Login):** Email và mật khẩu. Có liên kết đến trang Đăng ký và
Quên mật khẩu.
**Đăng ký (Register):** Chỉ bao gồm:** Email, Tên hiển thị, Mật khẩu (nhập 2 lần).
**Quên mật khẩu (Password Reset):** Form nhập email để nhận OTP. Form
nhập mã OTP, Form điền mật khẩu mới (nhập 2 lần).
**Thông báo kích hoạt (Activation Banner):** Một thanh thông báo màu sắc
nổi bật (ví dụ: vàng hoặc cam) nằm ở trên cùng trang Dashboard nếu tài
khoản chưa kích hoạt. 

## Trang Dashboard Chính (Main Notes Page): (Khánh)
**Thanh điều hướng bên trái (Sidebar):**
    ○ Ghi chú của tôi: Xem tất cả.
    ○ Nhãn (Labels): Danh sách các nhãn kèm checkbox để **lọc cùng lúc nhiều nhãn**. Có nút "Chỉnh sửa nhãn" để mở Modal quản lý (thêm, sửa, xóa nhãn).
    ○ Ghi chú được chia sẻ: Mục riêng để xem ghi chú từ người khác.
**Thanh công cụ trên cùng (Header):**
    ○ Live Search: Ô tìm kiếm kích hoạt ngay khi gõ (delay 300ms).
    ○ Nút chuyển đổi View: Icon chuyển qua lại giữa Grid và List.
    ○ User Menu: Avatar, nút vào Profile và Cài đặt (Preferences).
**Khu vực hiển thị Ghi chú:**
    ○ Khu vực Pinned: Hiển thị các ghi chú được ghim lên đầu.
    ○ Khu vực Others: Các ghi chú còn lại sắp xếp theo thời gian.
    ○ Note Card: Mỗi thẻ ghi chú cần hiển thị: Tiêu đề, nội dung tóm tắt,
hình ảnh đính kèm (nếu có), nhãn, và các Icon trạng thái    . (Tham khảo NoteCard ở LandingPage)

## Giao diện Trình soạn thảo (Note Editor Interface): (Khánh)
**Cơ chế Auto-save:** Không có nút "Lưu". Khi người dùng ngừng gõ, hệ thống
tự động lưu vào Database.
**Thanh công cụ trong Note:**
    ○ Nút đính kèm hình ảnh.
    ○ Nút quản lý Nhãn cho ghi chú đó.
    ○ Nút đặt mật khẩu (Lock): 
        - Thiết lập mới: Modal nhập mật khẩu 2 lần.
        - Thay đổi: Modal nhập mật khẩu cũ + mật khẩu mới 2 lần.
        - Hủy bỏ: Modal yêu cầu nhập lại mật khẩu hiện tại để xác nhận.
    ○ Nút Chia sẻ (Share).
**Real-time Indicator:** Nếu là ghi chú đang cộng tác, hiển thị danh sách người
dùng đang online/cùng chỉnh sửa.

## Trang Hồ sơ & Cài đặt (Profile & Preferences): (Quang)
**Chỉnh sửa Profile:** Đổi tên hiển thị, cập nhật Avatar.
**Cài đặt (Preferences):** Chuyển đổi giao diện Sáng/Tối (Light/Dark mode),
Điều chỉnh kích thước font chữ (Nhỏ/Vừa/Lớn). Màu sắc ghi chú (Chọn trước 1 vài màu).
**Đổi mật khẩu:** Yêu cầu nhập mật khẩu cũ và mật khẩu mới (2 lần).
**Đăng xuất** Nút đăng xuất.

## Trang/Khu vực Chia sẻ (Sharing Management): (Quang)
**Đối với chủ sở hữu:** Một Modal/Trang hiển thị danh sách email / Tên hiển thị
những người đã được chia sẻ, quyền của họ (Đọc/Sửa), và nút thu hồi
quyền.
**Đối với người nhận:** Khu vực hiển thị rõ ai là người chia sẻ và thời gian chia
sẻ.
## Những lưu ý khi dựng giao diện:
**Tính Responsive:** Giao diện phải hoạt động tốt trên Mobile, Tablet và
Desktop. Bạn nên dùng Tailwind CSS hoặc Bootstrap để xử lý nhanh phần
này.
**Xác nhận xóa:** Luôn phải có Dialog xác nhận trước khi xóa ghi chú để tránh mất dữ liệu nhầm.
**Đồng bộ màu sắc và font chữ:** Lấy LandingPage làm chuẩn hoặc có thể dựa vào file `DESIGN_RULES.md`.
**Khả năng hoạt động Offline (PWA):** 
    - Hiển thị Toast thông báo khi mất kết nối: "Bạn đang ở chế độ ngoại tuyến. Thay đổi sẽ được đồng bộ khi có mạng."
    - Card ghi chú có icon Offline để người dùng nhận biết.
**Lưu ý về Theme (Light/Dark):**
    - Đảm bảo độ tương phản (Contrast) của văn bản trên các màu Note (chọn trước ở Preferences) phải dễ đọc ở cả 2 mode.
    - Sử dụng CSS Variables để quản lý màu sắc, tránh hard-code màu để khi chuyển mode không bị lỗi hiển thị.
    - Dark mode không dùng màu đen tuyệt đối (#000), ưu tiên các tông xám đậm để giảm mỏi mắt.






