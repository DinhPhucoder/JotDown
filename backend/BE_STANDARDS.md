# Quy Chuẩn Phát Triển Backend (BE Standards) - Note Management Website

Tài liệu này quy định các chuẩn mực cốt lõi khi phát triển Backend (Laravel) cho dự án. **Tất cả thành viên bắt buộc phải tuân thủ** để đảm bảo code đồng nhất, dễ bảo trì và không xảy ra xung đột khi deploy lên Render/Aiven.

---

## 1. Kiến Trúc & Định Tuyến (Architecture & Routing)

* **Mô hình:** MVC kết hợp Repository Pattern (nếu logic phức tạp) hoặc giữ ở mức Controller - Model.
* **API Versioning:** Tất cả endpoint API phải được gom nhóm dưới version cụ thể trong `routes/api.php`.
  * *Ví dụ:* `Route::prefix('v1')->group(function () { ... });`
* **Naming Convention (Route):** Dùng danh từ số nhiều, lowercase, phân cách bằng dấu gạch ngang (kebab-case).
  * ✅ Đúng: `GET /api/v1/notes`, `POST /api/v1/user-profiles`
  * ❌ Sai: `GET /api/v1/getNotes`, `POST /api/v1/User_Profile`

---

## 2. Xác Thực & Phân Quyền (Authentication)

* **Công nghệ:** Sử dụng **Laravel Sanctum** (Token-based authentication).
* **Bảo mật:** Không lưu trữ trực tiếp password dạng plaintext, sử dụng `Hash::make()` của Laravel.
* **Middleware:** Các route cần bảo vệ phải sử dụng middleware `auth:sanctum`.

---

## 3. Tiêu Chuẩn Trả Về (Response Format)

Tất cả API phải trả về định dạng JSON thống nhất sử dụng **Eloquent API Resources** (`php artisan make:resource`).

**Cấu trúc chuẩn:**
```json
{
    "success": true, // true/false
    "message": "Thông báo cho FE (nếu cần)",
    "data": { ... } // Payload thực tế, object hoặc array
}
```

**Mã lỗi HTTP Status Codes:**
* `200 OK`: Thành công.
* `201 Created`: Tạo mới thành công (POST).
* `400 Bad Request`: Lỗi logic, thiếu tham số.
* `401 Unauthorized`: Lỗi xác thực (chưa login/sai token).
* `403 Forbidden`: Không có quyền truy cập.
* `404 Not Found`: Không tìm thấy tài nguyên.
* `422 Unprocessable Entity`: Lỗi Validate dữ liệu đầu vào.

---

## 4. Cơ Sở Dữ Liệu (Database Policy)

* **100% Migrations:** Tuyệt đối **KHÔNG** thao tác tay (tạo bảng, sửa cột) trên MySQL Client. Mọi thay đổi phải thông qua file Migration (`php artisan make:migration`).
* **Seeding:** Dữ liệu mẫu phải được viết trong các lớp Seeder (`php artisan make:seeder`).
* **Naming Conventions:**
  * **Table:** Số nhiều, snake_case (VD: `notes`, `user_roles`).
  * **Column:** Số ít, snake_case (VD: `title`, `created_at`).
  * **Model:** Số ít, PascalCase (VD: `Note`, `UserRole`).
* **Soft Deletes:** Ưu tiên dùng Soft Deletes (`Illuminate\Database\Eloquent\SoftDeletes`) thay vì xóa cứng dữ liệu quan trọng.

---

## 5. Quy Chuẩn Viết Code (Code Conventions)

* **Chuẩn PHP:** Tuân thủ PSR-12.
* **Biến & Hàm (PHP):** camelCase (VD: `$noteList`, `getNotes()`).
* **Validation:** Không viết logic validate rườm rà trong Controller. Sử dụng **Form Requests** (`php artisan make:request`).
  * *Ví dụ:* `public function store(StoreNoteRequest $request)`
* **Fat Models, Skinny Controllers:** Giữ Controller càng mỏng càng tốt, chỉ nhận request, gọi xử lý và trả về response. Logic nghiệp vụ đưa vào Model hoặc Service/Action classes.

---

## 6. Môi Trường & Triển Khai (Environment & Deployment)

* **CORS:** Khi test API từ FE (React Vite), nếu bị lỗi CORS, thông báo Leader để cập nhật `FRONTEND_URL` vào `config/cors.php`.
* **Biến Môi Trường:** Tuyệt đối không commit file `.env` lên Git. Khai báo các biến cần thiết vào `.env.example`.
* **Local Development:** Sử dụng môi trường Docker có sẵn trong dự án để đảm bảo tính nhất quán (DB `mysql:8.0`).

