import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
    type NewAppointmentData as DbNewAppointmentData,
    type UpdateAppointmentData as DbUpdateAppointmentData,
    type AppointmentHistory,
} from "../db/appointment.queries";
import { useAuthStore } from "./auth";

// 预约类型定义
export interface Appointment {
    id: string;
    appointmentId: string; // Unique tracking ID
    dateTime: string;
    contactName: string;
    contactPhone: string;
    contactAddress: string;
    documentCount: number; // 总文档数量
    documentCategory?: string; // 文件介质类别
    documentType: string;
    // 新增多选文件类型结构
    documentTypes?: {
        [category: string]: string[]; // 每个类别包含多个文件类型
    };
    // 新增每个类别的文档数量
    documentCounts?: {
        [category: string]: number; // 每个类别的文档数量
    };
    status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
    assignedStaff?: string[];
    assignedVehicle?: string;
    estimatedCompletionTime?: string;
    processingNotes?: string;
    lastUpdatedBy?: string;
    lastUpdatedAt?: string;
    notes?: string;
    createdAt: string;
    history?: AppointmentHistory[];
}

// For frontend form submission
export interface AppointmentFormData {
    dateTime: string;
    contactName: string;
    contactPhone: string;
    contactAddress: string;
    documentCount?: number; // 总文档数量
    documentCategory: string; // 文件介质类别
    documentType: string;
    // 新增多选文件类型结构
    documentTypes?: {
        [category: string]: string[]; // 每个类别包含多个文件类型
    };
    // 新增每个类别的文档数量
    documentCounts?: {
        [category: string]: number; // 每个类别的文档数量
    };
    notes?: string;
    status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
    assignedStaff?: string[];
    assignedVehicle?: string;
    estimatedCompletionTime?: string;
    processingNotes?: string;
}

// 预约状态类型定义
interface AppointmentState {
    appointments: Appointment[];
    isLoading: boolean;
    error: string | null;
    fetchAppointments: () => Promise<void>;
    fetchAppointmentWithHistory: (id: string) => Promise<Appointment | null>;
    addAppointment: (appointmentData: AppointmentFormData) => Promise<boolean>;
    updateAppointment: (
        id: string,
        data: Partial<AppointmentFormData>,
    ) => Promise<boolean>;
    updateAppointmentStatus: (
        id: string,
        status: Appointment["status"],
        processingNotes?: string,
    ) => Promise<boolean>;
    deleteAppointment: (id: string) => Promise<boolean>;
    assignStaff: (
        appointmentId: string,
        staffId: number | null,
    ) => Promise<boolean>;
    assignVehicle: (
        appointmentId: string,
        vehicleId: number | null,
    ) => Promise<boolean>;
}

