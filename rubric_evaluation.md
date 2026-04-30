# 📊 Đánh Giá Rubric — JotDown Note Management App

> Phân tích dựa trên source code thực tế (FE: React/Vite, BE: Laravel, DB: MySQL)

---

## 🏁 Tổng Quan

| Nhóm | Điểm tối đa | Ước tính đạt | Ghi chú |
|------|-------------|-------------|---------|
| Account Management (1–8) | 2.0 | ~1.25–1.5 | Thiếu auto-login sau register, email activation chưa hoàn chỉnh |
| Simple Note Management (9–20) | 4.0 | ~3.0–3.5 | Còn bug về label backend, sharing icons |
| Advanced Note Management (21–24) | 2.0 | ~1.0–1.25 | Sharing & realtime chưa hoàn chỉnh phía BE |
| Other Requirements (25–28) | 2.0 | ~1.5 | PWA có, UI tốt, đã deploy |
| **TỔNG** | **10.0** | **~6.75–7.75** | **~68–78%** |

---

## 📋 Chi Tiết 28 Tiêu Chí

### 🔐 Account Management (2.0 pts)

| # | Tiêu chí | Điểm | Trạng thái | Phân tích |
|---|----------|------|------------|-----------|
| 1 | **User registration** | 0.25 | ✅ **~75%** | BE có `register()` + hash bcrypt ✓. Tuy nhiên sau register, FE chỉ `navigate('/login')` — **không auto-login** như yêu cầu. |
| 2 | **Account activation** | 0.25 | ⚠️ **~50%** | BE có `sendVerifyOtp()` + `verifyOtp()` → đánh dấu `email_verified_at`. FE có `OtpVerificationPage`. Nhưng **email activation link** (rubric yêu cầu link, không phải OTP) — dùng OTP thay link là sai spec. Banner "unverified" trên UI cần kiểm tra thêm. |
| 3 | **User login & logout** | 0.25 | ✅ **Full** | BE: Sanctum token, xóa token cũ khi login lại. FE: LoginPage + logout flow rõ ràng. |
| 4 | **Password reset** | 0.25 | ✅ **~75%** | BE: `forgotPassword` → OTP → `resetPassword` → xóa token + redirect login ✓. FE: `ForgotPasswordPage` + `OtpVerificationPage` + `ResetPasswordPage`. |
| 5 | **View profile & avatar** | 0.25 | ✅ **Full** | `UserProfileModal` tab "Cá nhân" hiển thị đầy đủ thông tin + avatar. |
| 6 | **Edit profile & avatar** | 0.25 | ✅ **Full** | BE: `updateProfile()` + `uploadAvatar()`. FE: upload + preview ngay lập tức. |
| 7 | **Change password** | 0.25 | ✅ **Full** | BE: `changePassword()` yêu cầu mật khẩu cũ. FE: form 3 field (current + new + confirm). |
| 8 | **User preferences** | 0.25 | ✅ **~75%** | FE: font size, màu note mặc định, light/dark theme ✓. Preferences **chỉ lưu local** (localStorage), không persist lên BE/DB — mất khi đổi thiết bị. |

---

### 📝 Simple Note Management (4.0 pts)

| # | Tiêu chí | Điểm | Trạng thái | Phân tích |
|---|----------|------|------------|-----------|
| 9 | **Display notes in list view** | 0.25 | ✅ **Full** | `viewMode` toggle list/grid có trong `NotesHeader`. `NoteGrid` hỗ trợ cả 2 chế độ. |
| 10 | **Display notes in grid view** | 0.25 | ✅ **Full** | Default là grid. Switching hoạt động tốt. |
| 11 | **Create notes** | 0.25 | ✅ **Full** | `NoteEditorModal` dùng chung cho create + edit. BE: `NoteController@store`. |
| 12 | **Update notes** | 0.25 | ✅ **Full** | **Cùng interface** create/edit ✓. BE: `NoteController@update` với version conflict detection. |
| 13 | **Delete notes** | 0.25 | ✅ **Full** | `NoteDeleteConfirmDialog` → confirm dialog bắt buộc ✓. BE: soft delete. |
| 14 | **Auto-save notes** | 0.25 | ✅ **Full** | `useEffect` với debounce 700ms khi `isDirty` → tự động gọi `onSave`. Không có nút Save. |
| 15 | **Attach images to notes** | 0.25 | ✅ **~75%** | Upload lên Cloudinary ✓, tối đa 3 ảnh ✓, preview + xóa ✓. Chỉ hoạt động khi note đã lưu lên server (local-only notes chưa support). |
| 16 | **Pin notes to top** | 0.25 | ✅ **Full** | `isPinned` + `pinnedAt` ✓. Pinned notes luôn đứng đầu, sort theo `pinnedAt` khi nhiều note pin. |
| 17 | **Search notes** | 0.25 | ✅ **Full** | `useDeferredValue` + filter theo title + content ✓. **Live search** không có nút ✓. 300ms debounce (dùng deferred value). |
| 18 | **Label management (list/add/edit/delete)** | 0.25 | ⚠️ **~50%** | FE: `NotesSidebar` có đầy đủ UI thêm/sửa/xóa label ✓. **Nhưng labels chỉ lưu local** (localStorage). BE có `LabelController` và migration nhưng API routes labels **không được bảo vệ bởi Sanctum** và FE không gọi BE cho labels. |
| 19 | **Attach labels to notes** | 0.25 | ⚠️ **~50%** | FE: attach/detach label trong `NoteEditorModal` ✓. BE: `attachLabels/detachLabels` có nhưng FE không gọi các endpoint này — labels gắn note **chỉ lưu local**. |
| 20 | **Filter notes by labels** | 0.25 | ✅ **~75%** | Filter UI hoạt động tốt ✓. Vì labels local-only nên filter cũng local — không mất dữ liệu nhưng không đồng bộ đa thiết bị. |

