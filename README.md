# KOLABORIN

<p align="center">
  <img src="images/Kolaborin%20Connection%20Network%20Logo.png" alt="KOLABORIN logo" width="180">
</p>

**Lebih Banyak Koneksi, Lebih Berkolaborasi.**

KOLABORIN adalah prototipe platform kampus untuk menghubungkan mahasiswa dengan grup belajar, organisasi, event, komunitas, dan tempat belajar melalui peta interaktif.

Created for **GDG on Campus ITB - STACK 2026**, Case 1: Smarter Campus and Learning.

## Fitur Utama

- Grup belajar: buat, cari, bergabung, berdiskusi, dan tutup grup.
- Peta kampus: tampilkan lokasi belajar aktif dan tempat populer.
- Organisasi: registrasi, verifikasi admin, pengelolaan profil, dan kolaborasi.
- Event: publikasi, lamaran mahasiswa, persetujuan, dan pengecekan kapasitas.
- Komunitas: chat anggota, broadcast, dan aturan balasan otomatis.
- Poin dan leaderboard: penghargaan harian, badge keahlian, dan peringkat mahasiswa.

## Teknologi

| Bagian | Teknologi |
|---|---|
| Frontend | React 18, Vite, React Router, Axios, Leaflet |
| Backend | Node.js, Express |
| Database | MySQL 8 atau MariaDB 10.4+ |
| Autentikasi | JWT dan bcrypt |

## Jalankan Secara Lokal

### Prasyarat

- Node.js 18 atau lebih baru
- npm 9 atau lebih baru
- MySQL 8 atau MariaDB 10.4+

### 1. Siapkan database

Pastikan service MySQL aktif. Buat schema dengan MySQL CLI atau phpMyAdmin:

```bash
mysql -u root -p < server/db/schema.sql
```

Windows PowerShell (jalankan dari root proyek):

```powershell
cmd /c "mysql -u root -p < server\db\schema.sql"
```

Jika database sudah dibuat sebelum fitur meeting organisasi ditambahkan, jalankan migrasi satu kali:

```bash
mysql -u root -p kolaborin < server/db/migrations/001_organization_meetings.sql
```

Windows PowerShell:

```powershell
cmd /c "mysql -u root -p kolaborin < server\db\migrations\001_organization_meetings.sql"
```

Jika database sudah dibuat sebelum tiket QR dan check-in event ditambahkan, jalankan migrasi berikut satu kali:

```bash
mysql -u root -p kolaborin < server/db/migrations/002_event_check_ins.sql
```

Windows PowerShell:

```powershell
cmd /c "mysql -u root -p kolaborin < server\db\migrations\002_event_check_ins.sql"
```

Kemudian isi data demo:

```bash
cd server
npm install
npm run seed
```

PERINGATAN: `npm run seed` mengosongkan tabel database sebelum mengisi data demo. Jalankan hanya pada database lokal/dev yang boleh di-reset, bukan database berisi data penting atau production.

Untuk menambahkan atau memperbarui data demo Live Spot organisasi tanpa menghapus data lain:

```bash
cd server
npm run seed:live-spot
```

Perintah ini idempotent dan menyiapkan ruang meeting, venue event, satu meeting, satu event, satu pendaftar demo dengan tiket QR, serta satu pengajuan fasilitas contoh untuk HMIF.

### 2. Jalankan backend

```bash
cd server
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

MacOS atau Linux:

```bash
cp .env.example .env
```

Isi `DB_PASSWORD` dan ganti `JWT_SECRET` dengan secret acak. Jangan gunakan nilai example sebagai secret production.

```bash
npm run dev
```

Backend berjalan di `http://localhost:4000`.

### 3. Jalankan frontend

```bash
cd client
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

MacOS atau Linux:

```bash
cp .env.example .env
npm install
npm run dev
```

Frontend berjalan di `http://localhost:5173`.

## Akun Demo

Password semua akun demo: `Password123!`

| Email | Peran |
|---|---|
| `admin@kolaborin.test` | Admin platform |
| `mikail@kolaborin.test` | Mahasiswa |
| `hima@kolaborin.test` | Pemilik organisasi HMIF terverifikasi |
| `robotics@kolaborin.test` | Pemilik organisasi Robotics pending |
| `farrel@kolaborin.test` | Mahasiswa |
| `raffi@kolaborin.test` | Mahasiswa |

## Struktur Proyek

```text
client/          React and Vite frontend
server/src/      Express routes and services
server/db/       MySQL schema and seed script
images/          Project logo and visual assets
```

## Pengujian

```bash
cd server
npm run test:audit
npm run test:chatbot
```

Frontend dapat diperiksa dengan:

```bash
cd client
npm run build
```
