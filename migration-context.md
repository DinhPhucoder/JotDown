# JotDown — Business Knowledge Base

> Tài liệu này mô tả **business logic và domain knowledge** của hệ thống JotDown.  
> Mục đích: giúp Agent hiểu **TẠI SAO** hệ thống hoạt động như vậy, không mô tả code.  
> Đọc file này TRƯỚC khi implement bất kỳ feature nào.

---

## 1. Domain Overview — JotDown là gì?

JotDown là ứng dụng **ghi chú cá nhân có tính năng cộng tác**. Người dùng có thể:
- Tạo và quản lý ghi chú riêng tư
- Đặt mật khẩu bảo vệ từng ghi chú nhạy cảm
- Chia sẻ ghi chú với người dùng khác (theo quyền READ hoặc EDIT)
- Đính kèm ảnh vào ghi chú
- Phân loại ghi chú bằng nhãn (label) cá nhân
- Làm việc offline và đồng bộ khi có kết nối trở lại
- Nhận thông báo realtime khi ghi chú được chỉnh sửa hoặc chia sẻ

---

## 2. User & Authentication

### Vòng đời tài khoản
1. User **đăng ký** → tài khoản tạo ngay, **chưa cần verify email**
2. User **đăng nhập** ngay sau khi đăng ký — hệ thống không chặn user chưa verify
3. User **tự chọn** khi nào muốn xác thực email (hai cách: OTP 6 chữ số qua email, hoặc link xác thực có thời hạn 60 phút)

### OTP — Nguyên tắc hoạt động
- OTP có **2 mục đích**: xác thực email (`purpose=verify`) và quên mật khẩu (`purpose=reset`)
- OTP hợp lệ trong **5 phút**
- **Throttle:** Nếu OTP hiện tại chưa hết hạn, hệ thống từ chối gửi lại và thông báo số giây còn lại — tránh spam email
- **Xử lý khác nhau theo mục đích:**
  - `purpose=verify`: Sau khi xác thực thành công → mark email verified + xóa OTP
  - `purpose=reset`: Sau khi xác thực thành công → **KHÔNG** xóa OTP (giữ lại để bước `resetPassword` dùng tiếp)

### Đăng xuất & Token
- Khi đăng nhập lại → **xóa toàn bộ token cũ** (mỗi lần đăng nhập = session mới)
- Khi đặt lại mật khẩu thành công → **xóa toàn bộ token** (buộc đăng nhập lại trên mọi thiết bị)

### Avatar
- Avatar có thể là URL Cloudinary (bắt đầu bằng `http`) hoặc đường dẫn file local
- Khi trả về cho client, hệ thống luôn resolve thành URL đầy đủ
- Khi upload avatar mới qua Cloudinary, ảnh được crop vuông 256×256 tập trung vào khuôn mặt (`c_fill,g_face`)

### Preferences
- Mỗi user có một object `preferences` lưu cài đặt UI cá nhân (theme, ngôn ngữ, v.v.)
- Lưu dạng JSON, không có schema cố định — hệ thống chỉ lưu và trả về nguyên vẹn

---

## 3. Notes — Ghi chú

### Quyền sở hữu
- Mỗi ghi chú thuộc về **một user duy nhất** (owner)
- Owner có toàn quyền: xem, sửa, xóa, chia sẻ, đặt mật khẩu
- Người được chia sẻ có quyền hạn chế (xem mục Sharing)

### Sắp xếp
- Ghi chú được sắp xếp: **ghim lên đầu trước** (`is_pinned DESC`), sau đó theo **thời gian cập nhật mới nhất** (`updated_at DESC`)
- Khi ghim một ghi chú → lưu `pinned_at` để biết thời điểm ghim (dùng cho sắp xếp phụ nếu nhiều ghi chú cùng ghim)

### Version Control — Phát hiện xung đột
- Mỗi ghi chú có trường `version` (số nguyên, bắt đầu từ 1)
- Mỗi lần update thành công → version tăng thêm 1
- Khi client gửi request update, phải kèm `version` hiện tại mình đang có
- Nếu `version` client gửi **nhỏ hơn** version trên server → **xung đột** (409) → server trả về bản mới nhất để client quyết định merge
- Điều này giải quyết trường hợp nhiều người cùng sửa một ghi chú, hoặc client offline sửa rồi đẩy lên khi đã có người khác sửa trước

