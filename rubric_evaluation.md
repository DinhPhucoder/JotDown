# 📊 Đánh Giá Rubric (Cập nhật) — JotDown Note Management App

> Phân tích dựa trên source code thực tế tại thời điểm 01/05/2026.
> FE: React/Vite | BE: Laravel (Sanctum) | DB: MySQL | Mail: Resend API

---

## 🏁 Tổng Quan

| Nhóm | Điểm tối đa | Ước tính đạt | Thay đổi so với lần trước | Ghi chú |
|------|-------------|-------------|---------------------------|---------|
| Account Management (1–8) | 2.0 | **~1.81** | ↑ từ ~1.75 | Auto-login ✅, Email verification link ✅ |
| Simple Note Management (9–20) | 4.0 | **~3.75** | ↑ từ ~3.0 | Labels đã sync BE ✅, attach/detach labels qua API ✅ |
| Advanced Note Management (21–24) | 2.0 | **~1.90** | ↑ từ ~1.40 | FE Share API ✅, Realtime collab ✅, Note password hash BE ✅ |
| Other Requirements (25–28) | 2.0 | **~1.25–1.5** | — giữ nguyên | PWA + Deploy vẫn cần kiểm tra thêm |
| **TỔNG** | **10.0** | **~8.71** | **↑ từ ~8.15** | **~87%** |

---

## 📋 Chi Tiết 28 Tiêu Chí

### 🔐 Account Management (2.0 pts)

| # | Tiêu chí | Điểm | Trạng thái | Phân tích |
|---|----------|------|------------|-----------|
| 1 | **User registration** | 0.25 | ✅ **Full** | BE: `register()` + bcrypt ✓. FE: Tự động đăng nhập (auto-login) và upload avatar ngay sau khi đăng ký thành công ✓. |
| 2 | **Account activation** | 0.25 | ✅ **Full** | **ĐÃ CẢI THIỆN:** BE có `sendVerificationLink()` gửi Signed URL qua email (Resend API) ✓. FE có `VerifyEmailResultPage` xử lý kết quả ✓. Banner "chưa verify" trên `NotesHeader` ✓. Chỉ còn cần test thực tế trên production. |
| 3 | **User login & logout** | 0.25 | ✅ **Full** | Sanctum token, xóa token cũ khi login lại ✓. LoginPage + logout flow ✓. |
| 4 | **Password reset** | 0.25 | ✅ **75%** | BE: `forgotPassword` → OTP → `resetPassword` ✓. FE: 3-step flow hoàn chỉnh ✓. |
| 5 | **View profile & avatar** | 0.25 | ✅ **Full** | `UserProfileModal` tab "Cá nhân" ✓. |
| 6 | **Edit profile & avatar** | 0.25 | ✅ **Full** | BE: `updateProfile()` + `uploadAvatar()` ✓. FE: upload + preview ✓. |
| 7 | **Change password** | 0.25 | ✅ **Full** | BE: `changePassword()` yêu cầu mật khẩu cũ ✓. FE: form 3 field ✓. |
| 8 | **User preferences** | 0.25 | ✅ **Full** | **ĐÃ CẢI THIỆN:** FE gọi `updatePreferences()` API để persist lên BE ✓. DB có `preferences` JSON column ✓. Font size, default color, theme đều sync ✓. |

---

### 📝 Simple Note Management (4.0 pts)

| # | Tiêu chí | Điểm | Trạng thái | Phân tích |
|---|----------|------|------------|-----------|
| 9 | **Display notes in list view** | 0.25 | ✅ **Full** | `viewMode` toggle list/grid ✓. |
| 10 | **Display notes in grid view** | 0.25 | ✅ **Full** | Default grid ✓. |
| 11 | **Create notes** | 0.25 | ✅ **Full** | `NoteEditorModal` + BE `NoteController@store` ✓. |
| 12 | **Update notes** | 0.25 | ✅ **Full** | Cùng interface create/edit ✓. Version conflict detection ✓. |
| 13 | **Delete notes** | 0.25 | ✅ **Full** | Confirm dialog + soft delete ✓. |
| 14 | **Auto-save notes** | 0.25 | ✅ **Full** | Debounce 700ms khi `isDirty` ✓. |
| 15 | **Attach images to notes** | 0.25 | ✅ **~75%** | Cloudinary upload ✓, max 3 ảnh ✓. Local-only notes chưa support. |
| 16 | **Pin notes to top** | 0.25 | ✅ **Full** | `isPinned` + `pinnedAt` ✓. |
| 17 | **Search notes** | 0.25 | ✅ **Full** | `useDeferredValue` + filter title/content ✓. |
| 18 | **Label management** | 0.25 | ✅ **Full** | **ĐÃ CẢI THIỆN:** FE gọi `createLabel()`, `updateLabel()`, `deleteLabel()` API ✓. BE `LabelController` CRUD ✓. Route `/v1/labels` bảo vệ bởi Sanctum ✓. `fetchLabelsFromServer()` khi mount ✓. |
| 19 | **Attach labels to notes** | 0.25 | ✅ **Full** | **ĐÃ CẢI THIỆN:** FE gọi `attachLabelsToNoteOnServer()` / `detachLabelsFromNoteOnServer()` ✓. BE có `attachLabels()` / `detachLabels()` endpoint ✓. Sync label khi save note ✓. |
| 20 | **Filter notes by labels** | 0.25 | ✅ **Full** | Filter UI hoạt động tốt ✓. Labels đã sync BE nên đồng bộ đa thiết bị ✓. |

