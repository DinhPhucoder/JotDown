# Huong Dan Deploy (Render + Vercel)

## 1) Backend tren Render

### Cach A - Blueprint (khuyen nghi)
1. Day code len GitHub.
2. Trong dashboard Render, chon New > Blueprint.
3. Chon repository nay. Render se doc file render.yaml o thu muc goc.
4. Dien day du cac bien moi truong duoc danh dau sync: false.
5. Sau lan deploy dau tien, mo Render Shell va chay:
   php artisan migrate --force

### Cach B - Tao Web Service thu cong
1. Tao Web Service moi tu thu muc/repo backend.
2. Lenh build:
   composer install --no-dev --optimize-autoloader && php artisan config:cache && php artisan route:cache && php artisan view:cache
3. Lenh start:
   php artisan serve --host=0.0.0.0 --port=$PORT
4. Them day du bien moi truong production theo file backend/.env.production.example.
5. Chay migration:
   php artisan migrate --force

## 2) Frontend tren Vercel
1. Import du an frontend len Vercel.
2. Framework preset: Vite.
3. Build command: npm run build
4. Output directory: dist
5. Them bien moi truong:
   VITE_API_BASE_URL=https://your-backend-domain.onrender.com
6. Deploy va kiem tra frontend goi duoc backend API.

## 3) Chien luoc co so du lieu
- Moi truong local khi phat trien: tiep tuc dung MySQL localhost.
- Moi truong production: chi dung MySQL tren Aiven.
- Khong hardcode thong tin DB trong source code.
- Chay migration tren production truoc khi phat hanh chinh thuc.

## 4) Checklist truoc khi release
- APP_DEBUG=false tren production.
- APP_URL la URL backend production.
- FRONTEND_URL la URL frontend production.
- CORS chi cho phep domain frontend production.
- Test smoke API va DB dat ket qua tot sau khi deploy.
