import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
    type NewAppointmentData as DbNewAppointmentData,
    type UpdateAppointmentData as DbUpdateAppointmentData,
} from "../appointment.queries";

// 预约类型定义
export interface Appointment {
    id: string;
    dateTime: string;
    contactName: string;
    contactPhone: string;
    contactAddress: string;
    documentCount: number;
    documentType: string;
    status: "pending" | "confirmed" | "completed" | "cancelled";
    assignedStaff?: string[];
    assignedVehicle?: string;
    notes?: string;
    createdAt: string;
}

// For frontend form submission
export interface AppointmentFormData {
    dateTime: string;
    contactName: string;
    contactPhone: string;
    contactAddress: string;
    documentCount: number;
    documentType: string;
    notes?: string;
    status: "pending" | "confirmed" | "completed" | "cancelled";
    assignedStaff?: string[];
    assignedVehicle?: string;
}

// 预约状态类型定义
interface AppointmentState {
    appointments: Appointment[];
    isLoading: boolean;
    error: string | null;
    fetchAppointments: () => Promise<void>;
    addAppointment: (appointmentData: AppointmentFormData) => Promise<boolean>;
    updateAppointment: (
        id: string,
        data: Partial<AppointmentFormData>,
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
                        const formattedAppointments = data.appointments.map((app: any): Appointment => ({
                            id: app.id?.toString() ?? '',
                            dateTime: app.appointmentTime || '', // Map and default
                            contactName: app.customerName || '', // Map and default
                            contactPhone: app.contactPhone || '',
                            contactAddress: app.contactAddress || '',
                            documentCount: app.documentCount || 1,
                            documentType: app.serviceType || 'confidential', // Map and default
                            status: app.status || 'pending',
                            assignedStaff: app.assignedStaff,
                            assignedVehicle: app.assignedVehicle,
                            notes: app.notes || '',
                            createdAt: app.createdAt || '',
                        }));
                        set({ appointments: formattedAppointments, isLoading: false });
                    } else {
                        throw new Error(data.message || "获取预约列表失败或数据格式错误");
                    }
                } catch (error) {
                    console.error("Failed to fetch appointments:", error);
                    set({ isLoading: false, error: (error as Error).message });
                }
            },
            addAppointment: async (appointmentData) => {
                set({ isLoading: true, error: null });
                try {
                    // Map frontend form fields to backend API expected fields
                    const apiData = {
                        customerName: appointmentData.contactName,
                        appointmentTime: appointmentData.dateTime,
                        serviceType: appointmentData.documentType,
                        status: appointmentData.status,
                        // Add any other fields needed by the API
                        notes: appointmentData.notes,
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
                            dateTime: data.appointment.appointmentTime || '',
                            contactName: data.appointment.customerName || '',
                            contactPhone: data.appointment.contactPhone || '',
                            contactAddress: data.appointment.contactAddress || '',
                            documentCount: data.appointment.documentCount || 1,
                            documentType: data.appointment.serviceType || 'confidential',
                            status: data.appointment.status || 'pending',
                            assignedStaff: data.appointment.assignedStaff,
                            assignedVehicle: data.appointment.assignedVehicle,
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
                    // Map frontend form fields to backend API expected fields
                    const apiData: Record<string, any> = {};

                    if (data.contactName !== undefined) apiData.customerName = data.contactName;
                    if (data.dateTime !== undefined) apiData.appointmentTime = data.dateTime;
                    if (data.documentType !== undefined) apiData.serviceType = data.documentType;
                    if (data.status !== undefined) apiData.status = data.status;
                    if (data.notes !== undefined) apiData.notes = data.notes;
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
                            dateTime: responseData.appointment.appointmentTime || '',
                            contactName: responseData.appointment.customerName || '',
                            contactPhone: responseData.appointment.contactPhone || '',
                            contactAddress: responseData.appointment.contactAddress || '',
                            documentCount: responseData.appointment.documentCount || 1,
                            documentType: responseData.appointment.serviceType || 'confidential',
                            status: responseData.appointment.status || 'pending',
                            assignedStaff: responseData.appointment.assignedStaff,
                            assignedVehicle: responseData.appointment.assignedVehicle,
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