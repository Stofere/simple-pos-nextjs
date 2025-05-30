import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { supabaseAdmin } from "@/server/supabase-admin"; // Supabase client dengan hak admin (service_role)
import { Bucket } from "@/server/bucket"; // Enum untuk nama bucket, menghindari magic strings

// =================================================================================
// PRODUCT ROUTER
// =================================================================================
export const productRouter = createTRPCRouter({
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // QUERIES
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  getProducts: protectedProcedure.query(async ({ ctx }) => {
    const { db } = ctx; // Akses Prisma client dari context tRPC

    const products = await db.product.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        imageUrl: true,
        category: {
          // Sertakan informasi kategori terkait produk
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc", // Urutkan dari produk terbaru
      },
    });

    return products;
  }),

  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // MUTATIONS
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  /**
   * Penjelasan Konsep Pre-signed URL:
   *
   * Masalah:
   * - tRPC secara default berkomunikasi menggunakan JSON, bukan `multipart/form-data`.
   * - `multipart/form-data` adalah tipe konten yang dibutuhkan untuk mengirim file (misalnya gambar) dalam request HTTP.
   * - Karena tRPC tidak mendukung `multipart/form-data` secara langsung untuk input procedurnya,
   *   kita tidak bisa mengirim file gambar langsung melalui mutation tRPC standar.
   *
   * Solusi: Pre-signed URL
   * Ini adalah praktik umum untuk menangani upload file dengan aman dan efisien.
   * Alurnya adalah sebagai berikut:
   * 1. Client mengirim request ke backend (melalui mutation tRPC ini) untuk meminta Pre-signed URL.
   * 2. Backend, menggunakan kredensial admin (Supabase service_role key), membuat URL khusus ini.
   *    URL ini memberikan izin sementara (biasanya beberapa jam, bisa dikonfigurasi)
   *    untuk meng-upload satu file spesifik ke path tertentu di Supabase Storage.
   *    URL ini juga biasanya hanya bisa digunakan satu kali.
   * 3. Client menerima Pre-signed URL (yang berisi path dan token otorisasi).
   * 4. Client menggunakan URL ini untuk meng-upload file gambar langsung ke Supabase Storage.
   *    Proses upload ini tidak melewati server aplikasi Next.js kalian, melainkan langsung ke Supabase.
   * 5. Setelah upload berhasil, client mendapatkan URL publik dari file yang baru saja diunggah.
   * 6. URL publik gambar ini kemudian dikirim sebagai bagian dari data JSON ke mutation tRPC lain
   *    (misalnya `createProduct`) untuk disimpan di database bersama detail produk lainnya.
   *
   * Keuntungan (Pros):
   * - Tidak membebani server aplikasi (Next.js server): Proses upload file yang intensif resource
   *   ditangani oleh Supabase Storage, bukan server aplikasi. Ini menjaga server aplikasi tetap responsif
   *   untuk menangani request lain (seperti operasi database).
   * - Keamanan: Client tidak memerlukan kredensial Supabase dengan hak tulis penuh ke bucket.
   *   Izin upload diberikan secara terbatas melalui Pre-signed URL.
   *
   * Kerugian (Cons):
   * - Membutuhkan dua kali request dari client:
   *   1. Request untuk mendapatkan Pre-signed URL.
   *   2. Request untuk meng-upload file ke Pre-signed URL tersebut.
   * - Kemungkinan gambar tidak terpakai: File mungkin sudah di-upload oleh client,
   *   tetapi pengguna bisa saja membatalkan proses pembuatan produk sebelum menyimpan URL gambar ke database.
   *   Ini bisa menyebabkan file "yatim" di storage (perlu strategi pembersihan jika menjadi masalah).
   */
  createProductImageUploadSignedUrl: protectedProcedure.mutation(
    async ({ ctx }) => {
      // `ctx` disediakan oleh `protectedProcedure`, meskipun tidak semua fieldnya digunakan di sini.
      // `db` dari `ctx` tidak digunakan di sini karena kita berinteraksi dengan Supabase Storage, bukan database Prisma.

      // Menggunakan enum `Bucket.ProductImages` untuk merujuk ke nama bucket "product-images".
      // Ini adalah praktik yang baik untuk menghindari "magic strings" (string literal yang tersebar di kode),
      // meningkatkan keterbacaan, type safety, dan kemudahan refactoring.
      // Nama bucket didefinisikan secara terpusat di `src/server/bucket.ts`.
      const { data, error } = await supabaseAdmin.storage // `await` karena ini operasi I/O asynchronous
        .from(Bucket.ProductImages)
        .createSignedUploadUrl(
          // Membuat nama file unik. `Date.now()` memastikan urutan waktu.
          // Kalian bisa menambahkan string acak atau UUID untuk keunikan yang lebih kuat.
          // Contoh proses kompleks untuk nama file bisa melibatkan:
          // - UUID: untuk menjamin keunikan global.
          // - Folder berdasarkan User ID atau tanggal: untuk organisasi file di bucket.
          // - Menambahkan ekstensi file asli (misalnya .png, .webp).
          `${Date.now()}.jpeg`, // Default ke .jpeg untuk kesederhanaan
          // { expiresIn: 3600 } // Opsional: Mengatur masa berlaku URL (dalam detik). Default biasanya 1 jam.
        );

      // Error Handling:
      // SDK Supabase client (seperti `supabaseAdmin.storage...`) biasanya mengembalikan objek `{ data, error }`.
      // Jika properti `error` ada (truthy), berarti terjadi kesalahan saat berinteraksi dengan Supabase.
      // Kita `throw new TRPCError` agar error ini diformat dengan benar untuk client tRPC.
      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR", // Kode error standar tRPC
          message: error.message, // Pesan error dari Supabase
          cause: error, // Menyertakan error asli untuk debugging
        });
      }

      // Jika tidak ada error, `data` akan berisi informasi yang dibutuhkan oleh client
      // untuk meng-upload file menggunakan `uploadToSignedUrl` dari Supabase JS SDK.
      // `data` yang dikembalikan oleh `createSignedUploadUrl` dari `supabase-admin`
      // biasanya memiliki properti:
      // - `path`: Path file di dalam bucket (misalnya "171234567890.jpeg").
      // - `token`: JWT (JSON Web Token) yang merupakan bagian query string dari signed URL, digunakan untuk otorisasi.
      // - `signedUrl`: URL lengkap yang bisa digunakan untuk upload (termasuk path dan token).
      // Untuk `uploadToSignedUrl` di client, ia memerlukan `path` dan `token` (JWT-nya) secara terpisah.
      return data; // Mengembalikan objek { path: string, token: string, signedUrl: string }
    },
  ),

  createProduct: protectedProcedure
    .input(
      z.object({
        name: z.string().min(3, "Product name must be at least 3 characters."),
        // `price` diterima sebagai angka. Jika dari form HTML, pastikan dikonversi ke number.
        price: z.number().min(1000, "Price must be at least 1000."),
        categoryId: z.string(), // Validasi lebih lanjut (misalnya .uuid()) bisa ditambahkan jika ID kategori punya format spesifik.
        imageUrl: z.string().url("Please provide a valid image URL."),
        // `multipart/form-data` tidak digunakan di sini karena file di-upload terpisah via Pre-signed URL.
        // Input ini hanya menerima URL gambar (JSON).
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx; // Akses Prisma client

      const newProduct = await db.product.create({
        // `await` karena operasi database asynchronous
        data: {
          name: input.name,
          price: input.price,
          imageUrl: input.imageUrl,
          // Menghubungkan produk ini dengan kategori yang sudah ada menggunakan ID kategori.
          category: {
            connect: {
              id: input.categoryId,
            },
          },
        },
        select: {
          // Pilih field dari produk yang baru dibuat untuk dikembalikan ke client
          id: true,
          name: true,
          // ... field lain jika perlu
        },
      });

      // Setelah produk dibuat, idealnya `productCount` di tabel Category diupdate.
      // Ini bisa dilakukan dengan query tambahan atau trigger database.
      // await db.category.update({
      //   where: { id: input.categoryId },
      //   data: { productCount: { increment: 1 } },
      // });

      return newProduct; // Kembalikan data produk yang baru dibuat.
    }),

  // TODO: Implementasi Update Product
  // updateProduct: protectedProcedure.input(...).mutation(async ({ ctx, input }) => { ... }),

  // TODO: Implementasi Delete Product
  // deleteProduct: protectedProcedure.input(...).mutation(async ({ ctx, input }) => { ... }),
});
