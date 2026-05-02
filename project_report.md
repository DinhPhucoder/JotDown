# 📝 Báo cáo Tổng quan Dự án — Note Management Website
> Môn học: 503073 – Lập Trình Web & Ứng Dụng | Đồ Án Cuối Kỳ HK II/2024-2025

---

## 1. Tổng quan

**Note Management Website** là ứng dụng web quản lý ghi chú toàn diện, cho phép người dùng tạo, tổ chức, bảo mật và chia sẻ ghi chú theo thời gian thực. Dự án tuân thủ đầy đủ 28 tiêu chí đánh giá của đề bài, bao gồm quản lý tài khoản, ghi chú cơ bản và nâng cao, giao diện responsive, hỗ trợ offline (PWA) và triển khai online công khai.

---

## 2. Công nghệ sử dụng

### 2.1 Frontend

| Thành phần | Công nghệ |
|---|---|
| Framework UI | **React 19** (Vite 8) |
| Styling | **Bootstrap 5.3** + Tailwind CSS 4 + Vanilla CSS |
| Rich-text Editor | **Tiptap 3** (ProseMirror-based) |
| Animation | **Framer Motion 12** + GSAP 3 |
| WebSocket Client | **Laravel Echo** + **Pusher JS** |
| Icon Library | **FontAwesome 7** |
| Routing | React Router v7 |
| Layout Grid | react-masonry-css |
| Toast Notification | Sonner |
| HTTP Client | Fetch API (qua service layer) |
| Build Tool | Vite 8 |

### 2.2 Backend

| Thành phần | Công nghệ |
|---|---|
| Framework | **Laravel 13** (PHP 8.3) |
| Authentication | **Laravel Sanctum 4** (token-based) |
| Broadcasting | **Pusher** (via `pusher/pusher-php-server`) |
| Email Service | **Resend** (`resend/resend-laravel`) |
| File Storage | **Cloudinary** (upload ảnh đính kèm & avatar) |
| Testing | **PHPUnit 12** |

### 2.3 Database

| Thành phần | Công nghệ |
|---|---|
| CSDL chính | **MySQL** (hosted trên **Aiven**) |
| CSDL cục bộ | **IndexedDB** (JavaScript, hỗ trợ offline) |
| Migrations | Laravel Migrations (100% schema được quản lý) |
| Stored Logic | DB Functions, Procedures, Triggers |

### 2.4 Hạ tầng & Triển khai

| Dịch vụ | Nền tảng |
|---|---|
| Frontend | **Vercel** |
| Backend API | **Render** |
| Database | **Aiven** (MySQL cloud) |
| Containerization | **Docker** + **Docker Compose** (môi trường dev & prod) |
| Reverse Proxy | **Nginx** |
| CI/CD | GitHub Actions |

---

## 3. Kiến trúc ứng dụng

### 3.1 Mô hình tổng thể

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                      │
│                                                              │
│  React 19 SPA (Vercel)                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │  pages/  │  │features/ │  │services/ │  │  hooks/    │  │
│  │NotesPage │  │  auth/   │  │Realtime  │  │useNote...  │  │
│  │  ...     │  │  notes/  │  │OfflineSync│  │useWorkspace│  │
│  └──────────┘  │ profile/ │  │WorkspaceSt│  └────────────┘  │
│                └──────────┘  └──────────┘                   │
│                     │              │                         │
│            IndexedDB (PWA)   Laravel Echo (WS)               │
└────────────────┬────────────────────┬────────────────────────┘
                 │                    │
          REST API (HTTPS)     WebSocket / Pusher
                 │                    │
┌────────────────▼────────────────────▼────────────────────────┐
│                   BACKEND (Laravel 13 — Render)               │
│                                                               │
│  Routes: /api/v1/...                                          │
│  ┌────────────┐ ┌─────────────┐ ┌─────────────────────────┐  │
│  │AuthController│ │NoteController│ │NoteShareController       │  │
│  │LabelController││AttachmentCtrl│ │SyncController           │  │
│  └────────────┘ └─────────────┘ └─────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐   │
│  │             Eloquent ORM  (Models)                      │   │
│  │  User │ Note │ Label │ NoteAttachment │ NoteShare       │   │
│  │  SyncQueue                                              │   │
│  └──────────────────────────┬─────────────────────────────┘   │
│                             │        Events: NoteUpdated       │
│                  Pusher Broadcast  NoteShared / NoteRevoked    │
└─────────────────────────────┬────────────────────────────────┘
                              │
                  ┌───────────▼───────────┐
                  │   MySQL (Aiven Cloud)  │
                  │ Tables: users, notes,  │
                  │ labels, note_labels,   │
                  │ note_attachments,      │
                  │ note_shares, sync_queue│
                  └───────────────────────┘
