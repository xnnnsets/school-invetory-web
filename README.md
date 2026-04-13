# Aplikasi Inventory Sekolah (Web)

Aplikasi inventaris sekolah berbasis web untuk membantu pengelolaan aset/barang secara terstruktur: barang masuk, barang keluar, stok real-time, dan peminjaman.

## Tech Stack

- **Backend**: Node.js + Express + Prisma (SQLite) + JWT Auth
- **Frontend**: React + Vite + TailwindCSS

## Role Pengguna

- **Administrator**
- **Kepala Sekolah**
- **Petugas Tata Usaha (TU)**
- **Guru/Pengguna Barang**

## Struktur Repo

- `backend/` API server (Express)
- `frontend/` Web app (React)

## Menjalankan (dev)

### Backend

```bash
cd backend
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Akun Default (hasil seed)

Password semua akun: `Password123!`

- Admin: `admin@sekolah.test`
- Kepala Sekolah: `kepsek@sekolah.test`
- Petugas TU: `tu@sekolah.test`
- Guru: `guru@sekolah.test`

