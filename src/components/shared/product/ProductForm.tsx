// UI Components
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // Komponen Label dari Shadcn/UI
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Libs & Enums
import { uploadFileToSignedUrl } from "@/lib/supabase"; // Fungsi helper untuk upload ke signed URL
import { Bucket } from "@/server/bucket"; // Enum untuk nama bucket

// API & Types
import { api } from "@/utils/api"; // tRPC API client
import type { ProductFormSchema } from "@/forms/product"; // Tipe data untuk form produk

// React Hooks
import { useState, type ChangeEvent } from "react";
import { useFormContext } from "react-hook-form"; // Hook untuk mengakses konteks form dari parent.

// Mendefinisikan tipe untuk props yang diterima oleh komponen ProductForm.
// Ini memastikan komponen digunakan dengan benar dan memberikan type safety.
type ProductFormProps = {
  onSubmit: (values: ProductFormSchema) => void; // Fungsi yang dipanggil saat form disubmit
  onChangeImageUrl: (imageUrl: string) => void; // Fungsi callback setelah gambar berhasil diunggah & URL didapat
};

export const ProductForm = ({
  onSubmit,
  onChangeImageUrl,
}: ProductFormProps) => {
  const form = useFormContext<ProductFormSchema>();

  // Mengambil daftar kategori untuk dropdown menggunakan query tRPC
  const { data: categories } = api.category.getCategories.useQuery();

  // Mutation tRPC untuk membuat Pre-signed URL untuk upload gambar
  const { mutateAsync: createImageSignedUrl } =
    api.product.createProductImageUploadSignedUrl.useMutation();

  // Handler yang dipanggil ketika pengguna memilih file gambar.
  const imageChangeHandler = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files; // Mendapatkan daftar file dari event input.

    // Pastikan ada file yang dipilih.
    if (files && files?.length > 0) {
      const file = files[0]; // Ambil file pertama (biasanya input file hanya satu).

      if (!file) return; // Jika file null/undefined, hentikan proses.

      const { path, token } = await createImageSignedUrl();

      // Upload file ke Pre-signed URL menggunakan fungsi helper.
      const imageUrl = await uploadFileToSignedUrl({
        bucket: Bucket.ProductImages, // Nama bucket dari enum.
        file, // File yang akan di-upload.
        path, // Path file di bucket (dari backend).
        token, // Token otorisasi (JWT dari backend).
      });

      // Panggil callback `onChangeImageUrl` dengan URL publik gambar.
      // Ini akan mengupdate state di komponen induk (misalnya `uploadedCreateProductImageUrl`).
      onChangeImageUrl(imageUrl);
      alert("Product image uploaded successfully!");
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Product Name</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="price"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Price</FormLabel>
            <FormControl>
              <Input type="number" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="categoryId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Category</FormLabel>
            <FormControl>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((category) => {
                    return (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="space-y-1">
        <Label>Product Image</Label>
        <Input onChange={imageChangeHandler} type="file" accept="images/*" />
      </div>
    </form>
  );
};
