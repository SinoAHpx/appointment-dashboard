import { create } from "zustand";
import { persist } from "zustand/middleware";

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
    lastFetchTime: number | null;
    // 缓存有效时间（5分钟）
    cacheValidTime: number;
    fetchInfo: (forceRefresh?: boolean) => Promise<void>;
    updateInfo: (info: SystemInfo) => Promise<boolean>;
    clearError: () => void;
}

export const useSystemInfoStore = create<SystemInfoStore>()(
    persist(
        (set, get) => ({
            info: null,
            isLoading: false,
            error: null,
            lastFetchTime: null,
            cacheValidTime: 5 * 60 * 1000, // 5分钟

            fetchInfo: async (forceRefresh = false) => {
                const state = get();

                // 检查缓存是否有效
                if (!forceRefresh && state.info && state.lastFetchTime) {
                    const cacheAge = Date.now() - state.lastFetchTime;
                    if (cacheAge < state.cacheValidTime) {
                        console.log("info store: 使用缓存数据，缓存剩余时间:", (state.cacheValidTime - cacheAge) / 1000, "秒");
                        return;
                    }
                }

                // 如果正在加载，避免重复请求
                if (state.isLoading) {
                    console.log("info store: 已在加载中，跳过重复请求");
                    return;
                }

                try {
                    console.log("info store: 开始获取系统信息");
                    set({ isLoading: true, error: null });

                    const response = await fetch("/api/info", {
                        cache: 'no-store' // 确保获取最新数据
                    });

                    console.log("info store: API 响应状态", response.status, response.ok);

                    if (!response.ok) {
                        throw new Error(`获取系统信息失败: HTTP ${response.status}`);
                    }

                    const data = await response.json();
                    console.log("info store: 获取到的数据", data);

                    set({
                        info: data,
                        isLoading: false,
                        error: null,
                        lastFetchTime: Date.now()
                    });
                } catch (error) {
                    console.error("获取系统信息失败:", error);
                    const errorMessage = error instanceof Error ? error.message : "获取系统信息失败";
                    set({
                        error: errorMessage,
                        isLoading: false
                    });
                    throw error;
                }
            },

            updateInfo: async (info: SystemInfo) => {
                try {
                    set({ isLoading: true, error: null });

                    const response = await fetch("/api/info", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(info),
                    });

                    if (!response.ok) {
                        throw new Error(`更新系统信息失败: HTTP ${response.status}`);
                    }

                    // 更新本地数据和缓存时间
                    set({
                        info,
                        isLoading: false,
                        error: null,
                        lastFetchTime: Date.now()
                    });

                    console.log("info store: 系统信息更新成功");
                    return true;
                } catch (error) {
                    console.error("更新系统信息失败:", error);
                    const errorMessage = error instanceof Error ? error.message : "更新系统信息失败";
                    set({
                        error: errorMessage,
                        isLoading: false
                    });
                    return false;
                }
            },

            clearError: () => {
                set({ error: null });
            },
        }),
        {
            name: "system-info-storage",
            partialize: (state) => ({
                info: state.info,
                lastFetchTime: state.lastFetchTime,
            }),
        }
    )
); 