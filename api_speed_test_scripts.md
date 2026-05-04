# Scripts Test Tốc Độ API CRUD (Notes & Labels)

> Sử dụng để so sánh Performance giữa Local và Production. Các script này giúp tự động hóa việc lấy ID để test chuỗi CRUD liên tục.

## 1. Thiết lập Environment trên Postman
Tạo 2 môi trường **Local** và **Production** với các biến sau:
- `baseUrl`: 
    - Local: `http://localhost:8000/api/v1` (hoặc port của nginx/docker)
    - Production: `https://your-api.render.com/api/v1`
- `token`: Token lấy từ API Login (Sanctum).

## 2. Thiết lập Headers chung
Tất cả các request dưới đây cần có:
- `Authorization`: `Bearer {{token}}`
- `Accept`: `application/json`
- `Content-Type`: `application/json`

---

## 3. API AUTH (LOGIN)

### [POST] Login để lấy Token
- **URL:** `{{baseUrl}}/auth/login`
- **Body (JSON):**
```json
{
    "email": "test@example.com",
    "password": "password"
}
```
- **Tests Script:**
```javascript
var jsonData = pm.response.json();
if (jsonData.data && jsonData.data.token) {
    pm.environment.set("token", jsonData.data.token);
    console.log("Token updated successfully!");
}

pm.test("Login Latency: " + pm.response.responseTime + "ms", () => {
    pm.response.to.have.status(200);
});
```

---

## 4. API NOTES (CRUD)

### [GET] Danh sách Note
- **URL:** `{{baseUrl}}/notes`
- **Tests Script:**
```javascript
pm.test("Status 200", () => pm.response.to.have.status(200));
console.log("Notes List Latency: " + pm.response.responseTime + "ms");
```

### [POST] Tạo Note mới
- **URL:** `{{baseUrl}}/notes`
- **Body (JSON):**
```json
{
    "title": "Speed Test Note",
    "content": "Testing latency at " + new Date().toISOString(),
    "color": "#ffffff"
}
```
- **Tests Script:**
```javascript
var jsonData = pm.response.json();
if (jsonData.data && jsonData.data.id) {
    pm.collectionVariables.set("last_note_id", jsonData.data.id);
}

pm.test("Create Note Latency: " + pm.response.responseTime + "ms", () => {
    pm.response.to.have.status(201);
});
```

### [PUT] Cập nhật Note
- **URL:** `{{baseUrl}}/notes/{{last_note_id}}`
- **Body (JSON):** 
```json
{
    "title": "Updated Title via Postman"
}
```
- **Tests Script:**
```javascript
pm.test("Update Note Latency: " + pm.response.responseTime + "ms", () => {
    pm.response.to.have.status(200);
});
```

### [DELETE] Xóa Note
- **URL:** `{{baseUrl}}/notes/{{last_note_id}}`
- **Tests Script:**
```javascript
pm.test("Delete Note Latency: " + pm.response.responseTime + "ms", () => {
    pm.response.to.have.status(200);
});
```

---

## 5. API LABELS (CRUD)

### [GET] Danh sách Label
- **URL:** `{{baseUrl}}/labels`
- **Tests Script:**
```javascript
console.log("Labels List Latency: " + pm.response.responseTime + "ms");
pm.test("Status 200", () => pm.response.to.have.status(200));
```

### [POST] Tạo Label mới
- **URL:** `{{baseUrl}}/labels`
- **Body (JSON):** 
```json
{
    "name": "Test-Label-{{$randomInt}}"
}
```
- **Tests Script:**
```javascript
var jsonData = pm.response.json();
if (jsonData.data && jsonData.data.id) {
    pm.collectionVariables.set("last_label_id", jsonData.data.id);
}
pm.test("Create Label Latency: " + pm.response.responseTime + "ms", () => {
    pm.response.to.have.status(201);
});
```

### [PUT] Cập nhật Label
- **URL:** `{{baseUrl}}/labels/{{last_label_id}}`
- **Body (JSON):** 
```json
{
    "name": "Renamed-Label"
}
```
- **Tests Script:**
```javascript
pm.test("Update Label Latency: " + pm.response.responseTime + "ms", () => {
    pm.response.to.have.status(200);
});
```

### [DELETE] Xóa Label
- **URL:** `{{baseUrl}}/labels/{{last_label_id}}`
- **Tests Script:**
```javascript
pm.test("Delete Label Latency: " + pm.response.responseTime + "ms", () => {
    pm.response.to.have.status(200);
});
```

---

## 6. Mẹo so sánh
- Mở **Postman Console** (`Ctrl + Alt + C`) để xem log chính xác thời gian từng bước.
- Sử dụng **Collection Runner** để chạy cả folder test 10-20 lần, Postman sẽ tính toán thời gian trung bình (Average Response Time) cho bạn.
- Đảm bảo đã chạy `php artisan optimize` (trên local) để có kết quả test tốc độ chính xác nhất của Laravel.
