import { create } from "zustand";

interface CheckoutStore {
  pricing: {
    basicServicePrice: number;
    sortingServicePrice: number;
    packagingServicePrice: number;
  };
  loading: boolean;
  error: string | null;

  // 操作方法
  setPricing: (pricing: CheckoutStore['pricing']) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // API 操作
  fetchPricing: () => Promise<void>;
  updatePricing: (pricing: CheckoutStore['pricing']) => Promise<void>;
}

export const useCheckoutStore = create<CheckoutStore>((set, get) => ({
  pricing: {
    basicServicePrice: 75,
    sortingServicePrice: 750,
    packagingServicePrice: 750,
  },
  loading: false,
  error: null,

  setPricing: (pricing) => set({ pricing }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  fetchPricing: async () => {
    try {
      set({ loading: true, error: null });
      const response = await fetch('/api/checkout');
      if (!response.ok) throw new Error('获取价格设置失败');
      const pricing = await response.json();
      set({ pricing });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '获取价格设置失败' });
    } finally {
      set({ loading: false });
    }
  },

  updatePricing: async (pricing) => {
    try {
      set({ loading: true, error: null });
      const response = await fetch('/api/checkout', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pricing),
      });
      if (!response.ok) throw new Error('更新价格设置失败');
      set({ pricing });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '更新价格设置失败' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
})); 