```

### 3.2 Kiến trúc Frontend (Feature-based)

```
frontend/src/
├── pages/           # Route-level pages (NotesPage, LandingPage...)
├── features/
│   ├── auth/        # Đăng nhập, đăng ký, reset password
│   ├── notes/       # CRUD ghi chú, editor, share panel
│   └── profile/     # Hồ sơ người dùng, avatar, preferences
├── components/
│   ├── common/      # Shared UI components
│   └── landing/     # Landing page components
├── services/
│   ├── noteRealtime.js    # Laravel Echo + Pusher (WebSocket)
│   ├── noteOfflineSync.js # IndexedDB wrapper (offline cache)
│   ├── workspaceStorage.js# Local state persistence
│   └── registerServiceWorker.js
├── hooks/           # Custom React hooks (useNoteWorkspace, useNoteDraft...)
└── utils/           # Helper functions
```

### 3.3 Kiến trúc Backend (MVC — Laravel)

```
backend/app/
├── Http/
│   ├── Controllers/
│   │   ├── Api/V1/AuthController.php      # Auth endpoints
│   │   ├── NoteController.php             # CRUD ghi chú + password lock
│   │   ├── NoteShareController.php        # Chia sẻ ghi chú
│   │   ├── LabelController.php            # Quản lý nhãn
│   │   ├── NoteAttachmentController.php   # Đính kèm ảnh
│   │   ├── SyncController.php             # Offline sync (push/pull)
│   │   └── AttachmentSignatureController  # Cloudinary signature
│   ├── Requests/   # Form Requests (validation)
│   └── Resources/  # API Resources (JSON response shaping)
├── Models/
│   ├── User.php             # Sanctum + email verify + OTP
│   ├── Note.php             # Soft deletes, password hash
│   ├── Label.php
│   ├── NoteAttachment.php   # Cloudinary URL
│   ├── NoteShare.php        # permission: READ | WRITE
│   └── SyncQueue.php        # Offline sync queue
├── Events/
│   ├── NoteUpdated.php      # Broadcast realtime edit
│   ├── NoteShared.php       # Broadcast share notification
│   ├── NoteRevoked.php      # Broadcast revoke notification
│   └── UserJoinedNote.php
├── Policies/        # Authorization policies
├── Services/
│   └── CloudinaryAttachmentService.php
└── Mail/            # Mailable (verify email, share notification)
```

---

## 4. Các chức năng nổi bật

### 4.1 Quản lý tài khoản
- ✅ **Đăng ký / Đăng nhập / Đăng xuất** — Sanctum token, auto-login sau register
- ✅ **Xác thực email** — Gửi link signed URL hoặc OTP qua email (Resend)
- ✅ **Đặt lại mật khẩu** — Nhập OTP từ email trước khi đặt mật khẩu mới
- ✅ **Đổi mật khẩu** — Yêu cầu nhập mật khẩu cũ trước khi thay đổi
- ✅ **Hồ sơ & Avatar** — Xem/chỉnh sửa thông tin, upload ảnh lên Cloudinary
- ✅ **Tùy chọn người dùng** — Cỡ chữ, màu ghi chú, dark/light mode

### 4.2 Quản lý ghi chú cơ bản
- ✅ **Grid view / List view** — Chuyển đổi linh hoạt, masonry layout
- ✅ **Tạo & Chỉnh sửa** — Cùng một modal editor (Tiptap), không tách màn hình
- ✅ **Tự động lưu** — Autosave sau mỗi thay đổi, không cần nhấn "Lưu"
- ✅ **Xóa có xác nhận** — Hộp thoại confirm trước khi xóa
- ✅ **Đính kèm ảnh** — Upload nhiều ảnh, lưu Cloudinary, xem inline trong editor
- ✅ **Ghim ghi chú** — Ghi chú ghim luôn hiển thị đầu, sắp theo thứ tự ghim
- ✅ **Live search** — Tìm kiếm real-time theo tiêu đề & nội dung, debounce 300ms
- ✅ **Quản lý nhãn** — CRUD nhãn, gắn/bỏ nhãn, lọc ghi chú theo nhãn
- ✅ **Biểu tượng trạng thái** — Icon nhận biết ghi chú ghim / bảo vệ / chia sẻ ở cả hai view

### 4.3 Quản lý ghi chú nâng cao
- ✅ **Khóa ghi chú bằng mật khẩu** — Mỗi ghi chú có password riêng (hash bcrypt), yêu cầu nhập password trước khi xem/sửa/xóa
- ✅ **Đổi / Tắt mật khẩu ghi chú** — Phải nhập password cũ, nhập mới 2 lần để xác nhận
- ✅ **Chia sẻ ghi chú** — Chia sẻ qua email đã đăng ký, chọn quyền `READ` hoặc `WRITE`, chia sẻ cho nhiều người
- ✅ **Thu hồi / Thay đổi quyền chia sẻ** — Chủ sở hữu xem danh sách người nhận, cập nhật hoặc revoke từng người
- ✅ **Khu vực "Shared with me"** — Hiển thị ghi chú được chia sẻ kèm thông tin người chia sẻ, timestamp, quyền truy cập
- ✅ **Cộng tác thời gian thực (WebSocket)** — Ghi chú `WRITE` hỗ trợ nhiều người chỉnh sửa đồng thời qua Pusher/Laravel Echo, broadcast sự kiện `NoteUpdated`

### 4.4 Yêu cầu bổ sung
- ✅ **Responsive Design** — Bootstrap Grid, tối ưu smartphone / tablet / desktop
- ✅ **Offline (PWA)** — IndexedDB cache ghi chú khi offline; sync queue push/pull khi có mạng trở lại
- ✅ **Online Deployment** — Frontend (Vercel) + Backend (Render) + Database (Aiven), HTTPS đầy đủ
- ✅ **Docker Compose** — Có thể chạy toàn bộ stack cục bộ qua Docker

---

## 5. Schema Database

| Bảng | Mô tả |
|---|---|
| `users` | Tài khoản người dùng, password hash, OTP, email verify |
| `notes` | Ghi chú (title, content, is_pinned, is_protected, password_hash, soft delete) |
| `labels` | Nhãn thuộc về user |
| `note_labels` | Quan hệ nhiều-nhiều note ↔ label |
| `note_attachments` | URL ảnh đính kèm (Cloudinary) |
| `note_shares` | Chia sẻ ghi chú (owner, recipient, permission: READ/WRITE) |
| `sync_queue` | Hàng đợi đồng bộ offline (action: CREATE/UPDATE/DELETE) |
| `personal_access_tokens` | Sanctum tokens |

---

## 6. Luồng thực thi chính (Key Flows)

### Offline Sync Flow
```
User offline → Thao tác ghi chú → IndexedDB (enqueueSyncChange)
     ↓
