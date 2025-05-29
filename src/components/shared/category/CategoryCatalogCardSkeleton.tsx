import { Skeleton } from "@/components/ui/skeleton";

export const CategoryCatalogCardSkeleton = () => {
    return (
        <div className="space-y-3 rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
            {/* Meniru struktur CategoryCtalogCard */}
            <Skeleton className="h-6 w-3/4 rounded" /> {/* Untuk nama kategori */}
            <Skeleton className="h-4 w-1/2 rounded" /> {/* Untuk product count */}
            {/* Jika ada elemen lain di card, tambahkan skeleton untuk itu */}
            <div className="flex justify-end space-x-2 pt-3"> {/* Opsional: jika ada tombol di card */}
                <Skeleton className="h-9 w-20 rounded-md" />
                <Skeleton className="h-9 w-20 rounded-md" />
            </div>
        </div>
    );
};