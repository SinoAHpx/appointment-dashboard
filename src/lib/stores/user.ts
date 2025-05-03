import { create } from "zustand";
import { User } from "./auth";

export interface AdminUser extends Omit<User, "id"> {
    id: number;
    createdAt: string;
    password?: string;
}

interface UserState {
    users: AdminUser[];
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchUsers: () => Promise<boolean>;
    addUser: (user: Omit<AdminUser, "id" | "createdAt">) => Promise<boolean>;
    updateUser: (id: number, user: Partial<AdminUser>) => Promise<boolean>;
    deleteUser: (id: number) => Promise<boolean>;
}

export const useUserStore = create<UserState>()((set, get) => ({
    users: [],
    isLoading: false,
    error: null,

    fetchUsers: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch("/api/users");
            const data = await response.json();

            if (data.success) {
                set({ users: data.users, isLoading: false });
                return true;
            } else {
                set({ error: data.message || "获取用户失败", isLoading: false });
                return false;
            }
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "获取用户时发生错误",
                isLoading: false
            });
            return false;
        }
    },

    addUser: async (userData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch("/api/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(userData),
            });

            const data = await response.json();

            if (data.success) {
                // Add the new user to the store
                set((state) => ({
                    users: [...state.users, data.user],
                    isLoading: false,
                }));
                return true;
            } else {
                set({
                    error: data.message || "创建用户失败",
                    isLoading: false
                });
                return false;
            }
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "创建用户时发生错误",
                isLoading: false
            });
            return false;
        }
    },

    updateUser: async (id, userData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`/api/users/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(userData),
            });

            const data = await response.json();

            if (data.success) {
                // Update the user in the store
                set((state) => ({
                    users: state.users.map((user) =>
                        user.id === id ? { ...user, ...data.user } : user
                    ),
                    isLoading: false,
                }));
                return true;
            } else {
                set({
                    error: data.message || "更新用户失败",
                    isLoading: false
                });
                return false;
            }
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "更新用户时发生错误",
                isLoading: false
            });
            return false;
        }
    },

    deleteUser: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`/api/users/${id}`, {
                method: "DELETE",
            });

            const data = await response.json();

            if (data.success) {
                // Remove the user from the store
                set((state) => ({
                    users: state.users.filter((user) => user.id !== id),
                    isLoading: false,
                }));
                return true;
            } else {
                set({
                    error: data.message || "删除用户失败",
                    isLoading: false
                });
                return false;
            }
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "删除用户时发生错误",
                isLoading: false
            });
            return false;
        }
    },
})); 