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
            console.log("info store: 开始获取系统信息");
            set({ isLoading: true, error: null });
            const response = await fetch("/api/info");
            console.log("info store: API 响应状态", response.status, response.ok);
            if (!response.ok) {
                throw new Error("获取系统信息失败");
            }
            const data = await response.json();
            console.log("info store: 获取到的数据", data);
            set({ info: data, isLoading: false });
        } catch (error) {
            console.error("获取系统信息失败:", error);
            set({ error: "获取系统信息失败", isLoading: false });
        }
    },
})); 