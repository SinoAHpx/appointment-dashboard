import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// 用户类型定义
export interface User {
    id: string | number;
    username: string;
    name: string;
    role: "admin" | "user" | "waste_disposal_merchant";
    phone?: string | null;
    isGovUser?: boolean;
}

// 认证状态类型定义
interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
    setUser: (user: User) => void;
    isAdmin: () => boolean;
}

// 检查是否在客户端
const isClient = typeof window !== 'undefined';

// 尝试从cookie或localStorage获取初始状态（仅在客户端）
const getInitialAuthState = () => {
    if (!isClient) return { user: null, isAuthenticated: false };

    // 尝试从客户端cookie获取（优先）
    try {
        const cookies = document.cookie.split(';');
        const authCookie = cookies.find(c => c.trim().startsWith('auth-storage-client='));

        if (authCookie) {
            const cookieValue = decodeURIComponent(authCookie.split('=')[1].trim());
            const data = JSON.parse(cookieValue);
            if (data?.state?.isAuthenticated && data?.state?.user) {
                return {
                    user: data.state.user,
                    isAuthenticated: true
                };
            }
        }
    } catch (e) {
        console.error('无法解析cookie中的认证信息', e);
    }

    // 尝试从localStorage获取（后备）
    try {
        const storage = localStorage.getItem('auth-storage');
        if (storage) {
            const data = JSON.parse(storage);
            if (data?.state?.isAuthenticated && data?.state?.user) {
                return {
                    user: data.state.user,
                    isAuthenticated: true
                };
            }
        }
    } catch (e) {
        console.error('无法解析localStorage中的认证信息', e);
    }

    return { user: null, isAuthenticated: false };
};

// 获取初始认证状态
const initialAuthState = getInitialAuthState();

// 认证状态存储
export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: initialAuthState.user,
            isAuthenticated: initialAuthState.isAuthenticated,
            login: async (username: string, password: string) => {
                try {
                    // 使用API调用进行登录验证
                    const response = await fetch("/api/auth", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ username, password }),
                        credentials: "include", // 确保包含cookies
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
            logout: async () => {
                try {
                    // 调用登出API清除服务器端cookie
                    await fetch("/api/auth/logout", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        credentials: "include", // 确保包含cookies
                    });
                } catch (error) {
                    console.error("登出API调用失败:", error);
                } finally {
                    // 无论API调用成功与否，都清除本地状态
                    set({ user: null, isAuthenticated: false });
                }
            },
            isAdmin: () => {
                const { user } = get();
                return user?.role === "admin";
            },
            setUser: (user: User) => {
                set({
                    user,
                    isAuthenticated: true,
                });
            },
        }),
        {
            name: "auth-storage",
            storage: createJSONStorage(() => (isClient ? localStorage : {
                getItem: () => null,
                setItem: () => { },
                removeItem: () => { }
            })),
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
            // 确保存储在客户端初始化
            skipHydration: true,
        },
    ),
); 