// Appointment Management State Store
export const useAppointmentStore = create<AppointmentState>()(
    persist(
        (set, get) => ({
            appointments: [],
            isLoading: false,
            error: null,
            fetchAppointments: async () => {
                set({ isLoading: true, error: null });
                try {
                    // Use API endpoint
                    const response = await fetch("/api/appointments");
                    const data = await response.json();

                    if (data.success && Array.isArray(data.appointments)) {
                        // Map fetched appointments to ensure consistency and defaults
                        const formattedAppointments = data.appointments.map((app: any): Appointment => {
                            // 处理文件类型
                            let documentTypes: { [key: string]: string[] } = {
                                paper: [],
                                magnetic: [],
                                other: []
                            };

                            // 如果有 documentTypes 字段，直接使用
                            if (app.documentTypes && typeof app.documentTypes === 'object') {
                                documentTypes = app.documentTypes;
                            }
                            // 否则，根据 documentType 和 documentCategory 推断
                            else if (app.serviceType) {
                                const documentType = app.serviceType;
                                const category = app.documentCategory || 'paper';

                                // 确保类别存在
                                if (!documentTypes[category]) {
                                    documentTypes[category] = [];
                                }

                                // 添加类型（如果不存在）
                                if (!documentTypes[category].includes(documentType)) {
                                    documentTypes[category] = [...documentTypes[category], documentType];
                                }
                            }

                            return {
                                id: app.id?.toString() ?? '',
                                appointmentId: app.appointmentId || `APT-${app.id}`, // Fallback if no appointmentId
                                dateTime: app.appointmentTime || '', // Map and default
                                contactName: app.customerName || '', // Map and default
                                contactPhone: app.contactPhone || '',
                                contactAddress: app.contactAddress || '',
                                documentCount: app.documentCount || 1,
                                documentCategory: app.documentCategory || 'paper', // Default to paper
                                documentType: app.serviceType || 'confidential', // Map and default
                                documentTypes: documentTypes, // 新增多选文件类型结构
                                status: app.status || 'pending',
                                assignedStaff: app.assignedStaff,
                                assignedVehicle: app.assignedVehicle,
                                estimatedCompletionTime: app.estimatedCompletionTime || '',
                                processingNotes: app.processingNotes || '',
                                lastUpdatedBy: app.lastUpdatedBy?.toString() || '',
                                lastUpdatedAt: app.lastUpdatedAt || '',
                                notes: app.notes || '',
                                createdAt: app.createdAt || '',
                            };
                        });
                        set({ appointments: formattedAppointments, isLoading: false });
                    } else {
                        throw new Error(data.message || "获取预约列表失败或数据格式错误");
                    }
                } catch (error) {
                    console.error("Failed to fetch appointments:", error);
                    set({ isLoading: false, error: (error as Error).message });
                }
            },
            fetchAppointmentWithHistory: async (id: string) => {
                set({ isLoading: true, error: null });
                try {
                    // Use API endpoint with ID and history flag
                    const response = await fetch(`/api/appointments?id=${id}&includeHistory=true`);
                    const data = await response.json();

                    if (data.success && data.appointment) {
                        // 处理文件类型
                        let documentTypes: { [key: string]: string[] } = {
                            paper: [],
                            magnetic: [],
                            other: []
                        };

                        // 如果有 documentTypes 字段，直接使用
                        if (data.appointment.documentTypes && typeof data.appointment.documentTypes === 'object') {
                            documentTypes = data.appointment.documentTypes;
                        }
                        // 否则，根据 documentType 和 documentCategory 推断
                        else if (data.appointment.serviceType) {
                            const documentType = data.appointment.serviceType;
                            const category = data.appointment.documentCategory || 'paper';

                            // 确保类别存在
                            if (!documentTypes[category]) {
                                documentTypes[category] = [];
                            }

                            // 添加类型（如果不存在）
                            if (!documentTypes[category].includes(documentType)) {
                                documentTypes[category] = [...documentTypes[category], documentType];
                            }
                        }

                        // Format appointment data
                        const appointment: Appointment = {
                            id: data.appointment.id?.toString() ?? '',
                            appointmentId: data.appointment.appointmentId || `APT-${data.appointment.id}`,
                            dateTime: data.appointment.appointmentTime || '',
                            contactName: data.appointment.customerName || '',
                            contactPhone: data.appointment.contactPhone || '',
                            contactAddress: data.appointment.contactAddress || '',
                            documentCount: data.appointment.documentCount || 1,
                            documentCategory: data.appointment.documentCategory || 'paper', // Default to paper
                            documentType: data.appointment.serviceType || 'confidential',
                            documentTypes: documentTypes, // 新增多选文件类型结构
                            status: data.appointment.status || 'pending',
                            assignedStaff: data.appointment.assignedStaff,
                            assignedVehicle: data.appointment.assignedVehicle,
                            estimatedCompletionTime: data.appointment.estimatedCompletionTime || '',
                            processingNotes: data.appointment.processingNotes || '',
                            lastUpdatedBy: data.appointment.lastUpdatedBy?.toString() || '',
                            lastUpdatedAt: data.appointment.lastUpdatedAt || '',
                            notes: data.appointment.notes || '',
                            createdAt: data.appointment.createdAt || '',
                            history: data.history || [],
                        };

                        // Update this appointment in the state
                        set((state) => ({
                            appointments: state.appointments.map(app =>
                                app.id === id ? appointment : app
                            ),
                            isLoading: false
                        }));

                        return appointment;
                    } else {
                        throw new Error(data.message || "获取预约详情失败");
                    }
                } catch (error) {
                    console.error("Failed to fetch appointment with history:", error);
                    set({ isLoading: false, error: (error as Error).message });
                    return null;
                }
            },
            addAppointment: async (appointmentData) => {
                set({ isLoading: true, error: null });
                try {
                    const auth = useAuthStore.getState();
                    const userId = auth.user?.id;

                    // 转换文件类型数据
                    let documentTypes = appointmentData.documentTypes || {};

                    // Map frontend form fields to backend API expected fields
                    const apiData = {
                        customerName: appointmentData.contactName,
                        appointmentTime: appointmentData.dateTime,
                        serviceType: appointmentData.documentType,
                        documentCategory: appointmentData.documentCategory,
                        documentTypes: documentTypes, // 传递多选文件类型结构
                        status: appointmentData.status,
                        estimatedCompletionTime: appointmentData.estimatedCompletionTime,
                        processingNotes: appointmentData.processingNotes,
                        contactPhone: appointmentData.contactPhone,
                        contactAddress: appointmentData.contactAddress,
                        notes: appointmentData.notes,
                        documentCount: appointmentData.documentCount,
                        updatedBy: userId, // Set the current user as the updater
                    };

                    // Use API endpoint
                    const response = await fetch("/api/appointments", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(apiData),
                    });

                    const data = await response.json();

                    if (data.success && data.appointment) {
                        // Map the returned appointment data to our frontend format
                        const formattedAppointment: Appointment = {
                            id: data.appointment.id.toString(),
                            appointmentId: data.appointment.appointmentId || `APT-${data.appointment.id}`,
                            dateTime: data.appointment.appointmentTime || '',
                            contactName: data.appointment.customerName || '',
                            contactPhone: data.appointment.contactPhone || '',
                            contactAddress: data.appointment.contactAddress || '',
                            documentCount: data.appointment.documentCount || 1,
                            documentCategory: data.appointment.documentCategory || 'paper', // Default to paper
                            documentType: data.appointment.serviceType || 'confidential',
                            documentTypes: data.appointment.documentTypes || { paper: [], magnetic: [], other: [] },
                            status: data.appointment.status || 'pending',
                            assignedStaff: data.appointment.assignedStaff,
                            assignedVehicle: data.appointment.assignedVehicle,
                            estimatedCompletionTime: data.appointment.estimatedCompletionTime || '',
                            processingNotes: data.appointment.processingNotes || '',
                            lastUpdatedBy: data.appointment.lastUpdatedBy?.toString() || '',
                            lastUpdatedAt: data.appointment.lastUpdatedAt || '',
                            notes: data.appointment.notes || '',
                            createdAt: data.appointment.createdAt || '',
                        };

                        set((state) => ({
                            appointments: [...state.appointments, formattedAppointment],
                            isLoading: false,
                        }));
                        return true;
                    } else {
                        throw new Error(data.message || "Failed to add appointment.");
                    }
                } catch (error) {
                    console.error("Failed to add appointment:", error);
                    set({ isLoading: false, error: (error as Error).message });
                    return false;
                }
            },
            updateAppointment: async (id, data) => {
                set({ isLoading: true, error: null });
                try {
                    const auth = useAuthStore.getState();
                    const userId = auth.user?.id;

                    // Map frontend form fields to backend API expected fields
                    const apiData: Record<string, any> = {
                        updatedBy: userId, // Set the current user as the updater
                    };

                    if (data.contactName !== undefined) apiData.customerName = data.contactName;
                    if (data.dateTime !== undefined) apiData.appointmentTime = data.dateTime;
                    if (data.documentType !== undefined) apiData.serviceType = data.documentType;
                    if (data.documentCategory !== undefined) apiData.documentCategory = data.documentCategory;
                    if (data.status !== undefined) apiData.status = data.status;
                    if (data.notes !== undefined) apiData.notes = data.notes;
                    if (data.contactPhone !== undefined) apiData.contactPhone = data.contactPhone;
                    if (data.contactAddress !== undefined) apiData.contactAddress = data.contactAddress;
                    if (data.documentCount !== undefined) apiData.documentCount = data.documentCount;
                    if (data.estimatedCompletionTime !== undefined) apiData.estimatedCompletionTime = data.estimatedCompletionTime;
                    if (data.processingNotes !== undefined) apiData.processingNotes = data.processingNotes;
                    if (data.assignedStaff !== undefined) apiData.staffId = data.assignedStaff && data.assignedStaff.length > 0 ? data.assignedStaff[0] : null;
                    if (data.assignedVehicle !== undefined) apiData.vehicleId = data.assignedVehicle || null;

                    // Use API endpoint
                    const response = await fetch("/api/appointments", {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ id, ...apiData }),
                    });

                    const responseData = await response.json();

                    if (responseData.success && responseData.appointment) {
                        // Map the returned appointment to our frontend format
                        const formattedAppointment: Appointment = {
                            id: responseData.appointment.id.toString(),
                            appointmentId: responseData.appointment.appointmentId || `APT-${responseData.appointment.id}`,
                            dateTime: responseData.appointment.appointmentTime || '',
                            contactName: responseData.appointment.customerName || '',
                            contactPhone: responseData.appointment.contactPhone || '',
                            contactAddress: responseData.appointment.contactAddress || '',
                            documentCount: responseData.appointment.documentCount || 1,
                            documentCategory: responseData.appointment.documentCategory || 'paper', // Default to paper
                            documentType: responseData.appointment.serviceType || 'confidential',
                            documentTypes: responseData.appointment.documentTypes || { paper: [], magnetic: [], other: [] },
                            status: responseData.appointment.status || 'pending',
                            assignedStaff: responseData.appointment.assignedStaff,
                            assignedVehicle: responseData.appointment.assignedVehicle,
                            estimatedCompletionTime: responseData.appointment.estimatedCompletionTime || '',
                            processingNotes: responseData.appointment.processingNotes || '',
                            lastUpdatedBy: responseData.appointment.lastUpdatedBy?.toString() || '',
                            lastUpdatedAt: responseData.appointment.lastUpdatedAt || '',
                            notes: responseData.appointment.notes || '',
                            createdAt: responseData.appointment.createdAt || '',
                        };

                        set((state) => ({
                            appointments: state.appointments.map((app) =>
                                app.id === id ? formattedAppointment : app,
                            ),
                            isLoading: false,
                        }));
                        return true;
                    } else {
                        throw new Error(
                            responseData.message ||
                            `Failed to update appointment with ID ${id}.`,
                        );
                    }
                } catch (error) {
                    console.error("Failed to update appointment:", error);
                    set({ isLoading: false, error: (error as Error).message });
                    return false;
                }
            },
            updateAppointmentStatus: async (id, status, processingNotes) => {
                // This is a convenience method to update just the status of an appointment
                const updateData: Partial<AppointmentFormData> = {
                    status,
                };

                if (processingNotes !== undefined) {
                    updateData.processingNotes = processingNotes;
                }

                return get().updateAppointment(id, updateData);
            },
            deleteAppointment: async (id) => {
                set({ isLoading: true, error: null });
                try {
                    // Use API endpoint
                    const response = await fetch(`/api/appointments?id=${id}`, {
                        method: "DELETE",
                    });

                    const data = await response.json();

                    if (data.success) {
                        set((state) => ({
                            appointments: state.appointments.filter((app) => app.id !== id),
                            isLoading: false,
                        }));
                        return true;
                    } else {
                        throw new Error(
                            data.message || `Failed to delete appointment with ID ${id}.`,
                        );
                    }
                } catch (error) {
                    console.error("Failed to delete appointment:", error);
                    set({ isLoading: false, error: (error as Error).message });
                    return false;
                }
            },
            // assignStaff and assignVehicle now simply call updateAppointment via API
            assignStaff: async (appointmentId, staffId) => {
                // Properly map the staffId to the expected API field
                return get().updateAppointment(appointmentId, {
                    assignedStaff: staffId ? [staffId.toString()] : undefined
                });
            },
            assignVehicle: async (appointmentId, vehicleId) => {
                // Properly map the vehicleId to the expected API field
                return get().updateAppointment(appointmentId, {
                    assignedVehicle: vehicleId ? vehicleId.toString() : undefined
                });
            },
        }),
        {
            name: "appointment-storage",
        },
    ),
); 