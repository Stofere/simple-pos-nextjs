# Aplikasi Kasir Sederhana - Next.js & tRPC (Simple POS Next.js)

Selamat datang di repositori proyek Aplikasi Kasir Sederhana! Proyek ini dibangun sebagai bagian dari pembelajaran intensif untuk menguasai pembuatan aplikasi web modern dengan Next.js, tRPC, Clerk untuk autentikasi, dan Supabase sebagai backend (database dan storage), serta Xendit untuk pemrosesan pembayaran.

Tujuan utama proyek ini adalah untuk mempraktikkan dan mendemonstrasikan kemampuan dalam membangun aplikasi full-stack dengan fitur-fitur esensial sebuah sistem Point of Sale (POS).

## 🌟 Fitur Utama (Progress Saat Ini)

- Setup proyek dengan Next.js (Pages Router), TypeScript, dan tRPC.
- Autentikasi pengguna menggunakan Clerk.
- Manajemen Kategori Produk (CRUD).
- Manajemen Produk (Create & Read, dengan upload gambar).
- Upload gambar menggunakan **Pre-signed URLs** dari Supabase Storage.
- Fungsi **"Tambah ke Keranjang" (Add to Cart)** menggunakan state management Zustand.
- Proses **Pembuatan Order (Create Order)**.
- Integrasi Pembayaran: **Generate QRIS** menggunakan Xendit.
- _Penanganan Webhook Pembayaran Xendit sedang dikerjakan (memerlukan Ngrok/localtunnel untuk testing lokal)._
- _Update & Delete Produk, Filter Produk, dan Dashboard akan dikembangkan selanjutnya._

## 🛠️ Teknologi Utama

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS, Shadcn/UI, Zustand (State Management)
- **Backend & API:** tRPC, Prisma
- **Layanan Eksternal:**
  - Clerk (Autentikasi)
  - Supabase (Database PostgreSQL & Storage)
  - Xendit (Pemrosesan Pembayaran)
- **Lainnya:** Ngrok (untuk Webhook), ESLint, Prettier

## 🚀 Cara Menjalankan Proyek

Untuk menjalankan proyek ini di komputer lokal Anda, ikuti langkah-langkah berikut:

### 1. Persiapan Awal

- Pastikan Anda sudah menginstal [Node.js](https://nodejs.org/) (versi LTS direkomendasikan) dan npm/yarn.
- Clone repositori ini:
  ```bash
  git clone https://github.com/stofere/simple-post-nextjs.git
  cd FILE-REPO-YANG-TELAH-ANDA-CLONE
  ```
- Install semua dependency proyek:
  ```bash
  npm install
  ```
  _(atau `yarn install` jika Anda menggunakan Yarn)_

### 2. Konfigurasi Environment Variables (.env)

Proyek ini membutuhkan beberapa kredensial API yang disimpan dalam file `.env`.

1.  Salin file `.env.example` menjadi `.env`:
    ```bash
    cp .env.example .env
    ```
2.  Isi variabel di `.env` dengan kredensial Anda:
    - **Clerk:** `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` & `CLERK_SECRET_KEY`.
    - **Supabase Database (Prisma):** `DATABASE_URL` (connection pooler URI) & `DIRECT_URL` (direct connection URI). Ganti `[YOUR-PASSWORD]` jika perlu.
    - **Supabase JS Client:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, & `SUPABASE_ROLE_KEY` (service_role key - **RAHASIAKAN INI!**).
    - **Xendit:** `XENDIT_MONEY_IN_KEY` (API Key untuk "Money In" dari dashboard Xendit Anda).
    - **Supabase Storage:** Buat bucket publik bernama `product-images` (atau sesuai `src/server/bucket.ts`) di dashboard Supabase Storage.

### 3. Sinkronisasi Database

Setelah `.env` dikonfigurasi, jalankan:

```bash
npm run db:push
```
