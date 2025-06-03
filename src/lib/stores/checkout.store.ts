import { create } from "zustand";
import { ServiceItem, CreateServiceItemInput, UpdateServiceItemInput } from "@/lib/db/checkout.queries";

interface CheckoutStore {
  // 传统价格设置（保持向后兼容）
  pricing: {
    basicServicePrice: number;
    sortingServicePrice: number;
    packagingServicePrice: number;
  };

  // 动态服务项目
  serviceItems: ServiceItem[];
  activeServiceItems: ServiceItem[];

  loading: boolean;
  error: string | null;

  // 操作方法
  setPricing: (pricing: CheckoutStore['pricing']) => void;
  setServiceItems: (items: ServiceItem[]) => void;
  setActiveServiceItems: (items: ServiceItem[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // 传统API操作（保持向后兼容）
  fetchPricing: () => Promise<void>;
  updatePricing: (pricing: CheckoutStore['pricing']) => Promise<void>;

  // 新的服务项目API操作
  fetchServiceItems: (activeOnly?: boolean) => Promise<void>;
  createServiceItem: (data: CreateServiceItemInput) => Promise<boolean>;
  updateServiceItem: (id: number, data: UpdateServiceItemInput) => Promise<boolean>;
  deleteServiceItem: (id: number) => Promise<boolean>;
}

export const useCheckoutStore = create<CheckoutStore>((set, get) => ({
  pricing: {
    basicServicePrice: 75,
    sortingServicePrice: 750,
    packagingServicePrice: 750,
  },
  serviceItems: [],
  activeServiceItems: [],
  loading: false,
  error: null,

  setPricing: (pricing) => set({ pricing }),
  setServiceItems: (serviceItems) => set({ serviceItems }),
  setActiveServiceItems: (activeServiceItems) => set({ activeServiceItems }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // 传统方法
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

  // 新的服务项目方法
  fetchServiceItems: async (activeOnly = false) => {
    try {
      set({ loading: true, error: null });
      const url = activeOnly
        ? '/api/checkout/service-items?active=true'
        : '/api/checkout/service-items';

      const response = await fetch(url);
      if (!response.ok) throw new Error('获取服务项目失败');

      const result = await response.json();
      if (!result.success) throw new Error(result.error || '获取服务项目失败');

      if (activeOnly) {
        set({ activeServiceItems: result.data });
      } else {
        set({ serviceItems: result.data });
        // 同时更新活跃项目列表
        const activeItems = result.data.filter((item: ServiceItem) => item.isActive);
        set({ activeServiceItems: activeItems });
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '获取服务项目失败' });
    } finally {
      set({ loading: false });
    }
  },

  createServiceItem: async (data) => {
    try {
      set({ loading: true, error: null });
      const response = await fetch('/api/checkout/service-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('创建服务项目失败');

      const result = await response.json();
      if (!result.success) throw new Error(result.error || '创建服务项目失败');

      // 重新获取服务项目列表
      await get().fetchServiceItems();

      return true;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '创建服务项目失败' });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  updateServiceItem: async (id, data) => {
    try {
      set({ loading: true, error: null });
      const response = await fetch(`/api/checkout/service-items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('更新服务项目失败');

      const result = await response.json();
      if (!result.success) throw new Error(result.error || '更新服务项目失败');

      // 重新获取服务项目列表
      await get().fetchServiceItems();

      return true;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '更新服务项目失败' });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  deleteServiceItem: async (id) => {
    try {
      set({ loading: true, error: null });
      const response = await fetch(`/api/checkout/service-items/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('删除服务项目失败');

      const result = await response.json();
      if (!result.success) throw new Error(result.error || '删除服务项目失败');

      // 重新获取服务项目列表
      await get().fetchServiceItems();

      return true;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '删除服务项目失败' });
      return false;
    } finally {
      set({ loading: false });
    }
  },
})); 