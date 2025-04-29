import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
    id?: string
    username: string
}

interface AuthState {
    user: User | null
    isAuthenticated: boolean
    login: (username: string, password: string) => Promise<boolean>
    logout: () => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            login: async (username: string, password: string) => {
                // 模拟登录请求，实际项目中替换为真实API调用
                try {
                    // 示例简单验证
                    if (username && password.length >= 6) {
                        set({
                            user: { id: '1', username },
                            isAuthenticated: true
                        })
                        return true
                    }
                    return false
                } catch (error) {
                    console.error('登录失败:', error)
                    return false
                }
            },
            logout: () => {
                set({ user: null, isAuthenticated: false })
            }
        }),
        {
            name: 'auth-storage'
        }
    )
) 