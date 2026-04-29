# Thiet ke: Note attachments (Cloudinary signed upload)

## Tong quan
Xay dung luong upload anh dinh kem cho note bang Cloudinary signed upload. FE xin signature tu BE, upload truc tiep len Cloudinary, sau do goi BE luu URL vao bang `note_attachments`.

## Muc tieu
- Cho phep owner va nguoi duoc share quyen EDIT upload anh dinh kem.
- Gioi han 3 anh / note, tong dung luong toi da 15MB.
- Chi chap nhan dinh dang .jpg, .jpeg, .png.
- Luu metadata can thiet vao `note_attachments`.

## Khong pham vi
- Upload file ngoai hinh anh.
- Xoa attachment (se de giai doan sau neu can).
- Client-side image processing.

## Doi tuong du lieu
- Bang: `note_attachments`
  - `note_id`, `file_url`, `attachment_kind`, `original_name`, `file_type`, `file_size`.

## Auth va quyen
- Owner note hoac nguoi duoc share quyen EDIT moi duoc:
  - Lay signature.
  - Luu attachment.

## API
1) POST /api/v1/notes/{note}/attachments/signature
- Auth: owner + EDIT share
- Tra ve:
  - `signature`, `timestamp`, `api_key`, `cloud_name`, `folder`

2) POST /api/v1/notes/{note}/attachments
- Auth: owner + EDIT share
- Body:
  - `file_url`, `file_size`, `file_type`, `original_name`
- Validate:
  - Tong so anh hien co + 1 <= 3
  - Tong dung luong hien co + file_size <= 15MB
  - file_type thuoc [image/jpeg, image/png]
  - file_url la Cloudinary secure_url va dung folder
- Luu vao DB va tra ve du lieu attachment.

## Luong xu ly
1. FE goi signature.
2. BE tra signature + timestamp.
3. FE upload signed len Cloudinary.
4. FE nhan `secure_url`, `bytes`, `format`, `original_filename`.
5. FE goi API luu DB.

## Cau hinh
- ENV:
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`
  - `CLOUDINARY_FOLDER`

## Error handling
- 403: khong co quyen.
- 422: vuot gioi han so anh / dung luong / sai dinh dang / URL khong hop le.

## Security
- Signed upload, signature het han (timestamp).
- Verify URL thuoc Cloudinary, dung folder.
- Khong hardcode API keys.

## Testing
- Owner upload thanh cong.
- Share EDIT upload thanh cong.
- Share READ bi chan.
- Vuot 3 anh bi chan.
- Tong dung luong > 15MB bi chan.
- Sai dinh dang bi chan.
- URL khong thuoc Cloudinary bi chan.
