import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { createQRIS } from "@/server/xendit"; // Fungsi untuk membuat QRIS dari Xendit

export const orderRouter = createTRPCRouter({
  createOrder: protectedProcedure
    .input(
      // Penjelasan Input Zod:
      // Ini adalah definisi skema validasi untuk input `createOrder`.
      // `z.object({ ... })` berarti input harus berupa sebuah objek.
      // Objek ini memiliki satu properti bernama `orderItems`.
      //
      // `orderItems: z.array(...)` berarti `orderItems` harus berupa sebuah array.
      //
      // `z.array(z.object({ ... }))` berarti setiap elemen dalam array `orderItems`
      // harus berupa sebuah objek.
      //
      // Objek di dalam array tersebut harus memiliki dua properti:
      //   1. `productId: z.string()`: `productId` harus berupa string.
      //   2. `quantity: z.number().min(1)`: `quantity` harus berupa angka (number)
      //      dan nilainya minimal 1 (`.min(1)`).
      //
      // Jadi, secara keseluruhan, input yang diharapkan adalah objek seperti ini:
      // {
      //   orderItems: [
      //     { productId: "id-produk-1", quantity: 2 },
      //     { productId: "id-produk-2", quantity: 1 },
      //     // ... item lainnya
      //   ]
      // }
      z.object({
        orderItems: z.array(
          z.object({
            productId: z.string(),
            quantity: z.number().min(1),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx; // Akses prisma client spt biasa
      const { orderItems } = input; // `orderItems` dari input yang sudah divalidasi Zod

      // Mengambil data produk yang aktual dari database berdasarkan ID produk yang ada di `orderItems`.
      // Ini penting untuk memastikan harga dan detail produk lainnya diambil dari sumber yang terpercaya (database),
      // bukan dari data yang mungkin dimanipulasi di frontend ya guys yakj.
      const products = await db.product.findMany({
        // Penjelasan Prisma `findMany` dengan `where` dan `in`:
        // `db.product.findMany({ ... })` adalah query Prisma untuk mengambil beberapa record dari tabel `Product`.
        //
        // `where: { ... }` adalah klausa untuk memfilter record yang akan diambil.
        //
        // `id: { ... }` berarti kita memfilter berdasarkan kolom `id` di tabel `Product`.
        //
        // `in: orderItems.map((item) => item.productId)` berarti kita mencari produk
        // yang kolom `id`-nya ada di dalam array yang dihasilkan oleh `orderItems.map(...)`.
        //
        // `orderItems.map((item) => item.productId)` akan membuat array baru yang hanya berisi
        // `productId` dari setiap item di `orderItems`.
        // Misalnya, jika `orderItems` adalah `[{ productId: "A", qty: 1 }, { productId: "B", qty: 2 }]`,
        // maka `orderItems.map(...)` akan menghasilkan `["A", "B"]`.
        //
        // Jadi, query ini akan mengambil semua produk dari database yang ID-nya
        // cocok dengan salah satu ID produk yang dikirimkan oleh client dalam `orderItems`.
        where: {
          id: {
            in: orderItems.map((item) => item.productId),
          },
        },
        // select: { id: true, name: true, price: true } // Opsional: Pilih hanya field yang dibutuhkan
      });

      let subtotal = 0;

      // Menghitung subtotal berdasarkan harga produk dari database dan kuantitas dari input.
      products.forEach((product) => {
        // Ambil kuantitas untuk produk saat ini dari `orderItems` input.
        // Tanda seru `!` (non-null assertion operator) digunakan di sini karena kita berasumsi
        // setiap produk yang diambil dari DB pasti ada pasangannya di `orderItems`
        const productQuantity = orderItems.find(
          (item) => item.productId === product.id,
        )!.quantity;

        const totalPrice = product.price * productQuantity;
        subtotal += totalPrice;
      });

      const tax = subtotal * 0.1;
      const grandTotal = subtotal + tax;

      // Membuat record Order baru di database
      const order = await db.order.create({
        data: {
          grandTotal,
          subtotal,
          tax,
          // status akan default ke AWAITING_PAYMENT sesuai skema
        },
      });

      const newOrderItems = await db.orderItem.createMany({
        data: products.map((product) => {
          const productQuantity = orderItems.find(
            (item) => item.productId === product.id,
          )!.quantity;

          return {
            orderId: order.id,
            price: product.price,
            productId: product.id,
            quantity: productQuantity,
          };
        }),
      });

      // Membuat permintaan pembayaran QRIS melalui Xendit
      const paymentRequest = await createQRIS({
        amount: grandTotal,
        orderId: order.id, // Menggunakan ID order dari database sebagai referensi
      });

      // Update order di database dengan ID transaksi eksternal dan ID metode pembayaran dari Xendit
      await db.order.update({
        where: {
          id: order.id,
        },
        data: {
          externalTransactionId: paymentRequest.id, // ID dari Xendit Payment Request
          paymentMethodId: paymentRequest.paymentMethod.id, // ID metode pembayaran dari Xendit
        },
      });

      // Mengembalikan data order, item order, dan string QR untuk ditampilkan di client
      return {
        order, // Objek order yang baru dibuat
        newOrderItems,
        qrString:
          paymentRequest.paymentMethod.qrCode?.channelProperties!.qrString!,
        // String QR dari Xendit
      };
    }),
});
