## Plan: Gộp gradient-note-guide-main vào frontend

Mục tiêu là đưa giao diện note trong gradient-note-guide-main vào folder frontend hiện có, nhưng giữ frontend stack làm nguồn chân lý: React + Vite + React Router + Bootstrap + JavaScript + FontAwesome. Không trộn trực tiếp TanStack Router, Tailwind/shadcn, hay TypeScript vào app đích vì sẽ tạo xung đột router, CSS và quy ước build.

**Bối cảnh đã xác nhận**
- frontend hiện là app React Router + Bootstrap + JS, có landing/auth pages và FontAwesome.
- gradient-note-guide-main là app riêng dùng TanStack Router/Start + Tailwind v4 + shadcn/ui + TypeScript + Lucide.
- routeTree.gen.ts của gradient app đang tham chiếu các route auth không tồn tại trong thư mục routes, nên đây không phải nguồn để merge nguyên trạng.

**Steps**
1. Chốt ranh giới merge: giữ frontend làm app chính, chỉ port các phần giao diện note cần thiết từ gradient-note-guide-main sang cùng stack hiện tại. Phụ thuộc vào việc xác nhận phạm vi chức năng cần mang sang: landing only, auth only, hay toàn bộ note app.
2. Lập bản đồ tương đương giữa hai codebase: route, layout, component, theme, và model dữ liệu. Ưu tiên tái sử dụng luồng từ gradient app, nhưng rewrite theo React Router + Bootstrap + JS.
3. Định nghĩa kiến trúc đích trong frontend: nơi đặt route mới, shared UI, theme handling, mock data, và asset/icon convention. Mục tiêu là một shell thống nhất thay vì hai hệ router/CSS cùng chạy.
4. Port các màn hình theo thứ tự rủi ro thấp đến cao: landing/header/auth trước, rồi đến note list, sidebar, note editor, settings, cuối cùng là các tiện ích phụ. Mỗi màn hình cần đổi sang cấu trúc và className phù hợp Bootstrap/FontAwesome.
5. Đồng bộ hệ điều hướng và trạng thái: thay các đường dẫn, navigation calls, theme persistence, và form interactions để khớp React Router hiện tại. Loại bỏ mọi phụ thuộc còn sót lại vào TanStack Router hoặc routeTree generated artifacts.
6. Chuẩn hóa design system của frontend để chứa phần giao diện note: cập nhật index.css và các component chung nếu cần để giữ minimal, premium, responsive, nhưng vẫn trong ngôn ngữ Bootstrap hiện có.
7. Dọn dependencies và file thừa sau khi port xong: loại package không còn dùng trong frontend, xóa code nhánh cũ của gradient stack nếu không còn cần, và giữ structure rõ ràng, ít trùng lặp.
8. Gắn quy trình GitNexus vào lúc triển khai: trước khi sửa bất kỳ symbol nào, chạy gitnexus_context và gitnexus_impact upstream cho symbol đó; nếu index stale thì chạy npx gitnexus analyze; sau khi chỉnh sửa, dùng gitnexus_detect_changes để xác nhận blast radius đúng kỳ vọng.

**Relevant files**
- C:\Users\Phu\Desktop\Note\frontend\package.json — nguồn chân lý cho stack đích và dependency cần giữ lại.
- C:\Users\Phu\Desktop\Note\frontend\src\main.jsx — entrypoint của app đích.
- C:\Users\Phu\Desktop\Note\frontend\src\App.jsx — router shell hiện tại cần mở rộng.
- C:\Users\Phu\Desktop\Note\frontend\src\index.css — design system gốc, nơi sẽ chứa style chung cho giao diện mới.
- C:\Users\Phu\Desktop\Note\frontend\src\components\landing\* — pattern UI và landing shell có thể tái dùng.
- C:\Users\Phu\Desktop\Note\frontend\src\pages\Authentication Pages\* — auth routes/pages cần giữ đồng bộ với note app.
- C:\Users\Phu\Desktop\Note\gradient-note-guide-main-20260421T141338Z-3-001\gradient-note-guide-main\src\routes\index.tsx — luồng note chính để port nội dung.
- C:\Users\Phu\Desktop\Note\gradient-note-guide-main-20260421T141338Z-3-001\gradient-note-guide-main\src\components\notes\Header.tsx — header note app, cần chuyển sang React Router/Bootstrap/FontAwesome.
- C:\Users\Phu\Desktop\Note\gradient-note-guide-main-20260421T141338Z-3-001\gradient-note-guide-main\src\components\notes\LabelSidebar.tsx — sidebar nhãn, có thể port logic nhưng rewrite UI.
- C:\Users\Phu\Desktop\Note\gradient-note-guide-main-20260421T141338Z-3-001\gradient-note-guide-main\src\components\notes\NoteCard.tsx — card ghi chú cần map sang style/frontend stack đích.
- C:\Users\Phu\Desktop\Note\gradient-note-guide-main-20260421T141338Z-3-001\gradient-note-guide-main\src\components\notes\NoteEditor.tsx — editor modal và auto-save cần kiểm tra lại khi port.
- C:\Users\Phu\Desktop\Note\gradient-note-guide-main-20260421T141338Z-3-001\gradient-note-guide-main\src\components\notes\SettingsDialog.tsx — settings dialog cần port nếu giữ preferences.
- C:\Users\Phu\Desktop\Note\gradient-note-guide-main-20260421T141338Z-3-001\gradient-note-guide-main\src\data\mockData.ts — dữ liệu mẫu để chuyển sang JS hoặc giữ tạm khi chưa có backend.
- C:\Users\Phu\Desktop\Note\gradient-note-guide-main-20260421T141338Z-3-001\gradient-note-guide-main\src\types\note.ts — schema dữ liệu để chuyển thành JSDoc/biên dịch thủ công nếu cần.

**Verification**
1. Đối chiếu dependency sau khi port để xác nhận frontend không còn phụ thuộc TanStack Router, Tailwind, shadcn, hay TypeScript nếu không dùng.
2. Chạy lint/build của frontend để kiểm tra router, component, import path, và CSS mới không vỡ.
3. Kiểm tra thủ công các luồng chính: landing, login, signup, forgot password, danh sách note, filter nhãn, tìm kiếm, mở editor, settings, logout.
4. Xác nhận không còn file route generated hoặc code path nào gọi TanStack router trong app đích.
5. Nếu phần note được kết nối vào backend sau này, thêm bước smoke test API riêng ở giai đoạn tiếp theo, không trộn vào lần merge này.

**Decisions**
- Chọn frontend làm nguồn chân lý cho stack đích.
- Không gộp nguyên trạng hai router hay hai hệ CSS vào cùng một runtime.
- Không ưu tiên giữ TypeScript trong lần merge đầu; nếu cần, chỉ cân nhắc ở giai đoạn chuyển đổi riêng.
- Nội dung note app được xem như tính năng cần port, không phải một app độc lập để chạy song song.

**Further Considerations**
1. Nếu bạn muốn giữ nguyên cảm giác visual của gradient app, nên chỉ port layout và dữ liệu, rồi rewrite lớp style theo Bootstrap thay vì copy class Tailwind trực tiếp.
2. Nếu sau khi merge mà phần note quá lớn, tách tiếp thành các module route nhỏ trong frontend để tránh một App.jsx phình to.
3. Nếu bạn muốn, bước kế tiếp có thể là một plan chi tiết hơn theo file/module, để chuyển sang triển khai ngay mà không phải bàn lại phạm vi.