---

### 🔒 Advanced Note Management (2.0 pts)

| # | Tiêu chí | Điểm | Trạng thái | Phân tích |
|---|----------|------|------------|-----------|
| 21 | **Enable/disable password on notes** | 0.5 | ⚠️ **~50%** | FE: lock setup modal yêu cầu nhập 2 lần ✓, "Bỏ khóa" button ✓. **Nhưng password lưu client-side** (trong note object), không hash, không lưu lên BE. DB có `password` + `is_protected` column nhưng `NoteController` không xử lý. |
| 22 | **Password protection & change password on notes** | 0.5 | ⚠️ **~40%** | FE có giao diện đổi mật khẩu note (nhập mới, confirm) ✓. Nhưng: không yêu cầu nhập mật khẩu **cũ** khi đổi (spec yêu cầu). Toàn bộ chỉ local state. |
| 23 | **Share & receive notes** | 0.5 | ⚠️ **~40%** | FE: `NoteCollaboratorsModal` + collaborator email list ✓. `NoteShareResolver` phân biệt owned/received shared ✓. BE: có `NoteShare` model + `NoteSharedMail` + `NoteShared` event — **nhưng không có API route để share**. FE hiện hardcode email suggestions. Email notification không hoạt động. |
| 24 | **Collaboration & realtime modification** | 0.5 | ⚠️ **~50%** | BE: `NoteUpdated` event + `subscribeToNoteChannel` ✓. FE: `noteRealtime.js` subscribe WebSocket channel ✓. Tuy nhiên realtime **chỉ hoạt động cho note owner**, không cho shared recipients. Collaborative editing thực sự (multi-user cùng edit) chưa được implement đầy đủ. |

---

### 🌟 Other Requirements (2.0 pts)

| # | Tiêu chí | Điểm | Trạng thái | Phân tích |
|---|----------|------|------------|-----------|
| 25 | **UI & UX** | 0.5 | ✅ **~0.5 (Full)** | Minimalism style ✓, dark/light mode ✓, toast notifications ✓, FontAwesome + Lucide icons ✓, animations ✓, responsive layout ✓. Thiết kế đẹp, trên mức trung bình. |
| 26 | **Responsive Design** | 0.5 | ✅ **~0.5 (Full)** | Bootstrap Grid ✓, mobile sidebar Offcanvas ✓, `d-none d-lg-block` breakpoints ✓. Hoạt động tốt trên mobile/tablet/desktop. |
| 27 | **Offline Capabilities (PWA)** | 0.5 | ✅ **~0.375** | `sw.js` có cache shell + API (network-first) ✓. `manifest.webmanifest` ✓. IndexedDB offline sync queue ✓. **Nhưng**: sync khi reconnect không hoàn toàn đáng tin cậy với notes mới tạo offline (temp ID chưa map đúng). |
| 28 | **Online Deployment** | 0.5 | ✅ **~0.25–0.5** | Deploy trên Vercel (FE) + Render (BE) + Aiven (DB) ✓. Đã có HTTPS ✓. Nhưng Render free tier sleep sau 15 phút (downtime khi cold start), Aiven có thể gặp DNS issue (từ conversation log). |

---

## 🚨 Các Vấn Đề Cần Sửa (Ưu tiên)

### 🔴 Critical (mất điểm nhiều)

1. **Auto-login sau register** (ID #1): `SignupPage` redirect về `/login` thay vì tự động đăng nhập + lưu token.
2. **Label không đồng bộ BE** (ID #18, #19): Labels CRUD và label-note attachment chỉ lưu localStorage. Cần kết nối `LabelController` API.
3. **Note password không lưu BE** (ID #21, #22): `is_protected` + `password` có trong DB nhưng controller không xử lý. Password lưu plain text client-side.
4. **Share notes không có BE route** (ID #23): `NoteShared` event, `NoteShareResource`, `NoteShare` model đều có nhưng không có API route `/notes/{id}/share`.

### 🟡 Important (cải thiện điểm)

5. **Account activation = link, không phải OTP** (ID #2): Rubric nói "activation link" gửi qua email. Hiện dùng OTP — có thể bị trừ điểm.
6. **User preferences không persist lên server** (ID #8): Cần lưu preferences vào DB (có `preferences` field trong `User` model).
7. **Change note password cần nhập mật khẩu cũ** (ID #22): Theo "Better Approach" trong rubric.
8. **Offline sync reliability** (ID #27): Temp ID notes tạo offline không map đúng khi sync lại.
9. **Email notification khi share** (ID #23): `NoteSharedMail` đã có nhưng không được gửi.

### 🟢 Nice to have

10. **Special note icons** (đề cập trong 2.3): Icon chỉ thị note bị khóa/shared/pinned đã có trong `NoteCard` — cần kiểm tra hiển thị đúng trên cả list và grid view.
11. **Revoke share permissions** (ID #23): Owner có thể remove collaborator từ `NoteCollaboratorsModal` nhưng không thực sự gọi BE.

---

## 📊 Ước Tính Điểm Tổng

```
Account Mgmt:     1.25 / 2.0  (62.5%)
Simple Notes:     3.0  / 4.0  (75%)
Advanced Notes:   0.9  / 2.0  (45%)
Other Req:        1.5  / 2.0  (75%)
─────────────────────────────────────
TỔNG ƯỚC TÍNH:  ~6.65 / 10.0  (~67%)
```

> ⚠️ Con số trên là ước tính từ code review. Điểm thực tế phụ thuộc vào quan điểm của giáo viên khi chạy demo.
