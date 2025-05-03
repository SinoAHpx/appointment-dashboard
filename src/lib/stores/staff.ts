import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type Staff as DbStaff } from "../staff.queries";

// 导出员工类型
export type Staff = DbStaff;

// 员工管理状态类型定义
interface StaffState {
    staffList: Staff[];
    isLoading: boolean;
    error: string | null;
    fetchStaff: () => Promise<void>;
    addStaff: (name: string, status?: Staff["status"]) => Promise<boolean>;
    updateStaff: (
        id: number,
        data: Partial<Pick<Staff, "name" | "status">>,
    ) => Promise<boolean>;
    deleteStaff: (id: number) => Promise<boolean>;
}

// Staff Management State Store
export const useStaffStore = create<StaffState>()(
    persist(
        (set, get) => ({
            staffList: [],
            isLoading: false,
            error: null,
            fetchStaff: async () => {
                set({ isLoading: true, error: null });
                try {
                    // Use API endpoint
                    const response = await fetch("/api/staff");
                    const data = await response.json();

                    if (data.success) {
                        set({ staffList: data.staffList, isLoading: false });
                    } else {
                        throw new Error(data.message || "获取员工列表失败");
                    }
                } catch (error) {
                    console.error("Failed to fetch staff:", error);
                    set({ isLoading: false, error: (error as Error).message });
                }
            },
            addStaff: async (name, status) => {
                set({ isLoading: true, error: null });
                try {
                    // Use API endpoint
                    const response = await fetch("/api/staff", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ name, status }),
                    });

                    const data = await response.json();

                    if (data.success && data.staff) {
                        set((state) => ({
                            staffList: [...state.staffList, data.staff],
                            isLoading: false,
                        }));
                        return true;
                    } else {
                        throw new Error(data.message || "Failed to add staff member.");
                    }
                } catch (error) {
                    console.error("Failed to add staff:", error);
                    set({ isLoading: false, error: (error as Error).message });
                    return false;
                }
            },
            updateStaff: async (id, data) => {
                set({ isLoading: true, error: null });
                try {
                    // Use API endpoint
                    const response = await fetch("/api/staff", {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ id, ...data }),
                    });

                    const responseData = await response.json();

                    if (responseData.success && responseData.staff) {
                        set((state) => ({
                            staffList: state.staffList.map((staff) =>
                                staff.id === id ? responseData.staff : staff,
                            ),
                            isLoading: false,
                        }));
                        return true;
                    } else {
                        throw new Error(
                            responseData.message ||
                            `Failed to update staff member with ID ${id}.`,
                        );
                    }
                } catch (error) {
                    console.error("Failed to update staff:", error);
                    set({ isLoading: false, error: (error as Error).message });
                    return false;
                }
            },
            deleteStaff: async (id) => {
                set({ isLoading: true, error: null });
                try {
                    // Use API endpoint
                    const response = await fetch(`/api/staff?id=${id}`, {
                        method: "DELETE",
                    });

                    const data = await response.json();

                    if (data.success) {
                        set((state) => ({
                            staffList: state.staffList.filter((staff) => staff.id !== id),
                            isLoading: false,
                        }));
                        return true;
                    } else {
                        throw new Error(
                            data.message || `Failed to delete staff member with ID ${id}.`,
                        );
                    }
                } catch (error) {
                    console.error("Failed to delete staff:", error);
                    set({ isLoading: false, error: (error as Error).message });
                    return false;
                }
            },
        }),
        {
            name: "staff-storage",
        },
    ),
); 