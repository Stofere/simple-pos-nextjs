import { create } from "zustand"; // Fungsi `create` dari Zustand untuk membuat store

// Mendefinisikan tipe untuk satu item di dalam keranjang belanja.
type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
};

// Mendefinisikan tipe untuk item yang akan ditambahkan ke keranjang.
// `Omit<CartItem, "quantity">` adalah tipe utilitas TypeScript.
// Penjelasan Omit:
// `Omit<T, K>` membuat tipe baru dengan mengambil semua properti dari tipe `T`
// KECUALI properti yang disebutkan dalam `K`.
// Dalam kasus ini, `AddToCartItem` akan memiliki semua properti dari `CartItem`
// (yaitu `productId`, `name`, `price`, `imageUrl`) kecuali properti `quantity`.
// Ini karena saat menambahkan item baru ke keranjang, kuantitasnya akan di-handle
// secara internal oleh logika store (default ke 1 jika item baru, atau increment jika sudah ada).

type AddToCartItem = Omit<CartItem, "quantity">;

// Mendefinisikan antarmuka (interface) untuk state keranjang belanja.
// Ini mencakup array `items` (berisi `CartItem`) dan fungsi `addToCart`.
interface CartState {
  items: CartItem[];
  addToCart: (newItem: AddToCartItem) => void;
  // TODO: Tambahkan fungsi lain jika perlu (misalnya, removeFromCart, updateQuantity, clearCart)
}