### Protected Notes — Ghi chú có mật khẩu
- User có thể đặt mật khẩu cho ghi chú để bảo vệ nội dung
- Khi trả về danh sách ghi chú, **ghi chú được khóa phải ẩn nội dung thật**:
  - `content` bị thay bằng một chuỗi giả (để UI có text tạo hiệu ứng blur)
  - Ảnh đính kèm bị làm mờ từ phía Cloudinary server (thêm transformation `e_blur:2000` vào URL) — **không phải blur ở frontend** — bảo đảm nội dung gốc không lộ qua URL
- Để xem nội dung thật, client gọi endpoint `verify-password` → nếu đúng → server trả về ghi chú đầy đủ không che
- **Quan trọng:** Mask phải xảy ra ở mọi nơi trả về ghi chú: `index`, `show`, `sync pull`, v.v.

### Soft Delete (Xóa mềm)
- Ghi chú không bị xóa thật khi user nhấn xóa — chỉ đặt `deleted_at`
- Khi một ghi chú bị xóa mềm → tự động xóa mềm toàn bộ **attachments và shares** liên quan
- Dữ liệu thật sự bị xóa bởi scheduled task chạy định kỳ (sau N ngày)

---

## 4. Labels — Nhãn phân loại

### Tính cá nhân của Label
- Label thuộc về **user**, không thuộc về ghi chú
- Một user tạo label của riêng mình, gắn vào ghi chú của mình
- **Tình huống quan trọng:** Khi ghi chú A được chia sẻ giữa User1 và User2:
  - User1 gắn label "Công việc" vào ghi chú A
  - User2 gắn label "Dự án X" vào ghi chú A
  - Khi User1 xem → chỉ thấy label "Công việc"
  - Khi User2 xem → chỉ thấy label "Dự án X"
  - **Mỗi người thấy label của chính mình trên cùng một ghi chú**

### Pivot table `note_labels`
- Bảng trung gian có thêm cột `user_id` để phân biệt ai gắn label nào
- Đây là thiết kế cố ý — không phải lỗi — để hỗ trợ tính năng label cá nhân trên ghi chú chia sẻ

---

## 5. Note Sharing — Chia sẻ ghi chú

### Mô hình quyền
| Quyền | Có thể làm gì |
|-------|--------------|
| `READ` | Xem ghi chú, gắn/bỏ label cá nhân |
| `EDIT` | Xem + sửa nội dung, thêm/xóa ảnh |
| Không có quyền | Không xem được, 403 |

### Quy tắc nghiêm ngặt
- **Chỉ owner** mới có thể chia sẻ, cập nhật quyền, thu hồi quyền
- **Không thể tự chia sẻ với chính mình** — kiểm tra ở cả tầng application và DB trigger
- Khi share lại với người đã bị thu hồi quyền → **khôi phục** (restore) bản ghi cũ thay vì tạo mới (tránh duplicate)

### Luồng chia sẻ
1. Owner nhập email người nhận + chọn quyền
2. Hệ thống tìm user theo email (phải là user đã đăng ký)
3. Gửi email thông báo cho người nhận
4. Broadcast realtime đến người nhận (họ thấy ghi chú mới trong danh sách ngay lập tức)

### Soft Delete của Share
- Khi thu hồi quyền → soft delete bản ghi share
- Người nhận vẫn có thể bị share lại sau này → restore bản ghi cũ

---

## 6. Attachments — Ảnh đính kèm

### Giới hạn
- Tối đa **3 ảnh** mỗi ghi chú
- Tổng dung lượng tối đa **15MB** mỗi ghi chú
- Chỉ chấp nhận định dạng **JPG và PNG**

### Luồng upload (Client-side upload)
Hệ thống dùng **direct upload lên Cloudinary từ client** — server không nhận file:
1. Client xin chữ ký từ server (`/attachments/signature`)
2. Server tạo chữ ký SHA1 từ `folder + timestamp + api_secret`
3. Client dùng chữ ký đó để upload trực tiếp lên Cloudinary
4. Sau khi upload thành công, client gửi metadata (URL, size, type) về server
5. Server xác thực URL thuộc đúng cloud và folder cho phép, sau đó lưu metadata

