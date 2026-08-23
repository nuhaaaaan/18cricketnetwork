import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CartItem {
  product_id: string;
  product_name: string;
  vendor_id: string;
  vendor_name: string;
  quantity: number;
  price: number;
  image?: string;
}

interface CartStore {
  items: CartItem[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getCount: () => number;
}

const persist = async (items: CartItem[]) => {
  await AsyncStorage.setItem('cart', JSON.stringify(items));
};

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem('cart');
      set({ items: raw ? JSON.parse(raw) : [], hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  addItem: (item: CartItem) => {
    const { items } = get();
    const existingItem = items.find((i) => i.product_id === item.product_id);
    const next = existingItem
      ? items.map((i) =>
          i.product_id === item.product_id
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        )
      : [...items, item];
    set({ items: next });
    persist(next);
  },

  removeItem: (productId: string) => {
    const next = get().items.filter((i) => i.product_id !== productId);
    set({ items: next });
    persist(next);
  },

  updateQuantity: (productId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    const next = get().items.map((i) =>
      i.product_id === productId ? { ...i, quantity } : i
    );
    set({ items: next });
    persist(next);
  },

  clearCart: () => {
    set({ items: [] });
    persist([]);
  },

  getTotal: () => get().items.reduce((total, item) => total + item.price * item.quantity, 0),
  getCount: () => get().items.reduce((count, item) => count + item.quantity, 0),
}));