// Membuat store Zustand.
// `create<CartState>()` menginisialisasi store dengan tipe `CartState`.
// Fungsi callback `(set) => ({ ... })` mendefinisikan state awal dan action (fungsi untuk mengubah state).
export const useCartStore = create<CartState>()((set) => ({
  items: [], // State awal: keranjang kosong.
  addToCart: (newItem) => {
    // `set` adalah fungsi yang disediakan Zustand untuk memperbarui state.
    // Ia menerima fungsi callback yang argumennya adalah `currentState` (state saat ini).
    // Fungsi callback ini HARUS mengembalikan objek yang berisi bagian state yang ingin diubah.
    set((currentState) => {
      // Prinsip Immutability dalam State Management:
      // "State = immutable -> gaboleh value-nya diubah secara langsung"
      // Penjelasan Immutability:
      // Immutability berarti bahwa sekali sebuah objek state dibuat, ia tidak boleh diubah secara langsung (mutasi).
      // Sebaliknya, untuk mengubah state, Anda harus membuat salinan dari state lama,
      // melakukan perubahan pada salinan tersebut, dan kemudian mengganti state lama dengan salinan yang baru.

      // Mengapa Immutability Penting?
      // 1. Pelacakan Perubahan (Change Detection): Library seperti React dan Zustand mengandalkan
      //    perbandingan referensi objek untuk mendeteksi perubahan state. Jika Anda memutasi objek
      //    state secara langsung, referensi objeknya tetap sama, sehingga library mungkin tidak
      //    mendeteksi perubahan dan UI tidak akan diperbarui. Dengan membuat objek baru,
      //    referensinya berubah, dan perubahan terdeteksi.

      // 2. Prediktabilitas & Debugging: Alur data menjadi lebih jelas. Mudah untuk melacak kapan dan bagaimana state berubah. Ini sangat membantu saat debugging.
      // 3. Fitur Lanjutan: Memungkinkan fitur seperti time-travel debugging (mundur ke state sebelumnya).
      // 4. Performa: Dalam beberapa kasus, perbandingan referensi lebih cepat daripada deep comparison objek.

      // Cara Menerapkan Immutability:
      // - Untuk Array: Gunakan metode array yang mengembalikan array baru (misalnya, `map`, `filter`, `slice`, spread operator `...`).
      //   Hindari metode yang memutasi array asli (misalnya, `push` ke array asli, `splice` pada array asli tanpa menyalin dulu).
      // - Untuk Objek: Gunakan spread operator `{ ...objekLama, propertiBaru: nilaiBaru }` atau `Object.assign({}, objekLama, ...)`.

      // Membuat salinan dari array `items` saat ini menggunakan spread operator.
      // Ini penting untuk immutability. `duplicateItems` adalah array baru.
      const duplicateItems = [...currentState.items];

      // Mencari apakah `newItem` sudah ada di dalam `duplicateItems` berdasarkan `productId`.
      // `findIndex` mengembalikan indeks item jika ditemukan, atau -1 jika tidak ditemukan.
      // artinya kita nyari didalam duplicate item ada nggak yang productId nya sama dengan productId dari item yang kita mau tambahin "kita cari indexnya"
      const existingItemIndex = duplicateItems.findIndex(
        (item) => item.productId === newItem.productId,
      ); // artinya kita nyari didalam duplicate item ada nggak yang productId nya sama dengan productId dari item yang kita mau tambahin "kita cari indexnya"

      // Jika item belum ada di keranjang (indeks adalah -1)
      if (existingItemIndex === -1) {
        // Tambahkan `newItem` ke `duplicateItems` sebagai `CartItem` baru dengan `quantity: 1`.
        // `push` di sini aman karena dilakukan pada `duplicateItems` (salinan), bukan `currentState.items`.
        duplicateItems.push({
          // Properti dari `newItem` (yang bertipe `AddToCartItem`)
          productId: newItem.productId,
          name: newItem.name,
          imageUrl: newItem.imageUrl,
          price: newItem.price,
          // Tambahkan `quantity`
          quantity: 1,
        });
      } else {
        // Jika item sudah ada di keranjang.
        // Ambil referensi ke item yang sudah ada di dalam `duplicateItems`
        const itemToUpdate = duplicateItems[existingItemIndex];

        // Pengecekan tambahan untuk keamanan (seharusnya `itemToUpdate` selalu ada jika `existingItemIndex !== -1`).
        if (!itemToUpdate)
          // Jika karena suatu alasan item tidak ditemukan (seharusnya tidak terjadi),
          // kembalikan state saat ini tanpa perubahan.
          return {
            ...currentState,
          };

        // Tingkatkan kuantitas item yang sudah ada.
        // Ini memutasi objek `itemToUpdate` di dalam array `duplicateItems`.
        // Karena `duplicateItems` adalah salinan baru dari array `items` asli,
        // dan kita akan mengembalikan `{ items: duplicateItems }`, ini masih dianggap
        // pembaruan yang immutable untuk `currentState.items` secara keseluruhan.
        itemToUpdate.quantity += 1;
      }

      // Mengembalikan objek state yang baru.
      // `...currentState` (Spread Operator):
      // Penjelasan Spread Operator (`...`):
      // Spread operator digunakan untuk "menyebarkan" elemen dari array atau properti dari objek
      // ke dalam array atau objek baru.
      //
      // Dalam Konteks Objek (seperti di sini):
      // `{ ...objekLama, propertiBaru: nilaiBaru }`
      // Ini membuat objek baru yang berisi semua properti dan nilai dari `objekLama`.
      // Jika ada `propertiBaru` yang namanya sama dengan properti di `objekLama`, nilainya akan ditimpa.
      // Jika `propertiBaru` adalah properti yang belum ada, ia akan ditambahkan.
      //
      // Di sini, `{ ...currentState, items: duplicateItems }` berarti:
      // 1. Buat objek baru.
      // 2. Salin semua properti dari `currentState` (state lama) ke objek baru ini.
      // 3. Kemudian, timpa properti `items` di objek baru ini dengan nilai dari `duplicateItems` (array yang sudah dimodifikasi).
      // Ini memastikan bahwa properti lain di `currentState` (jika ada) tetap dipertahankan,
      // dan hanya properti `items` yang diperbarui dengan referensi array yang baru.
      return {
        ...currentState,
        items: duplicateItems,
      };
    });
  },
}));