Network restored → SyncController.push() → Áp dụng queue
     ↓
SyncController.pull() → Kéo thay đổi mới từ server → cacheNotes()
```

### Real-time Collaboration Flow
```
User A chỉnh sửa ghi chú (WRITE) → Autosave → API PATCH /notes/{id}
     ↓
NoteController → NoteUpdated event → Pusher broadcast
     ↓
User B (đang mở ghi chú) → Laravel Echo nhận .NoteUpdated
     ↓
Frontend cập nhật state → Editor re-render nội dung mới
```

### Note Sharing Flow
```
Owner → POST /api/v1/notes/{id}/share → NoteShareController
     ↓
Tạo NoteShare record → NoteShared event → Pusher broadcast user.{id}
     ↓
Recipient nhận real-time notification → "Shared with me" panel cập nhật
```

---

## 7. Điểm kỹ thuật nổi bật

| Điểm mạnh | Chi tiết |
|---|---|
| **Architecture clean** | Feature-based frontend, Skinny Controller + Service layer backend |
| **Security** | Password hash bcrypt (user & note), Sanctum token, Authorization Policies, Signed URL email |
| **Realtime first** | Toàn bộ sharing/collaboration qua Pusher WebSocket, không cần polling |
| **Offline-first** | IndexedDB + sync queue 2 chiều (push/pull) với cursor tracking |
| **Cloud storage** | Cloudinary cho tất cả media (avatar, note images), 5MB upload limit |
| **DB integrity** | Stored procedures, triggers, soft deletes đảm bảo toàn vẹn dữ liệu |
| **Email service** | Resend API cho verify email, OTP reset password, share notification |
| **Testing** | PHPUnit 12, test Feature + Unit layer (27 test symbols) |
