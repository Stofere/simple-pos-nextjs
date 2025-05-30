// Layout & Shared Components
import {
  DashboardDescription,
  DashboardHeader,
  DashboardLayout,
  DashboardTitle,
} from "@/components/layouts/DashboardLayout";
import { PRODUCTS } from "@/data/mock";
import { ProductMenuCard } from "@/components/shared/product/ProductMenuCard";
import { ProductCatalogCard } from "@/components/shared/product/ProductCatalogCard"; // Komponen untuk menampilkan produk
import { ProductForm } from "@/components/shared/product/ProductForm"; // Komponen form produk terpisah

// React & Next.js
import type { NextPageWithLayout } from "../_app";
import { useState, type ReactElement } from "react";

// tRPC API Client
import { api } from "@/utils/api";

// UI Components (Shadcn/UI)
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form"; // Komponen Form dari Shadcn/UI, biasanya wrapper untuk <FormProvider>
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// React Hook Form & Zod
import { useForm } from "react-hook-form";
import { productFormSchema, type ProductFormSchema } from "@/forms/product";
import { zodResolver } from "@hookform/resolvers/zod";

// =================================================================================
// PRODUCTS PAGE COMPONENT
// =================================================================================
const ProductsPage: NextPageWithLayout = () => {
  const apiUtils = api.useUtils();
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // STATES
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // State untuk menyimpan URL gambar produk yang baru di-upload sebelum form disubmit.
  const [uploadedCreateProductImageUrl, setUploadCreateProductImageUrl] =
    useState<string | null>(null);
  // State untuk mengontrol visibilitas dialog pembuatan produk baru.
  const [createProductDialogOpen, setCreateProductDialogOpen] = useState(false);
  // TODO: Tambahkan state untuk dialog edit dan delete produk jika diperlukan
  // const [editProductDialogOpen, setEditProductDialogOpen] = useState(false);
  // const [productToEditId, setProductToEditId] = useState<string | null>(null);
  // const [productToDeleteId, setProductToDeleteId] = useState<string | null>(null);

  // --- Queries ---
  // Mengambil daftar produk dari backend menggunakan query tRPC.
  const { data: products } = api.product.getProducts.useQuery();

  // --- Mutations ---
  // Mutation tRPC untuk membuat produk baru.
  const { mutate: createProduct } = api.product.createProduct.useMutation({
    onSuccess: async () => {
      await apiUtils.product.getProducts.invalidate();

      alert("Succesfuly created new product");
      setCreateProductDialogOpen(false);
    },
  });

  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // FORM INITIALIZATION (React Hook Form)
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // Inisialisasi form untuk pembuatan produk baru.
  const createProductForm = useForm<ProductFormSchema>({
    resolver: zodResolver(productFormSchema),
  });

  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // EVENT HANDLERS
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // Handler untuk submit form pembuatan produk baru.
  const handleSubmitCreateProduct = (values: ProductFormSchema) => {
    if (!uploadedCreateProductImageUrl) {
      alert("Please upload a product image first!");
      return;
    }
    // Panggil mutation `createProduct` dengan data dari form dan URL gambar.
    createProduct({
      name: values.name,
      price: values.price,
      categoryId: values.categoryId,
      imageUrl: uploadedCreateProductImageUrl,
    });
  };

  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // RENDER LOGIC & JSX
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  return (
    <>
      {/* HEADER HALAMAN & TOMBOL TAMBAH PRODUK */}
      <DashboardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <DashboardTitle>Product Management</DashboardTitle>
            <DashboardDescription>
              View, add, edit, and delete products in your inventory.
            </DashboardDescription>
          </div>

          {/* Dialog untuk Tambah Produk Baru */}
          <AlertDialog
            open={createProductDialogOpen}
            onOpenChange={setCreateProductDialogOpen}
          >
            <AlertDialogTrigger asChild>
              <Button>Add New Product</Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Create Product</AlertDialogTitle>
              </AlertDialogHeader>
              <Form {...createProductForm}>
                <ProductForm
                  onSubmit={handleSubmitCreateProduct}
                  onChangeImageUrl={(imageUrl) => {
                    setUploadCreateProductImageUrl(imageUrl);
                  }}
                />
              </Form>

              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <Button
                  onClick={createProductForm.handleSubmit(
                    handleSubmitCreateProduct,
                  )}
                >
                  Create Product
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DashboardHeader>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products?.map((product) => {
          return (
            <ProductCatalogCard
              key={product.id}
              name={product.name}
              price={product.price}
              image={product.imageUrl ?? ""}
              category={product.category.name}
            />
          );
        })}
      </div>
    </>
  );
};

ProductsPage.getLayout = (page: ReactElement) => {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default ProductsPage;
