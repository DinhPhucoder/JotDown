# Design Rules

Tài liệu này mô tả bộ quy tắc thiết kế lấy từ landing page hiện tại để đồng bộ giao diện cho toàn bộ hệ thống Note Management.

## 1. Tinh thần thiết kế
- Phong cách chính: minimalism hiện đại, sắc nét, có chiều sâu nhưng không rối.
- Ưu tiên cảm giác premium, gọn gàng, đọc nhanh, tập trung vào nội dung.
- Chỉ dùng các hiệu ứng vừa đủ để tạo nhịp thị giác, không lạm dụng animation.

## 2. Typography
- Font chính cho nội dung: `Inter`.
- Font cho heading, brand, text nhấn mạnh: `Google Sans Flex`.
- Heading dùng weight đậm, tracking âm nhẹ để tạo cảm giác gọn và chắc.
- Body text ưu tiên rõ ràng, dễ đọc, không dùng font trang trí.

## 3. Màu sắc
- Dark theme dùng nền gradient sâu kiểu deep-sea: xanh đậm, tím đậm, navy.
- Light theme dùng nền sáng mềm với radial gradient xanh/tím nhẹ.
- Màu primary là gradient xanh sang tím, dùng cho CTA và nhấn mạnh.
- Text chính phải có độ tương phản cao với nền.
- Text phụ dùng opacity thấp hơn để tạo phân cấp, không làm mờ quá mức.

### Palette hex đang dùng
- Primary: `#4f46e5`
- Secondary: `#0f172a`
- CTA / Accent: `#3B82F6`
- Gradient primary: `#0b5cff` -> `#1f58ff` -> `#7c3aed`
- Dark background gradient: `#041a3b` -> `#0c2f63` -> `#281a5f` -> `#4b1d79`
- Light background gradient: `#f3f7ff` -> `#eef3ff` -> `#f7f3ff`
- Dark text: `#f8fafc`
- Light text: `#0f172a`
- Light secondary text: `rgba(15, 23, 42, 0.8)`
- Dark secondary text: `rgba(241, 245, 249, 0.82)`
- Surface dark: `rgba(30, 41, 59, 0.7)`
- Surface light: `rgba(255, 255, 255, 0.05)`
- Border light mode panel: `rgba(76, 92, 148, 0.18)`
- Shadow glow: `rgba(49, 105, 255, 0.45)`

## 4. Nền và bề mặt
- Nền tổng thể không phẳng một màu, luôn có gradient hoặc lớp nền phụ để tạo chiều sâu.
- Dùng glassmorphism nhẹ cho card/panel: nền bán trong suốt, border mỏng, blur vừa phải.
- Card sáng ở light mode phải vẫn giữ cảm giác nổi khối, không bị trắng bệt.

## 5. Bo góc và hình khối
- Triết lý chung là sharp geometry, bo góc nhỏ cho phần lớn control.
- Button, card, input mặc định có radius nhỏ.
- Chỉ dùng bo tròn lớn cho pill button, badge, avatar, icon circle.
- Hình khối nên rõ ràng, ít đường cong thừa.

## 6. Layout
- Toàn bộ layout dùng Bootstrap grid và container chuẩn.
- Hero nên căn giữa, có khoảng thở lớn theo chiều dọc.
- Các section phía dưới phải có nhịp spacing rõ ràng giữa tiêu đề, mô tả và content.
- Không ép nội dung quá sát nhau; ưu tiên khoảng trắng có chủ đích.

## 7. Hero section
- Hero title là điểm nhấn thị giác lớn nhất của trang.
- Có thể dùng gradient text cho tiêu đề chính.
- Subheadline phải ngắn, súc tích, mô tả giá trị chính của sản phẩm.
- CTA đặt ngay dưới hero text, kích thước đủ lớn để dễ bấm.
- Hero cần giữ trạng thái cân bằng giữa bold typography và khoảng trống.

## 8. Button và tương tác
- Button primary dùng gradient brand.
- Button hover phải có phản hồi rõ ràng: đổi shadow, nổi lên nhẹ hoặc tăng độ sáng.
- Không dùng quá nhiều kiểu button khác nhau trong cùng một màn hình.
- Icon button nên tối giản, không nặng hiệu ứng.

## 9. Card và content block
- Card nội dung dùng panel-dark hoặc style tương đương.
- Tiêu đề card dùng heading font, body text dùng font thường.
- Các note preview card có thể nổi lên bằng transform nhẹ khi hover.
- Border và shadow phải vừa đủ, không tạo cảm giác nặng hoặc thô.

## 10. Motion
- Dùng animation xuất hiện theo cụm, stagger theo thứ tự hợp lý.
- Motion chính: fade + slide up cho section, parallax nhẹ cho preview card.
- Floating animation chỉ dùng cho các phần mang tính minh họa, không áp dụng tràn lan.
- Nếu người dùng bật reduced motion, animation phải giảm hoặc tắt.

## 11. Iconography
- Chỉ dùng FontAwesome cho icon.
- Icon phải nhất quán về trọng lượng và kích thước.
- Icon đóng vai trò hỗ trợ, không thay thế nội dung chữ.

## 12. Responsive behavior
- Ưu tiên mobile-first về spacing và đọc hiểu nội dung.
- Hero title trên mobile phải giữ đủ line-height để tránh cắt chữ.
- Sections dạng card phải tự xếp lại theo Bootstrap grid.
- Padding ngang trên mobile cần nới nhẹ để tránh chạm mép màn hình.

## 13. Theme behavior
- Hệ thống phải hỗ trợ cả light và dark theme.
- Mỗi theme cần giữ đúng tinh thần của cùng một design language, chỉ thay đổi màu nền và độ tương phản.
- Không thay đổi cấu trúc layout giữa các theme.

## 14. Quy tắc áp dụng chung cho hệ thống
- Mỗi component mới phải ưu tiên font, color, border-radius, shadow và spacing theo bộ quy tắc này.
- Nếu component không có yêu cầu đặc biệt, hãy bám theo style của landing page hiện tại.
- Không tự ý thêm palette mới hoặc hiệu ứng mới nếu chưa có lý do rõ ràng.

## 15. Tóm tắt nhanh
- Font: `Inter` cho body, `Poppins` cho heading.
- Nền: gradient sâu, có chiều sâu thị giác.
- UI: minimal, sắc nét, premium.
- Card: glass nhẹ, shadow vừa.
- Button: gradient primary, hover rõ.
- Motion: tinh tế, có chủ đích.
- Responsive: ưu tiên đọc tốt trên mobile.
