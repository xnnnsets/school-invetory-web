# Aplikasi Inventaris Sekolah (Web)

Aplikasi inventaris sekolah berbasis web untuk membantu pengelolaan aset/barang secara **terstruktur, real-time, dan transparan**: pencatatan barang masuk/keluar, monitoring stok, peminjaman, permintaan barang, notifikasi, dan laporan siap cetak.

## Gambaran singkat: ini buat apa?

Dengan aplikasi ini sekolah bisa:

- **Menyimpan master data** (barang, kategori, supplier, ruangan, profil sekolah, pengguna)
- **Mencatat transaksi** barang masuk & barang keluar (dengan operator/petugas)
- **Memantau stok** dan indikator barang menipis (low stock)
- **Mengelola peminjaman** barang (pengajuan → persetujuan → pengembalian)
- **Mengelola permintaan** barang dari Guru ke TU/Admin (approve/reject/fulfill)
- **Mencetak laporan** (stok, inbound, outbound, peminjaman, permintaan)
- **Mengubah profil akun** (nama/email/foto URL) & **ganti password**

## Role pengguna dan kegunaannya

Aplikasi ini memakai 4 role (RBAC / Role-Based Access Control). Tiap role punya menu & hak akses sesuai kebutuhan.

### Administrator (ADMIN)

- **Kelola pengguna**: tambah/edit/nonaktifkan akun (Admin/Kepsek/TU/Guru)
- **Kelola master data**:
  - Data Barang
  - Kategori Barang
  - Supplier
  - Ruangan
- **Kelola data sekolah**: profil sekolah (NPSN, status, alamat, dsb.)
- **Monitoring transaksi**:
  - Barang Masuk (inbound)
  - Barang Keluar (outbound)
- **Kelola peminjaman** (proses pengajuan, status, pengembalian)
- **Kelola permintaan barang** (approve/reject/fulfill)
- **Laporan lengkap**: stok, inbound, outbound, peminjaman, permintaan
- **Profil akun**: edit profil + ganti password

### Kepala Sekolah (KEPALA_SEKOLAH)

- **Dashboard monitoring**: ringkasan stok, tren transaksi
- **Monitoring stok** (read-only)
- **Monitoring barang masuk & keluar** (read-only)
- **Laporan** (read-only) + siap cetak
- **Notifikasi** (mis. aktivitas/permintaan tertentu sesuai implementasi)
- **Profil akun**: edit profil + ganti password

### Petugas Tata Usaha (PETUGAS_TU)

- **Input transaksi**:
  - Barang Masuk
  - Barang Keluar
- **Kelola peminjaman & pengembalian**
- **Update stok berkala** (penyesuaian stok dengan audit trail / riwayat penyesuaian)
- **Kelola master data terbatas** (Kategori/Supplier/Ruangan sesuai kebijakan)
- **Profil akun**: edit profil + ganti password

### Guru / Pengguna Barang (GURU)

- **Ajukan permintaan barang** (request) ke TU/Admin
- **Ajukan peminjaman barang** (loan)
- **Riwayat** permintaan & peminjaman (read-only)
- **Profil akun**: edit profil + ganti password

## Tech stack

- **Backend**: Node.js + Express + Prisma + SQLite + JWT + Zod validation
- **Frontend**: React + Vite + TailwindCSS
- **UI**: `lucide-react`, `framer-motion`
- **Chart**: `chart.js` + `react-chartjs-2`

## Struktur repo

- `backend/` API server (Express + Prisma)
- `frontend/` Web app (React)

## Menjalankan (dev)

### 1) Install dependency (root workspace)

```bash
npm install
```

### 2) Backend: env + migrate + seed + dev

Salin env contoh:

```bash
cp backend/.env.example backend/.env
```

#### Konfigurasi ENV (wajib)

Buka `backend/.env` dan pastikan variabel berikut terisi.

```env
# Lokasi database SQLite (file akan dibuat otomatis)
DATABASE_URL="file:./dev.db"

# Secret untuk tanda tangan JWT (ubah untuk produksi)
JWT_SECRET="dev_secret_change_me"

# Port backend (opsional)
PORT=4000

# Origin frontend untuk CORS (opsional, bisa pakai wildcard saat dev)
CORS_ORIGIN="http://localhost:5173"
```

#### Konfigurasi ENV Frontend (opsional)

Secara default frontend mengarah ke `http://localhost:4000`.
Kalau backend kamu jalan di host/port lain, buat file `frontend/.env`:

```env
VITE_API_BASE="http://localhost:4000"
```

Migrasi database + seed data:

```bash
npm -w backend run db:migrate
npm -w backend run db:seed
```

Jalankan backend:

```bash
npm -w backend run dev
```

Backend default di `http://localhost:4000`.

### 3) Frontend: dev server

```bash
npm -w frontend run dev
```

Frontend default di `http://localhost:5173`.

### Jalankan keduanya sekaligus

```bash
npm run dev
```

## Akun default (hasil seed)

Password semua akun: `Password123!`

- Admin: `admin@sekolah.test`
- Kepala Sekolah: `kepsek@sekolah.test`
- Petugas TU: `tu@sekolah.test`
- Guru: `guru@sekolah.test`

## Halaman/route utama (frontend)

- **Umum**: `/login`, `/profile`
- **Dashboard**: `/dashboard`
- **Master data**: `/items`, `/categories`, `/suppliers`, `/rooms`, `/school`, `/users` (Admin)
- **Transaksi**: `/inbound`, `/outbound`
- **Peminjaman**: `/loans`
- **Permintaan barang**: `/requests`
- **Riwayat Guru**: `/history`
- **Update stok (TU/Admin)**: `/update-stock`
- **Laporan**: `/reports`
- **Notifikasi (Kepsek)**: `/notifications`

## API ringkas (backend)

Semua endpoint berada di prefix `/api/*` dan butuh login (JWT) kecuali `/api/auth/login`.

- **Auth**: `POST /api/auth/login`, `GET /api/auth/me`
- **Profil akun**: `GET /api/profile`, `PUT /api/profile`, `PUT /api/profile/password`
- **Master data**:
  - `GET/POST /api/items`, `PUT /api/items/:id`
  - `GET/POST /api/categories`
  - `GET/POST /api/suppliers`
  - `GET/POST/PUT/DELETE /api/rooms`
- **Transaksi**:
  - `GET /api/inbound` (Admin/TU/Kepsek)
  - `POST /api/inbound` (Admin/TU)
  - `GET /api/outbound` (Admin/TU/Kepsek)
  - `POST /api/outbound` (Admin/TU)
- **Peminjaman**: `/api/loans/*`
- **Permintaan**: `/api/requests/*`
- **Notifikasi**: `/api/notifications/*`
- **Laporan**: `/api/reports/*`
- **Dashboard**: `/api/dashboard/*`
- **User management** (Admin): `/api/users/*`
- **Data sekolah**: `GET/PUT /api/school`
- **Update stok (audit)**: `/api/stock-adjustments/*`

## Catatan penting

- Jika ada error install dependency (mis. jaringan/DNS), jalankan ulang `npm install`.
- Untuk reset data saat dev, hapus file SQLite (lokasi mengikuti `DATABASE_URL` di `backend/.env`), lalu jalankan migrasi + seed lagi.

