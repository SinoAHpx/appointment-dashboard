import { create } from "zustand";
import { persist } from "zustand/middleware";

// 用户类型定义
export interface User {
    id: string;
    username: string;
    name: string;
    role: "admin" | "user";
    email?: string;
}

// 认证状态类型定义
interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
    isAdmin: () => boolean;
}

// 认证状态存储
export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            login: async (username: string, password: string) => {
                try {
                    // 使用API调用进行登录验证
                    const response = await fetch("/api/auth", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ username, password }),
                    });

                    const data = await response.json();

                    if (data.success && data.user) {
                        set({
                            user: data.user,
                            isAuthenticated: true,
                        });
                        return true;
                    }
                    return false;
                } catch (error) {
                    console.error("登录失败:", error);
                    return false;
                }
            },
            logout: () => {
                set({ user: null, isAuthenticated: false });
            },
            isAdmin: () => {
                const { user } = get();
                return user?.role === "admin";
            },
        }),
        {
            name: "auth-storage",
        },
    ),
); 