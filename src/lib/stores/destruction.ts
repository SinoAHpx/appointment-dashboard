import { create } from "zustand";
import { DestructionTask, DestructionRecord, DestructionCertificate } from "../db/destruction.queries";

interface DestructionState {
    tasks: DestructionTask[];
    currentTask: DestructionTask | null;
    currentRecord: DestructionRecord | null;
    currentCertificate: DestructionCertificate | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchTasks: () => Promise<void>;
    fetchAdminTasks: () => Promise<void>;
    createTask: (data: {
        customerName: string;
        contactPhone: string;
        contactAddress: string;
        scheduledDate: string;
        serviceType: string;
        itemDescription?: string;
        estimatedWeight?: number;
        specialRequirements?: string;
    }) => Promise<boolean>;
    updateTaskStatus: (taskId: number, status: DestructionTask["status"]) => Promise<boolean>;
    createRecord: (data: {
        taskId: number;
        checkInTime?: string;
        actualWeight?: number;
        itemCount?: number;
        itemDetails?: string;
        witnessName?: string;
        assignedStaffJson?: string;
        assignedVehicleJson?: string;
        notes?: string;
    }) => Promise<boolean>;
    generateCertificate: (taskId: number) => Promise<boolean>;
    fetchCertificate: (taskId: number) => Promise<void>;
}

export const useDestructionStore = create<DestructionState>()((set, get) => ({
    tasks: [],
    currentTask: null,
    currentRecord: null,
    currentCertificate: null,
    isLoading: false,
    error: null,

    fetchTasks: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch("/api/destruction/tasks");
            const data = await response.json();

            if (data.success) {
                set({ tasks: data.tasks, isLoading: false });
            } else {
                set({ error: data.message || "获取销毁任务失败", isLoading: false });
            }
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "获取销毁任务时发生错误",
                isLoading: false
            });
        }
    },

    fetchAdminTasks: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch("/api/destruction/tasks/admin");
            const data = await response.json();

            if (data.success) {
                set({ tasks: data.tasks, isLoading: false });
            } else {
                set({ error: data.message || "获取所有销毁任务失败", isLoading: false });
            }
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "获取销毁任务时发生错误",
                isLoading: false
            });
        }
    },

    createTask: async (taskData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch("/api/destruction/tasks", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(taskData),
            });

            const data = await response.json();

            if (data.success) {
                set((state) => ({
                    tasks: [data.task, ...state.tasks],
                    isLoading: false,
                }));
                return true;
            } else {
                set({
                    error: data.message || "创建销毁任务失败",
                    isLoading: false
                });
                return false;
            }
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "创建销毁任务时发生错误",
                isLoading: false
            });
            return false;
        }
    },

    updateTaskStatus: async (taskId, status) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`/api/destruction/tasks/${taskId}/status`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ status }),
            });

            const data = await response.json();

            if (data.success) {
                set((state) => ({
                    tasks: state.tasks.map(task =>
                        task.id === taskId ? { ...task, status } : task
                    ),
                    isLoading: false,
                }));
                return true;
            } else {
                set({
                    error: data.message || "更新任务状态失败",
                    isLoading: false
                });
                return false;
            }
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "更新任务状态时发生错误",
                isLoading: false
            });
            return false;
        }
    },

    createRecord: async (recordData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch("/api/destruction/records", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(recordData),
            });

            const data = await response.json();

            if (data.success) {
                set({ currentRecord: data.record, isLoading: false });
                return true;
            } else {
                set({
                    error: data.message || "创建销毁记录失败",
                    isLoading: false
                });
                return false;
            }
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "创建销毁记录时发生错误",
                isLoading: false
            });
            return false;
        }
    },

    generateCertificate: async (taskId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`/api/destruction/certificates`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ taskId }),
            });

            const data = await response.json();

            if (data.success) {
                set({ currentCertificate: data.certificate, isLoading: false });
                return true;
            } else {
                set({
                    error: data.message || "生成销毁证明失败",
                    isLoading: false
                });
                return false;
            }
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "生成销毁证明时发生错误",
                isLoading: false
            });
            return false;
        }
    },

    fetchCertificate: async (taskId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`/api/destruction/tasks/${taskId}/certificate`);
            const data = await response.json();

            if (data.success) {
                set({ currentCertificate: data.certificate, isLoading: false });
            } else {
                set({ error: data.message || "获取销毁证明失败", isLoading: false });
            }
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : "获取销毁证明时发生错误",
                isLoading: false
            });
        }
    },
})); 