**Lý do thiết kế này:** Tránh server phải xử lý file nhị phân lớn, tiết kiệm băng thông và thời gian.

### Quyền thêm/xóa ảnh
- Owner hoặc người được share quyền **EDIT** mới có thể thêm/xóa ảnh
- Người chỉ có quyền **READ** không được thêm ảnh

### Soft Delete
- Ảnh bị xóa mềm khi user xóa, hoặc khi ghi chú bị xóa mềm
- Xóa thật bởi scheduled task (Cloudinary cleanup + DB cleanup)

---

## 7. Offline Sync — Đồng bộ offline

### Vấn đề cần giải quyết
User có thể tạo/sửa/xóa ghi chú khi mất kết nối. Khi có kết nối trở lại, client gửi toàn bộ thay đổi tồn đọng lên server.

### Push — Client đẩy thay đổi lên
Client gửi một mảng các `changes`, mỗi change có:
- `action`: loại thao tác
- `entity_id`: ID của ghi chú liên quan (0 nếu CREATE)
- `payload`: dữ liệu thay đổi
- `timestamp`: thời điểm thay đổi xảy ra (phía client)

**5 loại action:**

| Action | Ý nghĩa | Xử lý đặc biệt |
|--------|---------|----------------|
| `CREATE` | Tạo ghi chú mới | Có thể kèm `label_names` để tạo và gắn label cùng lúc |
| `UPDATE` | Cập nhật ghi chú | Kiểm tra version conflict; có thể kèm `label_names` để sync label |
| `DELETE` | Xóa ghi chú | Soft delete |
| `ATTACHMENT_ADD` | Thêm ảnh | Validate type/size/limit trước khi lưu |
| `ATTACHMENT_REMOVE` | Xóa ảnh | Cần `attachment_id` trong payload |

**Xử lý lỗi từng phần:** Mỗi change được xử lý độc lập. Nếu một change thất bại → ghi vào `conflicts` hoặc `failed_count`, không rollback toàn bộ batch.

**Audit log:** Mọi change đều được ghi vào `sync_queue` trước khi xử lý — phục vụ mục đích debug và audit.

### Pull — Client lấy thay đổi từ server
Client gửi tham số `since` (timestamp lần sync gần nhất).  
Server trả về:
- `notes`: danh sách ghi chú được **thêm hoặc cập nhật** kể từ `since`
- `deleted_ids`: danh sách ID các ghi chú bị **xóa** kể từ `since`
- `synced_at`: timestamp hiện tại của server (client dùng làm `since` cho lần sau)

**Quan trọng:** Protected notes trong pull response cũng phải bị mask (cùng logic với `index`).

### Label sync trong offline
Thay vì gửi label ID (client offline không biết server ID), client gửi `label_names` (danh sách tên nhãn).  
Server tự tìm hoặc tạo label theo tên, rồi sync pivot — đây là thiết kế offline-first.

---

## 8. Realtime — Thông báo tức thời

### Khi nào broadcast
| Sự kiện | Channel | Người nhận |
|---------|---------|-----------|
| Ghi chú được sửa | `private-note.{id}` | Tất cả người đang xem ghi chú đó (owner + shared users) |
| Ghi chú được chia sẻ | `private-user.{receiverId}` | Người nhận được share |
| Quyền share được cập nhật | `private-user.{receiverId}` | Người bị cập nhật quyền |
| Quyền share bị thu hồi | `private-user.{receiverId}` | Người bị thu hồi |

### Nguyên tắc
- Broadcast xảy ra **sau khi** DB đã cập nhật thành công — không broadcast nếu lưu DB thất bại
- Người vừa thực hiện thay đổi cũng nhận broadcast (client tự lọc bằng `updated_by`)
- Pusher channel phải được authorize qua endpoint `/api/broadcasting/auth` — chỉ cấp quyền cho user có liên quan đến ghi chú đó

---

## 9. Mail — Email thông báo

