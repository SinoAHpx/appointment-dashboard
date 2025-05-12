import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type Staff as DbStaff, type NewStaffData } from "../db/staff.queries";

// 导出员工类型
export interface Staff {
    id: string;
    name: string;
    phone: string;
    idCard: string;
    position: string;
    status: "active" | "inactive" | "on_leave";
    isAvailable: boolean; // 前端用于显示状态
    createdAt: string;
}

// 员工管理状态类型定义
interface StaffState {
    staffList: Staff[];
    isLoading: boolean;
    error: string | null;
    fetchStaff: () => Promise<void>;
    addStaff: (data: {
        name: string;
        phone: string;
        idCard: string;
        position?: string;
        isAvailable?: boolean;
    }) => Promise<boolean>;
    updateStaff: (
        id: string,
        data: Partial<Staff>,
    ) => Promise<boolean>;
    deleteStaff: (id: string) => Promise<boolean>;
    toggleAvailability: (id: string) => Promise<boolean>;
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
                        // 将API返回的数据映射到前端模型
                        const mappedStaffList = data.staffList.map((staff: DbStaff) => ({
                            id: staff.id.toString(),
                            name: staff.name,
                            phone: staff.phone || '',
                            idCard: staff.idCard,
                            position: staff.position || '',
                            status: staff.status,
                            isAvailable: staff.status === 'active',
                            createdAt: staff.createdAt,
                        }));
                        set({ staffList: mappedStaffList, isLoading: false });
                    } else {
                        throw new Error(data.message || "获取员工列表失败");
                    }
                } catch (error) {
                    console.error("Failed to fetch staff:", error);
                    set({ isLoading: false, error: (error as Error).message });
                }
            },
            addStaff: async (staffData) => {
                set({ isLoading: true, error: null });
                try {
                    // Map frontend model to API model
                    const apiData: NewStaffData = {
                        name: staffData.name,
                        phone: staffData.phone,
                        idCard: staffData.idCard,
                        position: staffData.position || null,
                        status: staffData.isAvailable ? 'active' : 'inactive',
                    };

                    // Use API endpoint
                    const response = await fetch("/api/staff", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(apiData),
                    });

                    const data = await response.json();

                    if (data.success && data.staff) {
                        // Map the returned staff to our frontend format
                        const newStaff: Staff = {
                            id: data.staff.id.toString(),
                            name: data.staff.name,
                            phone: data.staff.phone || '',
                            idCard: data.staff.idCard,
                            position: data.staff.position || '',
                            status: data.staff.status,
                            isAvailable: data.staff.status === 'active',
                            createdAt: data.staff.createdAt,
                        };

                        set((state) => ({
                            staffList: [...state.staffList, newStaff],
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
            updateStaff: async (id, staffData) => {
                set({ isLoading: true, error: null });
                try {
                    // Map frontend model to API model
                    const apiData: any = {};

                    if (staffData.name !== undefined) apiData.name = staffData.name;
                    if (staffData.phone !== undefined) apiData.phone = staffData.phone;
                    if (staffData.idCard !== undefined) apiData.idCard = staffData.idCard;
                    if (staffData.position !== undefined) apiData.position = staffData.position;
                    if (staffData.isAvailable !== undefined) {
                        apiData.status = staffData.isAvailable ? 'active' : 'inactive';
                    } else if (staffData.status !== undefined) {
                        apiData.status = staffData.status;
                    }

                    // Use API endpoint
                    const response = await fetch("/api/staff", {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ id: parseInt(id), ...apiData }),
                    });

                    const responseData = await response.json();

                    if (responseData.success && responseData.staff) {
                        // Map the returned staff to our frontend format
                        const updatedStaff: Staff = {
                            id: responseData.staff.id.toString(),
                            name: responseData.staff.name,
                            phone: responseData.staff.phone || '',
                            idCard: responseData.staff.idCard,
                            position: responseData.staff.position || '',
                            status: responseData.staff.status,
                            isAvailable: responseData.staff.status === 'active',
                            createdAt: responseData.staff.createdAt,
                        };

                        set((state) => ({
                            staffList: state.staffList.map((staff) =>
                                staff.id === id ? updatedStaff : staff,
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
            toggleAvailability: async (id) => {
                const staff = get().staffList.find((s) => s.id === id);
                if (!staff) return false;

                const newAvailability = !staff.isAvailable;
                return get().updateStaff(id, { isAvailable: newAvailability });
            },
        }),
        {
            name: "staff-storage",
        },
    ),
); 