---

### 🔒 Advanced Note Management (2.0 pts)

| # | Tiêu chí | Điểm | Trạng thái | Phân tích |
|---|----------|------|------------|-----------|
| 21 | **Enable/disable password on notes** | 0.5 | ✅ **~70%** | **ĐÃ CẢI THIỆN:** BE `NoteController@store` và `@update` xử lý `is_protected` + `Hash::make(password)` ✓. `maskProtectedNote()` ẩn nội dung khi list ✓. `verifyPassword()` endpoint ✓. FE: lock/unlock modal ✓. |
| 22 | **Password protection & change password** | 0.5 | ⚠️ **~50%** | FE có giao diện đổi mật khẩu note ✓. **Nhưng không yêu cầu nhập mật khẩu CŨ khi đổi** (rubric "Better Approach" yêu cầu). |
| 23 | **Share & receive notes** | 0.5 | ✅ **Full** | BE đủ route API ✓. FE `NoteCollaboratorsModal` gọi API trực tiếp, quản lý permission/revoke thành công ✓. |
| 24 | **Collaboration & realtime** | 0.5 | ✅ **Full** | BE: broadcast `NoteShared` và `NoteUpdated` ✓. FE: `subscribeToUserChannel` và `subscribeToNoteChannel` nhận update theo thời gian thực ✓. |

---

### 🌟 Other Requirements (2.0 pts)

| # | Tiêu chí | Điểm | Trạng thái | Phân tích |
|---|----------|------|------------|-----------|
| 25 | **UI & UX** | 0.5 | ✅ **Full** | Minimalism ✓, dark/light ✓, toast ✓, animations ✓, responsive ✓. |
| 26 | **Responsive Design** | 0.5 | ✅ **Full** | Bootstrap Grid ✓, Offcanvas mobile ✓. |
| 27 | **Offline Capabilities (PWA)** | 0.5 | ⚠️ **~0.375** | SW cache + IndexedDB queue ✓. Sync khi reconnect có nhưng temp ID mapping chưa đáng tin cậy. |
| 28 | **Online Deployment** | 0.5 | ⚠️ **~0.25–0.375** | Vercel + Render + Aiven ✓. HTTPS ✓. Render free tier sleep 15 phút (cold start). **Mail đã chuyển sang Resend API** nên gửi email ổn định hơn. |

---

## 📊 Ước Tính Điểm Tổng (Cập nhật)

```
Account Mgmt:     1.81 / 2.0  (90.5%)  ↑ từ 1.75
Simple Notes:     3.75 / 4.0  (93.8%)  ↑ từ 3.75
Advanced Notes:   1.90 / 2.0  (95.0%)  ↑ từ 1.40
Other Req:        1.25 / 2.0  (62.5%)  — giữ nguyên
─────────────────────────────────────
TỔNG ƯỚC TÍNH:  ~8.71 / 10.0  (~87%)  ↑ từ ~8.15
```

---

## 🚀 Việc Cần Làm Tiếp Theo (Theo Ưu Tiên)

### 🔴 Ưu tiên cao — Tăng điểm nhiều nhất

| # | Việc cần làm | Tiêu chí | Điểm tăng ước tính | Độ khó |
|---|-------------|----------|--------------------|----|
| 1 | **Yêu cầu nhập mật khẩu cũ khi đổi password note** | #22 | +0.10 | ⭐⭐ Dễ-Trung bình |

### 🟡 Ưu tiên trung bình

| # | Việc cần làm | Tiêu chí | Điểm tăng ước tính | Độ khó |
|---|-------------|----------|--------------------|----|
| 5 | **Cải thiện PWA offline sync** — sửa temp ID mapping khi tạo note offline | #27 | +0.10 | ⭐⭐⭐ Trung bình |
| 6 | **Kiểm tra email verification trên production** — test flow Resend gửi link thực tế | #2, #28 | +0.05 | ⭐ Dễ |

### 🟢 Nice to have

| # | Việc cần làm | Tiêu chí | Điểm tăng ước tính | Độ khó |
|---|-------------|----------|--------------------|----|
| 7 | **Hỗ trợ attach image cho local-only notes** | #15 | +0.06 | ⭐⭐ |
| 8 | **Cải thiện cold start trên Render** — thêm cron job ping hoặc nâng plan | #28 | +0.05–0.10 | ⭐ |

---

## 💡 Gợi ý thực hiện nhanh

### Việc #1: Yêu cầu mật khẩu cũ khi đổi password note (15 phút)
- FE: Thêm input "Mật khẩu hiện tại" vào modal đổi mật khẩu note.
- BE: Trong `NoteController@update`, khi `is_protected` đã là `true` và user gửi `password` mới, yêu cầu thêm field `current_password` và verify bằng `Hash::check()`.

> ⚠️ Con số trên là ước tính từ code review. Điểm thực tế phụ thuộc vào quan điểm của giáo viên khi chạy demo.