| Email | Khi nào gửi | Nội dung |
|-------|------------|---------|
| OTP Mail | Quên mật khẩu / Xác thực email | Mã 6 chữ số + hướng dẫn, phân biệt theo `purpose` |
| Verify Email Link | User yêu cầu gửi link xác thực | Signed URL hết hạn sau 60 phút |
| Note Shared Mail | Chia sẻ ghi chú thành công | Thông báo cho người nhận biết ai chia sẻ gì |

---

## 10. Scheduled Tasks — Tác vụ định kỳ

### Dọn dẹp DB
Xóa **vĩnh viễn** các bản ghi đã soft-delete quá N ngày:
- Ghi chú, shares, attachments (soft-deleted)
- Lịch sử sync queue cũ
- Sessions hết hạn

**Lý do:** Hệ thống dùng soft delete để cho phép rollback ngắn hạn, nhưng không giữ mãi để tránh phình DB.

### Cloudinary orphan cleanup
Tìm và xóa ảnh trên Cloudinary không còn được tham chiếu trong DB:
- Xảy ra khi: client upload ảnh lên Cloudinary nhưng không gửi metadata về server (app crash, mất mạng giữa chừng)
- Chỉ xóa ảnh cũ hơn N ngày (để tránh xóa nhầm upload đang trong quá trình)
- Hỗ trợ `--dry-run` để kiểm tra trước khi xóa thật

---

## 11. Các Business Rules Quan Trọng (Không được bỏ qua)

> ⚠️ Đây là những rule dễ bị bỏ sót nhất khi migration.

1. **Mask protected note ở MỌI nơi trả về ghi chú** — không chỉ ở `show`, mà cả `index`, `sync/pull`, và mọi response có embed ghi chú
2. **Label filter theo user** — khi load labels của một ghi chú, luôn filter theo `user_id` của user hiện tại, không lấy toàn bộ
3. **Version conflict chỉ block khi client version THẤP HƠN server** — bằng nhau hoặc cao hơn thì cho qua
4. **Share restore trước create** — khi share với người đã từng bị thu hồi, restore bản ghi cũ (không tạo mới), để tránh duplicate key
5. **Self-share prevention ở 2 lớp** — cả application layer và DB trigger đều ngăn; application trả 422 rõ ràng
6. **OTP throttle** — kiểm tra trước khi generate và gửi OTP mới; nếu OTP cũ còn hiệu lực → từ chối
7. **Attachment URL validation** — URL phải thuộc đúng Cloudinary cloud name và folder đã cấu hình; từ chối URL ngoài hệ thống
8. **Sync push: xử lý từng change độc lập** — một change lỗi không được ảnh hưởng các change khác trong cùng batch
9. **Blur ảnh phía server** — không chỉ ẩn ảnh ở frontend; thực sự transform URL để Cloudinary trả về ảnh mờ
10. **Per-user label pivot** — bảng `note_labels` có `user_id`; mọi thao tác attach/detach phải scope theo user hiện tại

---

## 12. Glossary

| Thuật ngữ | Định nghĩa |
|-----------|-----------|
| **Owner** | User tạo ra ghi chú, có toàn quyền |
| **Receiver** | User được chia sẻ ghi chú |
| **Sender** | Owner thực hiện hành động share |
| **Protected Note** | Ghi chú được đặt mật khẩu, nội dung bị ẩn khi không xác thực |
| **Soft Delete** | Xóa logic (đặt `deleted_at`), không xóa khỏi DB |
| **Version Conflict** | Khi client cố update ghi chú với version cũ hơn server |
| **Sync Push** | Client đẩy batch thay đổi offline lên server |
| **Sync Pull** | Client lấy delta (thay đổi mới nhất) từ server |
| **Label** | Nhãn phân loại ghi chú, thuộc về user |
| **Attachment** | Ảnh đính kèm, lưu metadata trên DB, file trên Cloudinary |
| **OTP** | Mã xác thực 6 chữ số, gửi qua email |
| **Signed URL** | URL xác thực email có chữ ký thời hạn 60 phút |
| **Orphan** | File Cloudinary không còn được tham chiếu trong DB |
