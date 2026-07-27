# PRISKILA - Project Inventory Stock & Logistics Application

PRISKILA adalah aplikasi pergudangan dan logistik berbasis monorepo yang menggabungkan SPA modern (Next.js 16) dengan REST API yang tangguh (Laravel 13). Dirancang untuk kebutuhan enterprise dengan arsitektur clean, scalable, dan production-ready.

---

## Daftar Isi

- [Struktur Monorepo](#struktur-monorepo)
- [Tech Stack](#tech-stack)
- [Persyaratan Sistem](#persyaratan-sistem)
- [Cara Menjalankan](#cara-menjalankan)
- [Fitur yang Sudah Dibangun](#fitur-yang-sudah-dibangun)
- [Arsitektur Aplikasi](#arsitektur-aplikasi)
- [Shared Packages](#shared-packages)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Color Palette & Design System](#color-palette--design-system)
- [Roadmap & Status Sprint](#roadmap--status-sprint)
- [Future Modules](#future-modules)
- [Git Workflow](#git-workflow)
- [Panduan Pengembangan](#panduan-pengembangan)
- [Lisensi](#lisensi)

---

## Struktur Monorepo

```
priskila/
├── frontend/               # Next.js 16 SPA (Frontend)
│   └── src/
│       ├── app/
│       │   ├── (dashboard)/    # Protected dashboard pages
│       │   │   ├── dashboard/
│       │   │   ├── projects/
│       │   │   ├── barang/
│       │   │   ├── suppliers/
│       │   │   ├── warehouses/
│       │   │   ├── barang-masuk/
│       │   │   ├── pemakaian-barang/
│       │   │   ├── inventory/
│       │   │   │   ├── transfers/
│       │   │   │   ├── adjustments/
│       │   │   │   └── opname/
│       │   │   ├── reports/
│       │   │   │   └── turnover/
│       │   │   ├── settings/
│       │   │   └── profile/
│       │   └── login/
│       └── hooks/
├── packages/
│   ├── ui/                 # Shared Design System (reusable components)
│   ├── api/                # Shared Axios API Client
│   └── types/              # Shared TypeScript Types
├── backend/                # Laravel 13 REST API
│   ├── app/
│   │   ├── Http/Controllers/Api/
│   │   └── Models/
│   ├── database/migrations/
│   └── routes/api.php
└── docs/                   # Project documentation
```

---

## Tech Stack

### Frontend

| Teknologi    | Versi / Detail               |
| ------------ | ---------------------------- |
| Next.js      | 16 (App Router)              |
| React        | 19                           |
| TypeScript   | Strict mode                  |
| TailwindCSS  | Utility-first CSS            |
| Lucide React | Icon library                 |
| Axios        | HTTP client (shared package) |

### Backend

| Teknologi         | Versi / Detail               |
| ----------------- | ---------------------------- |
| Laravel           | 13                           |
| Laravel Sanctum   | Token-based authentication   |
| Spatie Permission | Role & permission management |
| MySQL             | Relational database          |

### Shared Packages (Monorepo)

| Package           | Deskripsi                                  |
| ----------------- | ------------------------------------------ |
| `@priskila/ui`    | Reusable UI components (Button, Card, etc) |
| `@priskila/api`   | Centralized Axios API client               |
| `@priskila/types` | Shared TypeScript type definitions         |

---

## Persyaratan Sistem

- PHP >= 8.3
- Composer
- Node.js >= 20.x
- MySQL (sesuai konfigurasi `.env`)
- npm (monorepo workspace)

---

## Cara Menjalankan

### Cara Cepat (Menjalankan Backend & Frontend Bersamaan)

Untuk menjalankan backend (Laravel) dan frontend (Next.js) secara bersamaan menggunakan satu perintah dari root directory:

```bash
npm run dev
```

Ini akan otomatis:

- Menjalankan Backend (`php artisan serve` di `http://localhost:8000`)
- Menjalankan Frontend (`npm run dev:web` di `http://localhost:3000`)
- Menggabungkan logs ke dalam satu terminal dengan label warna: `[Backend]` (biru) dan `[Frontend]` (hijau).
- Menangani terminasi bersih kedua server saat Anda menekan `Ctrl + C`.

---

### Cara Manual (Menjalankan Terpisah)

#### 1. Menjalankan Backend Laravel

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve
```

Backend API berjalan di `http://localhost:8000`.

#### 2. Menjalankan Frontend Next.js

```bash
# dari root directory
npm install --ignore-scripts
npm run dev:web
```

Frontend berjalan di `http://localhost:3000`.

### 3. Akun Default (Seeder)

| Role          | Email              | Password |
| ------------- | ------------------ | -------- |
| Administrator | admin@priskila.com | password |
| Staff         | staff@priskila.com | password |

---

## Fitur yang Sudah Dibangun

### Sprint 1 — Authentication & Layout

- **Login Page** — Landing page dengan form login, dark mode support
- **Authentication** — Laravel Sanctum token-based auth
- **Two-Factor Authentication (2FA)** — Enable/disable, QR code, verify
- **Dashboard Layout** — Responsive sidebar (collapsible), top navbar, breadcrumb
- **Dark Mode** — Toggle tema terang/gelap
- **Profile** — Halaman profil pengguna
- **Notification** — Bell icon dengan badge indicator

### Sprint 2 — Master Project

- **CRUD Project** — Create, Read, Update, Delete
- **Search** — Filter data berdasarkan keyword
- **Pagination** — Server-side pagination
- **Auto Code Generation** — `PRJ-YYYY-NNN` format otomatis

### Sprint 3 — Master Barang

- **CRUD Barang** — Create, Read, Update, Delete
- **SKU & Barcode** — Kode SKU dan barcode per barang
- **Kategori & Satuan** — Pengelompokan barang
- **Minimum Stock** — Threshold alert untuk stok rendah
- **Image** — URL gambar barang

### Sprint 4 — Supplier

- **CRUD Supplier** — Create, Read, Update, Delete
- **Search** — Filter data supplier
- **Auto Code Generation** — `SUP-YYYY-NNN` format otomatis

### Sprint 5 — Barang Masuk

- **Header-Detail Transaction** — Dokumen masuk dengan detail item
- **Dynamic Row** — Tambah/hapus baris item
- **Stock Update** — Otomatis update stock ledger saat barang masuk
- **Attachment** — Upload lampiran dokumen
- **Supplier & Project Link** — Relasi ke supplier dan project
- **Auto Code Generation** — `BM-YYYY-NNN` format otomatis

### Sprint 6 — Pemakaian Barang

- **Header-Detail Transaction** — Dokumen pemakaian dengan detail item
- **Project Link** — Relasi ke project
- **Approval Workflow** — Status: PENDING → APPROVED / REJECTED
- **Stock Reduction** — Otomatis kurangi stock saat approved
- **Auto Code Generation** — `PB-YYYY-NNN` format otomatis

### Sprint 7 — Laporan

- **Laporan Stock** — Stock per barang dengan current stock, total masuk, total keluar
- **Kartu Stock** — Detail mutasi per barang (masuk/keluar/adjustment)
- **Perputaran Barang (FSD)** — Fast Moving, Slow Moving, Dead Stock analysis

### Core Module — Warehouse & Inventory

- **Master Gudang** — CRUD warehouse/gudang
- **Transfer Gudang** — Kirim barang antar gudang dengan approval workflow
- **Stock Adjustment** — Koreksi selisih stock (plus/minus) dengan alasan
- **Stock Opname** — Audit fisik stock dengan finalize & auto-adjustment
- **Stock Ledger** — Pencatatan mutasi stock terintegrasi (masuk, keluar, transfer, adjustment, opname)

### Sistem & Keamanan

- **Settings** — Konfigurasi format kode dokumen per tipe
- **Auto Code Generation** — Format kode otomatis untuk semua dokumen
- **Security Audit Log** — Riwayat perubahan data
- **Activity Log** — Log aktivitas pengguna
- **Login History** — Riwayat login (IP, waktu, browser)
- **Device Management** — Kelola sesi perangkat aktif, revoke token
- **Two-Factor Authentication** — TOTP-based 2FA

---

## Arsitektur Aplikasi

### Frontend Architecture

```
App Router (Next.js 16)
├── (dashboard)/layout.tsx     # Protected layout: Sidebar + Navbar
│   ├── Sidebar Navigation     # Collapsible, grouped menu, mobile drawer
│   ├── Top Navbar             # Page title, theme toggle, notifications, profile
│   └── Content Area           # Dynamic page content
├── login/                     # Public login page
└── page.tsx                   # Landing page (redirect)
```

**Navigation Groups:**

| Grup             | Menu Items                                                                      |
| ---------------- | ------------------------------------------------------------------------------- |
| Utama            | Dashboard                                                                       |
| Data Master      | Master Project, Master Barang, Master Gudang, Supplier                          |
| Transaksi & Stok | Barang Masuk, Pemakaian Barang, Transfer Gudang, Stock Adjustment, Stock Opname |
| Laporan          | Laporan Stock, Perputaran (FSD)                                                 |
| Sistem           | Pengaturan                                                                      |

### Backend Architecture

```
Laravel 13 API
├── Controllers/Api/           # 15 API controllers
├── Models/                    # 20 Eloquent models
├── Middleware/                # Sanctum auth guard
├── Database/
│   ├── Migrations/            # 16 migration files
│   └── Seeders/               # Default admin seeder
└── Routes/api.php             # Centralized API routes
```

---

## Shared Packages

### `@priskila/ui` — Design System Components

| Component | Deskripsi                                  |
| --------- | ------------------------------------------ |
| `Button`  | Primary, secondary, danger, ghost variants |
| `Input`   | Form input dengan label dan error state    |
| `Card`    | Container card dengan header, body, footer |
| `Badge`   | Status badge dengan variant warna          |
| `Alert`   | Notifikasi inline (info, success, warning) |
| `Avatar`  | Avatar nama pengguna dengan initial        |
| `Loading` | Spinner/skeleton loading state             |

### `@priskila/types` — Shared TypeScript Types

| Type                    | Deskripsi                     |
| ----------------------- | ----------------------------- |
| `BaseResponse<T>`       | Standard API response wrapper |
| `PaginatedResponse<T>`  | Paginated list response       |
| `PaginationMeta`        | Pagination metadata           |
| `User`                  | User profile dengan roles     |
| `Project`               | Master project                |
| `Barang`                | Master barang/item            |
| `Supplier`              | Master supplier               |
| `BarangMasuk`           | Header barang masuk           |
| `BarangMasukDetail`     | Detail line item barang masuk |
| `PemakaianBarang`       | Header pemakaian barang       |
| `PemakaianBarangDetail` | Detail line item pemakaian    |

### `@priskila/api` — API Client

Centralized Axios instance dengan:

- Base URL configuration
- Token injection via interceptor
- Standard error handling

---

## API Endpoints

### Authentication

| Method | Endpoint                | Deskripsi                |
| ------ | ----------------------- | ------------------------ |
| POST   | `/api/auth/login`       | Login                    |
| POST   | `/api/auth/logout`      | Logout                   |
| GET    | `/api/auth/me`          | Get authenticated user   |
| POST   | `/api/auth/2fa/enable`  | Enable 2FA               |
| POST   | `/api/auth/2fa/confirm` | Confirm 2FA setup        |
| POST   | `/api/auth/2fa/disable` | Disable 2FA              |
| POST   | `/api/auth/2fa/verify`  | Verify 2FA code on login |

### Master Data

| Method | Endpoint               | Deskripsi        |
| ------ | ---------------------- | ---------------- |
| GET    | `/api/projects`        | List projects    |
| POST   | `/api/projects`        | Create project   |
| GET    | `/api/projects/{id}`   | Show project     |
| PUT    | `/api/projects/{id}`   | Update project   |
| DELETE | `/api/projects/{id}`   | Delete project   |
| GET    | `/api/barang`          | List barang      |
| POST   | `/api/barang`          | Create barang    |
| GET    | `/api/barang/{id}`     | Show barang      |
| PUT    | `/api/barang/{id}`     | Update barang    |
| DELETE | `/api/barang/{id}`     | Delete barang    |
| GET    | `/api/suppliers`       | List suppliers   |
| POST   | `/api/suppliers`       | Create supplier  |
| GET    | `/api/suppliers/{id}`  | Show supplier    |
| PUT    | `/api/suppliers/{id}`  | Update supplier  |
| DELETE | `/api/suppliers/{id}`  | Delete supplier  |
| GET    | `/api/warehouses`      | List warehouses  |
| POST   | `/api/warehouses`      | Create warehouse |
| GET    | `/api/warehouses/{id}` | Show warehouse   |
| PUT    | `/api/warehouses/{id}` | Update warehouse |
| DELETE | `/api/warehouses/{id}` | Delete warehouse |

### Transactions

| Method | Endpoint                                      | Deskripsi                      |
| ------ | --------------------------------------------- | ------------------------------ |
| GET    | `/api/barang-masuk`                           | List barang masuk              |
| POST   | `/api/barang-masuk`                           | Create barang masuk            |
| GET    | `/api/barang-masuk/{id}`                      | Show barang masuk              |
| GET    | `/api/pemakaian-barang`                       | List pemakaian                 |
| POST   | `/api/pemakaian-barang`                       | Create pemakaian               |
| GET    | `/api/pemakaian-barang/{id}`                  | Show pemakaian                 |
| POST   | `/api/pemakaian-barang/{id}/approve`          | Approve pemakaian              |
| POST   | `/api/pemakaian-barang/{id}/reject`           | Reject pemakaian               |
| GET    | `/api/inventory/transfers`                    | List transfer gudang           |
| POST   | `/api/inventory/transfers`                    | Create transfer gudang         |
| GET    | `/api/inventory/transfers/{id}`               | Show transfer gudang           |
| POST   | `/api/inventory/transfers/{id}/approve`       | Approve transfer               |
| POST   | `/api/inventory/transfers/{id}/reject`        | Reject transfer                |
| GET    | `/api/inventory/adjustments`                  | List stock adjustments         |
| POST   | `/api/inventory/adjustments`                  | Create stock adjustment        |
| GET    | `/api/inventory/adjustments/{id}`             | Show stock adjustment          |
| GET    | `/api/inventory/opnames`                      | List stock opnames             |
| POST   | `/api/inventory/opnames`                      | Create stock opname            |
| GET    | `/api/inventory/opnames/{id}`                 | Show stock opname              |
| PUT    | `/api/inventory/opnames/{id}`                 | Update opname details          |
| POST   | `/api/inventory/opnames/{id}/finalize`        | Finalize opname & adjust stock |
| GET    | `/api/delivery-orders`                        | List delivery orders           |
| POST   | `/api/delivery-orders`                        | Create delivery order          |
| GET    | `/api/delivery-orders/{id}`                   | Show delivery order            |
| POST   | `/api/delivery-orders/{id}/ship`              | Ship delivery order            |
| GET    | `/api/delivery-orders/verify/{token}`         | Public QR verification data    |
| POST   | `/api/delivery-orders/verify/{token}/confirm` | Confirm delivery & evidence    |

### Reports

| Method | Endpoint                              | Deskripsi                     |
| ------ | ------------------------------------- | ----------------------------- |
| GET    | `/api/reports/stock`                  | Laporan stock keseluruhan     |
| GET    | `/api/reports/stock-card/{barang_id}` | Kartu stock per barang        |
| GET    | `/api/reports/turnover`               | Fast/Slow/Dead stock analysis |

### Settings & Security

| Method | Endpoint                             | Deskripsi                   |
| ------ | ------------------------------------ | --------------------------- |
| GET    | `/api/settings`                      | Get all settings            |
| PUT    | `/api/settings`                      | Update settings             |
| GET    | `/api/settings/generate-code/{type}` | Generate auto code by type  |
| GET    | `/api/dashboard`                     | Dashboard metrics           |
| GET    | `/api/security/devices`              | List active device sessions |
| DELETE | `/api/security/devices/{id}`         | Revoke device session       |
| GET    | `/api/security/logs/audit`           | Audit logs                  |
| GET    | `/api/security/logs/activity`        | Activity logs               |
| GET    | `/api/security/logs/login-history`   | Login history               |

---

## Database Schema

### Models (20 Eloquent Models)

| Model                   | Tabel                    | Deskripsi                |
| ----------------------- | ------------------------ | ------------------------ |
| `User`                  | users                    | Pengguna sistem + 2FA    |
| `Project`               | projects                 | Master project           |
| `Barang`                | barang                   | Master barang/item       |
| `Supplier`              | suppliers                | Master supplier          |
| `Warehouse`             | warehouses               | Master gudang            |
| `BarangMasuk`           | barang_masuk             | Header barang masuk      |
| `BarangMasukDetail`     | barang_masuk_details     | Detail item barang masuk |
| `PemakaianBarang`       | pemakaian_barang         | Header pemakaian barang  |
| `PemakaianBarangDetail` | pemakaian_barang_details | Detail item pemakaian    |
| `GudangTransfer`        | gudang_transfers         | Header transfer gudang   |
| `GudangTransferDetail`  | gudang_transfer_details  | Detail item transfer     |
| `StockAdjustment`       | stock_adjustments        | Header stock adjustment  |
| `StockAdjustmentDetail` | stock_adjustment_details | Detail item adjustment   |
| `StockOpname`           | stock_opnames            | Header stock opname      |
| `StockOpnameDetail`     | stock_opname_details     | Detail item opname       |
| `StockLedger`           | stock_ledgers            | Catatan mutasi stock     |
| `Setting`               | settings                 | Konfigurasi aplikasi     |
| `AuditLog`              | audit_logs               | Riwayat perubahan data   |
| `ActivityLog`           | activity_logs            | Log aktivitas pengguna   |
| `LoginHistory`          | login_histories          | Riwayat login            |

---

## Color Palette & Design System

| Token      | Hex       | Penggunaan                     |
| ---------- | --------- | ------------------------------ |
| Primary    | `#2563EB` | Tombol utama, link             |
| Accent     | `#F97316` | Active sidebar, brand identity |
| Secondary  | `#0F172A` | Dark background, text          |
| Success    | `#16A34A` | Status approved, badge         |
| Warning    | `#F59E0B` | Status pending, alert          |
| Danger     | `#DC2626` | Delete, rejected, error        |
| Background | `#F8FAFC` | Light mode background          |

### UI Principles

- Rounded XL corners
- Soft shadow
- Card-based layout
- Sticky sidebar & header
- Responsive (mobile drawer sidebar)
- Dark mode support
- Glassmorphism navbar (backdrop-blur)

---

## Roadmap & Status Sprint

| Sprint   | Modul                        | Status |
| -------- | ---------------------------- | ------ |
| Sprint 1 | Authentication & Layout      | ✅     |
| Sprint 2 | Master Project               | ✅     |
| Sprint 3 | Master Barang                | ✅     |
| Sprint 4 | Supplier                     | ✅     |
| Sprint 5 | Barang Masuk                 | ✅     |
| Sprint 6 | Pemakaian Barang             | ✅     |
| Sprint 7 | Laporan (Stock, Kartu, FSD)  | ✅     |
| Core     | Master Gudang                | ✅     |
| Core     | Transfer Gudang              | ✅     |
| Core     | Stock Adjustment             | ✅     |
| Core     | Stock Opname                 | ✅     |
| Core     | Stock Ledger                 | ✅     |
| Security | 2FA, Audit, Activity, Device | ✅     |
| Settings | Code Format Configuration    | ✅     |
|          | Deployment (Docker/Nginx/CI) | ⬜     |

---

## Future Modules

Modul-modul yang direncanakan untuk pengembangan selanjutnya:

### Warehouse Module (Diferensiasi Utama)

- Hierarki lokasi: Warehouse → Zone → Rack → Shelf → Bin
- QR Code / Barcode scan untuk barang masuk/keluar
- Scan barang real-time

### Procurement

- Purchase Request → Approval → PO → Supplier → Receive Item
- Multi-level approval workflow

### Project Management (Inventory Project)

- Budget Material, Material Plan, Progress Material, Remaining Material

### Asset Management

- Pencatatan aset non-consumable (laptop, mesin, alat safety)
- Peminjaman & pengembalian aset

### Equipment (Alat Berat)

- Excavator, Crane, Forklift
- Jam operasional, maintenance, service tracking

### Approval Workflow

- Multi-level: Staff → Supervisor → Manager → Warehouse → Done

### Multi Warehouse

- Support multi-gudang (Jakarta, Surabaya, Bali, Batam)
- Transfer antar gudang (sudah tersedia dasar)

### Delivery Module

- **Delivery Order & Surat Jalan** — Kelola dokumen pengiriman dengan daftar item dan penerima
- **QR Verification** — URL unik per surat jalan untuk konfirmasi penerimaan tanpa login
- **Digital Signature** — Tanda tangan penerima via HTML5 canvas
- **Photo Evidence** — Maksimum 3 foto bukti penerimaan (maks. 5MB/foto)
- **Delivery Status** — DRAFT → IN_TRANSIT → DELIVERED

### Deployment

- Docker containerization
- Nginx reverse proxy
- GitHub Actions CI/CD

---

## Git Workflow

### Branches

```
main            # Production
develop         # Development
feature/*       # Fitur baru
bugfix/*        # Perbaikan bug
release/*       # Release candidate
```

### Commit Convention

```
feat:       Fitur baru
fix:        Perbaikan bug
refactor:   Refactoring kode
docs:       Dokumentasi
style:      Formatting, styling
test:       Testing
chore:      Maintenance, config
```

---

## Panduan Pengembangan

Silakan lihat panduan lengkap di [AGENTS.md](AGENTS.md) untuk:

- Development rules & coding standards
- Sprint roadmap detail
- Component library specification
- AI development workflow
- Definition of Done criteria

---

## Lisensi

Private / Internal Use Only.
