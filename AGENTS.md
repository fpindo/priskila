# 🚀 ANTIGRAVITY - PRISKILA Development Guide

> **Project:** PRISKILA - Project Inventory Stock & Logistics Application
>
> Dokumen ini digunakan sebagai panduan pengembangan menggunakan **Antigravity AI**, sehingga AI dapat mengerjakan project secara bertahap, konsisten, dan hemat token.

---

# 1. Project Overview

## Nama Project

PRISKILA

(Project Inventory Stock & Logistics Application)

## Tujuan

Membangun aplikasi inventory dan logistik yang digunakan untuk mengelola:

- Master Project
- Master Barang
- Master Supplier
- Barang Masuk
- Pemakaian Barang
- Stock
- Laporan

---

# 2. Tech Stack

## Frontend

- Next.js 16
- React 19
- TypeScript
- TailwindCSS
- shadcn/ui
- TanStack Table
- React Hook Form
- Zod
- Axios

---

## Backend

- Laravel 13
- Laravel Sanctum
- Spatie Permission
- MySQL

---

## Deployment

- Docker
- Nginx
- Github Actions

---

# 3. Development Rules

Selalu ikuti aturan berikut.

✔ Gunakan Clean Architecture

✔ Component Driven

✔ Reusable Component

✔ Responsive

✔ Type Safe

✔ Dark Mode Ready

✔ Accessible

✔ API First

✔ Tidak boleh hardcode data.

---

# 4. Folder Structure

```
frontend/

packages/
    ui/
    api/
    types/

backend/

docs/

```

---

# 5. Coding Style

## React

- Functional Component

- Hooks

- Tidak menggunakan Class Component

---

## Naming

Component

```
ProjectCard.tsx
```

Page

```
page.tsx
```

API

```
project.service.ts
```

Types

```
project.type.ts
```

---

# 6. Development Workflow

Semua development harus mengikuti urutan berikut.

```
Requirement

↓

UI Design

↓

Frontend

↓

Mock API

↓

Backend

↓

Integration

↓

Testing

↓

Deployment
```

---

# 7. Sprint Roadmap

## Sprint 1

Authentication

Dashboard

Sidebar

Navigation

Theme

Profile

Notification

---

## Sprint 2

Master Project

CRUD

Search

Pagination

Export

---

## Sprint 3

Master Barang

CRUD

Upload Image

Barcode

QR Code

Category

Unit

---

## Sprint 4

Supplier

CRUD

Search

Export

---

## Sprint 5

Barang Masuk

Header Detail

Dynamic Row

Stock Update

Attachment

---

## Sprint 6

Pemakaian Barang

Project

Approval

Stock Reduction

History

---

## Sprint 7

Laporan

Stock

Kartu Stock

Barang Masuk

Pemakaian

Export Excel

Export PDF

---

# 8. AI Development Rules

Setiap task harus menghasilkan:

- UI
- Types
- API Service
- Validation
- Hook
- Page
- Loading
- Empty State
- Error State

Jangan pernah menghasilkan hanya UI saja.

---

# 9. UI Rules

Gunakan style berikut.

- Rounded XL
- Shadow Soft
- Blue Primary
- Gray Background
- Card Layout
- Sticky Header
- Sticky Sidebar
- Responsive Table

---

# 10. Color Palette

Primary

```
#2563EB
```

Secondary

```
#0F172A
```

Success

```
#16A34A
```

Warning

```
#F59E0B
```

Danger

```
#DC2626
```

Background

```
#F8FAFC
```

---

# 11. Component Library

Gunakan reusable component.

```
Button

Input

Textarea

Select

Autocomplete

DatePicker

DataTable

Badge

Dialog

Drawer

Card

Avatar

Tabs

Pagination

Breadcrumb

Alert

Toast

Loading
```

---

# 12. Layout

```
Top Navbar

↓

Sidebar

↓

Content

↓

Footer
```

---

# 13. Pages Priority

## Phase 1

- Login
- Dashboard

---

## Phase 2

- Master Project
- Master Barang
- Supplier

---

## Phase 3

- Barang Masuk
- Pemakaian Barang

---

## Phase 4

- Laporan

---

## Phase 5

- Setting

---

# 14. API Standard

Semua request menggunakan format.

```
GET

POST

PUT

PATCH

DELETE
```

Response

```
{
    success: true,
    message: "",
    data: {}
}
```

Error

```
{
    success: false,
    message: "",
    errors: {}
}
```

