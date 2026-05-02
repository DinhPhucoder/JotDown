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
| Framework UI | **React 19**|
| Styling | **Bootstrap 5.3**|
| WebSocket Client | **Laravel Echo** + **Pusher JS** |
| HTTP Client | Fetch API (qua service layer) |

### 2.2 Backend

| Thành phần | Công nghệ |
|---|---|
| Framework | **Laravel 13** (PHP 8.3) |
| Authentication | **Laravel Sanctum 4** (token-based) |
| Broadcasting | **Pusher** |
| Email Service | **Resend** |
| File Storage | **Cloudinary**|

### 2.3 Database

| Thành phần | Công nghệ |
|---|---|
| CSDL chính | **MySQL** (hosted trên **Aiven**) |
| CSDL cục bộ | **IndexedDB** (JavaScript, hỗ trợ offline) |
| Migrations | Laravel Migrations (100% schema được quản lý) |
| Stored Logic | DB Functions, Procedures, Triggers |
| ORM | **Eloquent ORM** |

### 2.4 Hạ tầng & Triển khai

| Dịch vụ | Nền tảng |
|---|---|
| Frontend | **Vercel** |
| Backend API | **Render** |
| Database | **Aiven** (MySQL cloud) |
| Containerization | **Docker** + **Docker Compose** (môi trường dev & prod) |
| Reverse Proxy | **Nginx** |

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


