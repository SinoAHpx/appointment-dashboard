import { create } from "zustand";

export interface SystemInfo {
    notes: string;
    company_name: string;
    company_address: string;
    company_phone: string;
    company_email: string;
}

interface SystemInfoStore {
    info: SystemInfo | null;
    isLoading: boolean;
    error: string | null;
    fetchInfo: () => Promise<void>;
}

export const useSystemInfoStore = create<SystemInfoStore>((set) => ({
    info: null,
    isLoading: false,
    error: null,
    fetchInfo: async () => {
        try {
            set({ isLoading: true, error: null });
            const response = await fetch("/api/info");
            if (!response.ok) {
                throw new Error("获取系统信息失败");
            }
            const data = await response.json();
            set({ info: data, isLoading: false });
        } catch (error) {
            console.error("获取系统信息失败:", error);
            set({ error: "获取系统信息失败", isLoading: false });
        }
    },
})); 