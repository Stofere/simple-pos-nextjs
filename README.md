# Aplikasi Kasir Sederhana - Next.js & tRPC (Simple POS Next.js)

Selamat datang di repositori proyek Aplikasi Kasir Sederhana! Proyek ini dibangun sebagai bagian dari pembelajaran intensif untuk menguasai pembuatan aplikasi web modern dengan Next.js, tRPC, Clerk untuk autentikasi, dan Supabase sebagai backend (database dan storage).

Tujuan utama proyek ini adalah untuk mempraktikkan dan mendemonstrasikan kemampuan dalam membangun aplikasi full-stack dengan fitur-fitur esensial sebuah sistem Point of Sale (POS), mulai dari manajemen data hingga proses transaksi.

## 🌟 Tujuan Pembelajaran & Fitur Utama

Proyek ini mencakup implementasi berbagai fitur dan konsep, antara lain:

- **Setup Proyek Modern:** Menggunakan Next.js (dengan Pages Router), TypeScript, dan tRPC.
- **Autentikasi Pengguna:** Integrasi dengan Clerk untuk login dan manajemen sesi.
- **Manajemen Data (CRUD):**
  - [x] Kategori Produk (Create, Read, Update, Delete)
  - [x] Produk (Create, Read)
  - [ ] Update & Delete Produk _(Sedang dikerjakan)_
  - [ ] Filter Produk berdasarkan Kategori _(Sedang dikerjakan)_
- **Upload File:**
  - [x] Implementasi upload gambar produk menggunakan **Pre-signed URLs** dari Supabase Storage. Ini adalah teknik efisien yang tidak membebani server aplikasi secara langsung.
- **Manajemen Order (Transaksi):** _(Akan datang)_
  - [ ] Fungsi "Tambah ke Keranjang" (Add to Cart)
  - [ ] Proses Pembuatan Order (Create Order)
  - [ ] Integrasi Pembayaran (Generate QRIS, Mock Payment)
  - [ ] Penanganan Webhook Pembayaran
- **Dashboard & Laporan:** _(Akan datang)_
  - [ ] Dashboard Pendapatan (Earnings)
  - [ ] Update Status Order
  - [ ] Filter Order berdasarkan Status

## 🛠️ Teknologi yang Digunakan

- **Frontend:**
  - [Next.js](https://nextjs.org/) (Pages Router)
  - [React](https://reactjs.org/)
  - [TypeScript](https://www.typescriptlang.org/)
  - [Tailwind CSS](https://tailwindcss.com/)
  - [Shadcn/UI](https://ui.shadcn.com/) (untuk komponen UI)
  - [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/) (untuk manajemen dan validasi form)
- **Backend & API:**
  - [tRPC](https://trpc.io/) (untuk API yang type-safe)
  - [Prisma](https://www.prisma.io/) (sebagai ORM untuk interaksi database)
- **Layanan Eksternal:**
  - [Clerk](https://clerk.com/) (untuk autentikasi)
  - [Supabase](https://supabase.com/):
    - **Database PostgreSQL:** Penyimpanan data utama.
    - **Supabase Storage:** Penyimpanan file (gambar produk).
  - [Xendit](https://www.xendit.co/) (untuk proses pembayaran - _integrasi akan datang_)
- **Lainnya:**
  - [Ngrok](https://ngrok.com/) (untuk mengekspos server lokal ke internet, berguna untuk webhook - _akan digunakan nanti_)
  - [ESLint](https://eslint.org/) & [Prettier](https://prettier.io/) (untuk kualitas dan konsistensi kode)

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
2.  Buka file `.env` dan isi nilainya sesuai panduan di bawah:

    #### a. Clerk Setup (Autentikasi)

    - Daftar atau login ke akun Anda di [Clerk.com](https://clerk.com/).
    - Buat "Application" baru di dashboard Clerk.
    - Dapatkan **Publishable Key** dan **Secret Key** dari aplikasi Clerk Anda.
    - Masukkan ke dalam `.env`:
      ```env
      # CREDENTIALS CLERK
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
      CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
      ```

    #### b. Supabase Setup (Database & Storage)

    - Daftar atau login ke akun Anda di [Supabase.com](https://supabase.com/).
    - Buat Proyek baru.
    - **Untuk Koneksi Database (Prisma):**
      - Di dashboard Supabase proyek Anda, navigasi ke **Project Settings > Database**.
      - Temukan bagian **Connection string** dan salin URI yang menggunakan **connection pooling**. Ini akan menjadi `DATABASE_URL`.
      - Salin juga URI untuk **direct connection**. Ini akan menjadi `DIRECT_URL` (digunakan Prisma untuk migrasi).
      - **PENTING:** Ganti `[YOUR-PASSWORD]` di URI dengan password database Anda (jika Anda mengubahnya dari password default yang diberikan Supabase).
        ```env
        # CREDENTIALS SUPABASE DATABASE (untuk Prisma)
        DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxx.supabase.co:6543/postgres"
        DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxx.supabase.co:5432/postgres"
        ```
    - **Untuk Supabase JS Client (Storage & Layanan Lain):**
      - Di dashboard Supabase proyek Anda, navigasi ke **Project Settings > API**.
      - Salin nilai **Project URL** (ini akan menjadi `NEXT_PUBLIC_SUPABASE_URL`).
      - Salin nilai **Project API keys** untuk `anon` `public` (ini akan menjadi `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
      - Salin nilai **Project API keys** untuk `service_role` `secret` (ini akan menjadi `SUPABASE_ROLE_KEY`). **JANGAN PERNAH bagikan kunci service_role ini secara publik!**
        ```env
        # CREDENTIALS SUPABASE-JS (untuk Supabase Client & Admin)
        NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
        NEXT_PUBLIC_SUPABASE_ANON_KEY=eyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
        SUPABASE_ROLE_KEY=eyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
        ```
    - **Membuat Bucket untuk Gambar Produk:**
      - Di dashboard Supabase, navigasi ke menu **Storage**.
      - Klik **Create a new bucket**.
      - Beri nama bucket, misalnya `product-images`. Pastikan nama ini sama dengan yang ada di `src/server/bucket.ts` (`Bucket.ProductImages`).
      - Aktifkan opsi **Public bucket** agar gambar bisa diakses.

### 3. Migrasi Database

Setelah `.env` terisi dengan benar (terutama `DATABASE_URL` dan `DIRECT_URL` yang menunjuk ke Supabase), jalankan perintah berikut untuk menyinkronkan skema Prisma Anda dengan database Supabase. Ini akan membuat tabel-tabel berdasarkan definisi model di `prisma/schema.prisma`.

```bash
npm run db:push

Perintah ini menggunakan prisma db push, yang secara langsung menerapkan perubahan skema ke database Anda. Ini cocok untuk iterasi cepat selama development.

```
