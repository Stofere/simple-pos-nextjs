import type { Bucket } from "@/server/bucket"; // Impor enum Bucket untuk type safety nama bucket
import { createClient } from "@supabase/supabase-js"; // Fungsi untuk membuat instance Supabase client

// Membuat instance Supabase client untuk digunakan di sisi client (browser) atau lingkungan Node.js non-admin.
// Client ini diinisialisasi dengan URL Supabase publik dan Kunci Anon (Anonymous Key).
// Kunci Anon aman untuk diekspos di sisi client karena akses data diatur oleh Row Level Security (RLS) di database Supabase.
// Tanda seru `!` setelah variabel environment (misalnya `process.env.NEXT_PUBLIC_SUPABASE_URL!`)
// adalah non-null assertion operator di TypeScript. Ini memberitahu TypeScript bahwa kita yakin
// variabel tersebut tidak akan null atau undefined pada saat runtime.
// Penting untuk memastikan variabel-variabel ini memang sudah di-set di file .env.
export const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// Fungsi helper untuk meng-upload file ke Supabase Storage menggunakan Pre-signed URL.
// Fungsi ini dieksekusi di sisi client setelah mendapatkan path dan token dari backend.
export async function uploadFileToSignedUrl({
  file, // File objek yang akan di-upload (dari input <input type="file">)
  path, // Path (nama file) di dalam bucket Supabase tempat file akan disimpan (didapat dari backend)
  token, // Token JWT (bagian dari Pre-signed URL) untuk otorisasi upload (didapat dari backend)
  bucket, // Nama bucket Supabase tempat file akan di-upload (dari enum Bucket)
}: {
  file: File;
  path: string;
  token: string;
  bucket: Bucket; // Menggunakan enum Bucket untuk konsistensi nama bucket
}) {
  try {
    // Menggunakan metode `uploadToSignedUrl` dari Supabase JS SDK.
    // Metode ini secara internal akan membuat PUT request ke URL Pre-signed yang sesuai
    // dengan path dan token yang diberikan, dengan body request adalah `file`.
    // `bucket` menentukan bucket tujuan di Supabase Storage.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    // Komentar eslint-disable di atas mungkin ada karena tipe `data` dari Supabase bisa `any`
    // atau memerlukan penanganan tipe yang lebih spesifik jika TypeScript tidak bisa meng-infer-nya dengan baik.

    const { data, error } = await supabaseClient.storage
      .from(bucket)
      .uploadToSignedUrl(path, token, file); // Operasi upload file adalah asynchronous

    // Error handling jika proses upload ke signed URL gagal.
    if (error) throw error;

    // Jika `data` (hasil upload) tidak ada (seharusnya tidak terjadi jika tidak ada error),
    // lempar error kustom. `data` biasanya berisi `{ path: string }` dari file yang di-upload.
    if (!data) throw new Error("No data returned from uploadToSignedUrl");

    // Setelah file berhasil di-upload, kita perlu mendapatkan URL publiknya
    // agar bisa disimpan di database dan ditampilkan di frontend.
    // `getPublicUrl` akan membuat URL yang bisa diakses publik untuk file di `data.path`.
    // Ini hanya berfungsi jika bucket dikonfigurasi sebagai "Public bucket" di Supabase.
    const fileUrl = supabaseClient.storage
      .from(bucket)
      .getPublicUrl(data?.path); // `data.path` adalah path file yang berhasil di-upload

    return fileUrl.data.publicUrl; // Kembalikan URL publik gambar
  } catch (error) {
    // Menangkap semua error yang mungkin terjadi dalam blok try (baik dari Supabase atau error kustom)
    // dan melemparnya kembali agar bisa ditangani oleh pemanggil fungsi `uploadFileToSignedUrl`.
    // Ini penting agar UI bisa memberikan feedback error kepada pengguna.
    throw error; // Melempar error agar bisa ditangkap di `imageChangeHandler` di ProductForm.tsx
  }
}
