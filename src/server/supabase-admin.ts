import { createClient } from "@supabase/supabase-js"; // Fungsi yang sama untuk membuat instance Supabase client

// Membuat instance Supabase client dengan hak akses admin (service_role).
// Client ini HANYA boleh digunakan di sisi server (backend) karena menggunakan SUPABASE_ROLE_KEY.
// SUPABASE_ROLE_KEY adalah kunci rahasia yang memberikan akses penuh ke data Supabase kalian,
// mengabaikan semua aturan Row Level Security (RLS).
// JANGAN PERNAH mengekspos SUPABASE_ROLE_KEY ini di sisi client atau di kode frontend.
// `process.env.NEXT_PUBLIC_SUPABASE_URL!` tetap digunakan karena URL service sama dengan URL publik.
// `process.env.SUPABASE_ROLE_KEY!` adalah kunci service role rahasia kalian.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, // URL Supabase project Anda
  process.env.SUPABASE_ROLE_KEY!, // Kunci Service Role (RAHASIA, hanya untuk backend)
);

// Penggunaan umum `supabaseAdmin`:
// - Membuat Pre-signed URLs untuk upload file dari backend (seperti di `productRouter`).
// - Melakukan operasi database di backend yang memerlukan bypass RLS (gunakan dengan sangat hati-hati).
// - Tugas-tugas administratif lain yang memerlukan hak akses penuh