---

# 15. Git Workflow

Branch

```
main

develop

feature/*

bugfix/*

release/*
```

Commit

```
feat:

fix:

refactor:

docs:

style:

test:

chore:
```

---

# 16. Definition of Done

Sebuah task dianggap selesai apabila:

- UI selesai
- Responsive
- Validation selesai
- API selesai
- Unit Test lolos
- Tidak ada TypeScript Error
- Tidak ada ESLint Error
- Dark Mode berjalan
- Mobile Friendly
- Build berhasil

---

# 17. AI Prompt Rules

Saat membuat kode:

1. Buat struktur folder terlebih dahulu.
2. Buat Types.
3. Buat API Service.
4. Buat Hook.
5. Buat Validation.
6. Buat Component.
7. Buat Page.
8. Hubungkan API.
9. Tambahkan Loading.
10. Tambahkan Error Handling.
11. Tambahkan Empty State.
12. Tambahkan Testing.

Jangan melompati langkah.

---

# 18. Milestone

✅ Authentication

✅ Dashboard

✅ Master Project

✅ Master Barang

✅ Supplier

✅ Barang Masuk

✅ Pemakaian Barang

✅ Stock / Kartu Stock

✅ Laporan

⬜ Deployment

---

# 19. Future Modules

## 1. Core Module (MVP)

- **Dashboard**: Nilai Inventory, Barang Masuk, Barang Keluar, Stock Minimum, Aktivitas, Grafik.
- **Master**: Project, Gudang, Barang, Supplier, Kategori, Brand, Satuan, Lokasi Rak (Bin Location).
- **Inventory**: Barang Masuk, Barang Keluar, Transfer Gudang, Stock Adjustment, Stock Opname, Mutasi Barang.
- **Reporting**: Stock Card, Stock Barang, Fast Moving, Slow Moving, Dead Stock.

## 2. Warehouse Module (Diferensiasi Utama)

- **Hierarki Lokasi**: Warehouse → Zone → Rack → Shelf → Bin (misal: Warehouse A - Zone A - Rack 02 - Shelf 03 - Bin 15).
- **QR Code / Barcode**: Setiap barang memiliki kode yang ketika discan langsung memunculkan lokasi, stock, histori, dan supplier.
- **Scan Barang**:
  - Barang Masuk → Scan Barcode → Stock bertambah.
  - Barang Keluar → Scan Barcode → Stock berkurang.

## 3. Procurement

- **Modul Pengadaan**: Purchase Request, Purchase Order, Approval, Receive Item.
- **Flow**: Request → Approval → PO → Supplier → Barang Datang.

## 4. Project Management (Inventory Project)

- **Detail Project**: Budget Material, Material Plan, Progress Material, Remaining Material.

## 5. Asset Management

- **Pencatatan Aset non-consumable**: Laptop, Mesin Bor, Forklift, Alat Safety (Bisa dipinjam & dikembalikan).

## 6. Equipment (Khusus Alat Berat)

- **Alat Berat**: Excavator, Crane, Forklift.
- **Pelacakan**: Jam Operasional, Maintenance, Service.

## 7. Approval Workflow

- **Multi-level Approval**: Staff → Supervisor → Manager → Warehouse → Done.

## 8. Multi Warehouse

- **Lokasi Gudang**: Warehouse Jakarta, Surabaya, Bali, Batam (Support transfer antar gudang).

## 9. Delivery Module (Barang Keluar)

- **Dokumen & Verifikasi**: Delivery Order, Surat Jalan, QR Verification.
- **Digital Signature**: Tanda tangan digital saat barang diterima oleh PIC.
- **Photo Evidence**: Foto barang diterima → upload → selesai.

## 10. Security

- **Audit Log**: Pencatatan riwayat perubahan data sistem (siapa, kapan, data apa yang diubah).
- **Activity Log**: Log aktivitas umum pengguna di sistem.
- **Login History**: Riwayat login pengguna (alamat IP, waktu, lokasi browser).
- **Device Management**: Manajemen perangkat yang aktif menggunakan akun pengguna.
- **Two Factor Authentication (2FA)**: Autentikasi dua faktor untuk keamanan tingkat tinggi.

---

# 20. Goal

Membangun aplikasi Inventory & Logistics yang:

- Modern
- Cepat
- Mudah dipelihara
- Enterprise Ready
- Clean Architecture
- AI Friendly
- Scalable
- Production Ready
