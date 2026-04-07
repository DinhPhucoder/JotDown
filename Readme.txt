========================================================================
    NOTE MANAGEMENT - HUONG DAN VAN HANH SAU KHI DA DEPLOY PLATFORM
========================================================================

Tai lieu nay dung cho 2 nhu cau:
1. Khoi dong du an de tiep tuc code o local.
2. Build va redeploy BE/FE sau moi lan cap nhat code len platform.



========================================================================
II. KHOI DONG DU AN O LOCAL (DEVELOPMENT)
========================================================================
1. Clone source code va di chuyen vao thu muc goc du an.

2. Chay toan bo he thong local bang Docker Compose:
   > docker compose up --build -d

3. Cai dependency backend trong container (lan dau hoac sau khi pull thay doi lon):
   > docker compose exec backend composer install

4. Tao APP_KEY va migrate du lieu local:
   > docker compose exec backend php artisan key:generate
   > docker compose exec backend php artisan migrate --seed

5. Truy cap he thong:
   - Giao dien: http://localhost
   - API qua Nginx gateway: http://localhost/api/...

6. Neu can dung lai khi restart may:
   > docker compose up -d

7. Neu can dung he thong:
   > docker compose down

========================================================================
III. BUILD VA REDEPLOY BACKEND (RENDER)
========================================================================
Backend dang deploy bang Blueprint voi file render.yaml.

1. Day code moi len nhanh da lien ket voi Render.

2. Render tu dong deploy (autoDeployTrigger: commit).

3. Migration production duoc chay tu dong boi preDeployCommand:
   php artisan migrate --force

4. Vao Render de kiem tra:
   - Service status = Live
   - Deploy log khong co Build failed / Runtime error
   - Health check /up tra ve 200

5. Cac bien moi truong secret (APP_KEY, DB_PASSWORD, ...):
   - Cai trong tab Environment cua service
   - Khong commit secret vao source code

========================================================================
IV. BUILD VA REDEPLOY FRONTEND (VERCEL)
========================================================================
1. Day code frontend len nhanh da lien ket voi Vercel.

2. Vercel se tu build voi:
   - Build command: npm run build
   - Output directory: dist

3. Dam bao bien moi truong VITE_API_BASE_URL dang tro dung URL backend production.

4. Sau deploy, test lai cac man hinh co goi API.

========================================================================
V. KHI NAO CAN DOI URL HOAC ENV
========================================================================
1. URL backend Render thuong khong doi khi redeploy code.
2. URL chi doi neu tao service moi, xoa tao lai service, hoac doi custom domain.
3. Neu URL backend doi, phai cap nhat VITE_API_BASE_URL tren Vercel va redeploy frontend.

========================================================================
VI. CHECKLIST SAU MOI LAN DEPLOY
========================================================================
1. Backend:
   - Live
   - Log sach loi
   - /up = 200

2. Frontend:
   - Deploy success
   - Trang vao duoc
   - Goi API thanh cong

3. Database:
   - Migration da chay
   - Tao/sua/xoa du lieu thu duoc

========================================================================
VII. LUU Y KHI LAM NHOM
========================================================================
1. Chi mot nguoi phu trach file deploy: render.yaml, backend/Dockerfile, env production.
2. Khong hardcode URL/secret/thong tin DB trong source code.
3. Moi thay doi schema bat buoc qua migration.
4. Dong bo version cong cu giua thanh vien:
   - Backend PHP 8.3
   - Node/NPM dong bo cho frontend
5. Lam viec theo branch rieng, merge va review truoc khi day len nhanh deploy.
6. Neu ca nhom chay cung Docker Compose local, su dung cung env template va ten service DB thong nhat.
