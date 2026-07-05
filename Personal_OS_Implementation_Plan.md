# Personal OS - Technical Implementation Plan

## Vision
Một ứng dụng web dùng hằng ngày để quản lý cuộc sống.

## Tech Stack
- Frontend: Next.js + TailwindCSS + shadcn/ui + Framer Motion
- Backend: Laravel API
- Database: Supabase (PostgreSQL)
- Storage: Supabase Storage
- Cache/Queue: Redis
- Auth: Supabase Auth hoặc Laravel Sanctum + OAuth

## Kiến trúc

Frontend
  ↓
Laravel API
  ↓
Supabase PostgreSQL

---

# Cài đặt dự án (thủ công)

Thực hiện các bước dưới đây **trước khi** viết code. Mục tiêu: môi trường local chạy được Frontend + API + DB + Redis.

## Tổng quan cấu trúc thư mục (sẽ tạo)

```
personalOS/
├── frontend/          # Next.js
├── backend/           # Laravel API
├── .env.example       # (tuỳ chọn) ghi chú biến môi trường chung
└── Personal_OS_Implementation_Plan.md
```

---

## Bước 0 — Yêu cầu hệ thống

| Công cụ | Phiên bản khuyến nghị | Ghi chú |
|---------|----------------------|---------|
| Windows | 10/11 | Môi trường hiện tại |
| Git | 2.40+ | [git-scm.com](https://git-scm.com/download/win) |
| Node.js | 20 LTS hoặc 22 LTS | [nodejs.org](https://nodejs.org/) — chọn LTS |
| pnpm | 9+ | `npm install -g pnpm` (nhanh hơn npm cho monorepo) |
| PHP | 8.2 hoặc 8.3 | Cần extensions: `openssl`, `pdo`, `mbstring`, `tokenizer`, `xml`, `ctype`, `json`, `bcmath`, `fileinfo` |
| Composer | 2.x | [getcomposer.org](https://getcomposer.org/download/) |
| Redis | 7+ | Windows: dùng **Memurai** hoặc **Docker** (xem Bước 6) |
| Supabase | Tài khoản miễn phí | [supabase.com](https://supabase.com/) |

**Kiểm tra sau khi cài:**

```powershell
git --version
node --version
pnpm --version
php --version
composer --version
redis-cli --version   # hoặc bỏ qua nếu dùng Docker
```

---

## Bước 1 — Cài PHP trên Windows (nếu chưa có)

Chọn **một** trong hai cách:

### Cách A: Laravel Herd (khuyến nghị — đơn giản nhất)

1. Tải [Laravel Herd](https://herd.laravel.com/windows) và cài.
2. Herd tự cài PHP 8.3 + Composer.
3. Mở Herd → đảm bảo PHP đang **Running**.

### Cách B: Thủ công

1. Tải PHP 8.3 từ [windows.php.net](https://windows.php.net/download/).
2. Giải nén vào `C:\php`, thêm `C:\php` vào **PATH** (User environment variables).
3. Copy `php.ini-development` → `php.ini`, bật các extension cần thiết trong `php.ini`.
4. Cài Composer riêng.

---

## Bước 2 — Tạo project Supabase

1. Đăng nhập [supabase.com](https://supabase.com/) → **New project**.
2. Đặt tên: `personal-os` (hoặc tuỳ ý).
3. Chọn **Region** gần VN (ví dụ: Singapore).
4. Đặt **Database password** — **lưu lại** (dùng cho kết nối trực tiếp PostgreSQL).
5. Chờ project khởi tạo (~2 phút).

### Lấy thông tin kết nối

Vào **Project Settings → API**, ghi lại:

| Biến | Vị trí trong Supabase |
|------|------------------------|
| `SUPABASE_URL` | Project URL |
| `SUPABASE_ANON_KEY` | `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key — **chỉ dùng backend, không đưa lên frontend** |

Vào **Project Settings → Database → Connection string → URI**, ghi lại:

| Biến | Mô tả |
|------|-------|
| `DATABASE_URL` | PostgreSQL connection string (mode: Session hoặc Transaction) |

### Bật Auth (chuẩn bị cho Phase 1)

1. **Authentication → Providers** → bật **Email** (và Google nếu muốn OAuth sau).
2. **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: thêm `http://localhost:3000/**`

### Tạo Storage bucket (chuẩn bị cho Documents)

1. **Storage → New bucket** → tên `documents`, **Private**.
2. Chưa cần policy chi tiết — sẽ cấu hình khi implement.

---

## Bước 3 — Khởi tạo thư mục dự án

Mở PowerShell tại `D:\jerry\personalOS`:

```powershell
cd D:\jerry\personalOS

# Tạo .gitignore gốc (nếu chưa có)
# Bỏ qua nếu đã init git
git init
```

---

## Bước 4 — Cài đặt Laravel API (backend)

```powershell
cd D:\jerry\personalOS

# Tạo project Laravel trong thư mục backend/
composer create-project laravel/laravel backend

cd backend

# Gói cần cho MVP (cài sẵn, implement sau)
composer require laravel/sanctum
composer require predis/predis
```

### Cấu hình `.env` backend

Mở `backend\.env`, chỉnh các dòng sau:

```env
APP_NAME="Personal OS"
APP_URL=http://localhost:8000
APP_FRONTEND_URL=http://localhost:3000

# Supabase PostgreSQL — dùng connection string từ Bước 2
DB_CONNECTION=pgsql
DB_HOST=db.<project-ref>.supabase.co
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=postgres
DB_PASSWORD=<database-password>
# Hoặc dùng DATABASE_URL trực tiếp nếu Laravel hỗ trợ trong .env

# Redis
REDIS_CLIENT=predis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Queue dùng Redis
QUEUE_CONNECTION=redis
CACHE_STORE=redis

# Supabase (backend only)
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# CORS — cho phép frontend local
SANCTUM_STATEFUL_DOMAINS=localhost:3000
SESSION_DOMAIN=localhost
```

### Chạy thử API

```powershell
cd D:\jerry\personalOS\backend
php artisan key:generate
php artisan serve
```

Mở trình duyệt: `http://localhost:8000` — thấy trang Laravel welcome là OK.

> **Lưu ý:** Chưa chạy `migrate` ở bước này. Schema sẽ tạo khi implement Phase 1.

---

## Bước 5 — Cài đặt Next.js Frontend

```powershell
cd D:\jerry\personalOS

# Tạo Next.js app (App Router, TypeScript, Tailwind, ESLint)
pnpm create next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

cd frontend

# UI & animation theo tech stack
pnpm dlx shadcn@latest init
# Chọn: New York style, Zinc/Slate base color, CSS variables = yes

pnpm add framer-motion

# Supabase client (auth + storage từ frontend khi cần)
pnpm add @supabase/supabase-js @supabase/ssr
```

### Cấu hình `.env.local` frontend

Tạo `frontend\.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000

NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

### Chạy thử Frontend

```powershell
cd D:\jerry\personalOS\frontend
pnpm dev
```

Mở `http://localhost:3000` — thấy trang Next.js mặc định là OK.

---

## Bước 6 — Cài đặt Redis

Chọn **một** cách:

### Cách A: Docker (khuyến nghị nếu đã có Docker Desktop)

```powershell
docker run -d --name personal-os-redis -p 6379:6379 redis:7-alpine
```

Kiểm tra:

```powershell
docker exec personal-os-redis redis-cli ping
# Phải trả về: PONG
```

### Cách B: Memurai (native Windows, không cần Docker)

1. Tải [Memurai](https://www.memurai.com/) (Redis-compatible cho Windows).
2. Cài và chạy service — mặc định port `6379`.

### Cách C: WSL2 + Redis

```bash
# Trong WSL Ubuntu
sudo apt update && sudo apt install redis-server -y
sudo service redis-server start
redis-cli ping
```

### Xác nhận Laravel kết nối Redis

```powershell
cd D:\jerry\personalOS\backend
php artisan tinker
# Trong tinker:
>>> Illuminate\Support\Facades\Redis::ping();
# Phải trả về "+PONG" hoặc "PONG"
>>> exit
```

---

## Bước 7 — Cấu hình CORS & Sanctum (chuẩn bị auth)

Chưa implement code, nhưng **ghi nhớ** sẽ cần:

| File | Việc cần làm khi implement |
|------|---------------------------|
| `backend/config/cors.php` | `allowed_origins` = `http://localhost:3000` |
| `backend/config/sanctum.php` | `stateful` domains đã set trong `.env` |
| `frontend` | Gửi request kèm `credentials: 'include'` khi dùng cookie auth |

Hiện tại chỉ cần đảm bảo biến `SANCTUM_STATEFUL_DOMAINS` và `APP_FRONTEND_URL` đã set ở Bước 4.

---

## Bước 8 — (Tuỳ chọn) Công cụ hỗ trợ dev

### TablePlus / DBeaver — xem database Supabase

- Host: `db.<project-ref>.supabase.co`
- Port: `5432`
- User: `postgres`
- Password: database password từ Bước 2
- SSL: **Required**

### VS Code / Cursor extensions gợi ý

- PHP Intelephense
- Laravel Extension Pack
- Tailwind CSS IntelliSense
- ESLint
- Prettier

### Chạy đồng thời Frontend + API

Mở **2 terminal**:

```powershell
# Terminal 1 — API
cd D:\jerry\personalOS\backend
php artisan serve

# Terminal 2 — Frontend
cd D:\jerry\personalOS\frontend
pnpm dev
```

---

## Bước 9 — Checklist trước khi implement code

Đánh dấu khi hoàn thành:

- [ ] Git repo đã init tại `D:\jerry\personalOS`
- [ ] Supabase project đã tạo, đã lưu URL + keys + DB password
- [ ] Supabase Auth: Site URL + Redirect URLs đã cấu hình
- [ ] `backend/` — Laravel chạy được tại `http://localhost:8000`
- [ ] `backend/.env` — DB (PostgreSQL Supabase) + Redis + Supabase keys đã điền
- [ ] `frontend/` — Next.js chạy được tại `http://localhost:3000`
- [ ] `frontend/.env.local` — API URL + Supabase anon key đã điền
- [ ] shadcn/ui đã init trong `frontend/`
- [ ] Redis chạy, `php artisan tinker` → `Redis::ping()` OK
- [ ] (Tuỳ chọn) Kết nối DB bằng TablePlus/DBeaver thành công

**Khi tất cả checkbox trên xong → bắt đầu Phase 1 (Authentication, Dashboard, Quick Add, Finance, Tasks).**

---

## Lỗi thường gặp khi cài

| Triệu chứng | Nguyên nhân | Cách xử lý |
|-------------|-------------|------------|
| `could not find driver` (Laravel) | Thiếu `pdo_pgsql` | Bật extension `pdo_pgsql` trong `php.ini`, restart terminal |
| Kết nối Supabase DB timeout | Firewall / sai password | Kiểm tra password, bật SSL, thử connection string từ Supabase dashboard |
| `Redis connection refused` | Redis chưa chạy | Start Docker container / Memurai service |
| CORS error từ frontend | API chưa allow origin | Sẽ fix khi implement — tạm thời chỉ cần 2 server chạy riêng |
| `pnpm` không nhận lệnh | Chưa cài global | `npm install -g pnpm` |

---

## Core Concept

Mọi dữ liệu đều bắt đầu từ Event.

Ví dụ:
- "ăn trưa 65k" -> Expense
- "uống 2 ly nước" -> WaterLog
- "chạy 5km" -> SportSession
- "mua 12 trứng" -> Expense + Inventory

## MVP Roadmap

### Phase 1
- Authentication
- Dashboard
- Quick Add
- Finance
- Tasks

### Phase 2
- Meals
- Water Tracker
- Home Inventory
- Shopping List

### Phase 3
- Sports
- Calendar
- Notifications

### Phase 4
- CV Manager
- Job Application
- Documents

### Phase 5
- AI Parser
- AI Reports
- AI Meal Suggestion
- AI Resume Assistant

# Database

## users
- id
- email
- name
- avatar_url
- created_at

## events
- id
- user_id
- type
- source
- note
- occurred_at
- created_at

## expenses
- id
- event_id
- category_id
- amount
- payment_method
- merchant

## expense_categories
- id
- name
- icon
- color

## meals
- id
- event_id
- meal_type
- calories

## water_logs
- id
- event_id
- glasses

## sport_sessions
- id
- event_id
- sport
- distance
- duration
- calories

## inventory_items
- id
- name
- quantity
- unit
- expire_at

## shopping_items
- id
- name
- quantity
- purchased

## tasks
- id
- title
- status
- due_at

## resumes
- id
- title
- version

## documents
- id
- name
- storage_path

# Dashboard

Widgets:
- Today's Expense
- Budget
- Water
- Meals
- Sports
- Tasks
- Calendar
- Recent Events

# Quick Add

Ctrl+K hoặc ô nhập giữa Dashboard.

Ví dụ:
- cafe 35
- ăn trưa 65
- chạy 5km
- uống 2 ly nước
- mua thịt bò 250

Flow:
1. Parse text
2. Detect intent
3. Preview
4. Save
5. Tạo Event
6. Đồng bộ module liên quan

# API Structure

GET /dashboard
POST /quick-add

Expense
GET /expenses
POST /expenses
PUT /expenses/{id}
DELETE /expenses/{id}

Meals
GET /meals
POST /meals

Sports
GET /sports
POST /sports

Inventory
GET /inventory
POST /inventory

Tasks
GET /tasks
POST /tasks

CV
GET /resumes
POST /resumes

# UI Principles

- Dark mode
- Bento dashboard
- Glassmorphism nhẹ
- Framer Motion
- Responsive
- Command Palette
- Keyboard shortcuts

# Future

- PWA
- Offline mode
- Push notification
- OCR hóa đơn
- Đồng bộ Google Calendar
- AI Coach
- AI Finance Advisor
