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

// 预约状态类型定义
interface AppointmentState {
    appointments: Appointment[];
    isLoading: boolean;
    error: string | null;
    fetchAppointments: () => Promise<void>;
    addAppointment: (appointmentData: DbNewAppointmentData) => Promise<boolean>;
    updateAppointment: (
        id: string,
        data: DbUpdateAppointmentData,
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

                    if (data.success) {
                        set({ appointments: data.appointments, isLoading: false });
                    } else {
                        throw new Error(data.message || "获取预约列表失败");
                    }
                } catch (error) {
                    console.error("Failed to fetch appointments:", error);
                    set({ isLoading: false, error: (error as Error).message });
                }
            },
            addAppointment: async (appointmentData) => {
                set({ isLoading: true, error: null });
                try {
                    // Use API endpoint
                    const response = await fetch("/api/appointments", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(appointmentData),
                    });

                    const data = await response.json();

                    if (data.success && data.appointment) {
                        set((state) => ({
                            appointments: [...state.appointments, data.appointment],
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
                    // Use API endpoint
                    const response = await fetch("/api/appointments", {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ id, ...data }),
                    });

                    const responseData = await response.json();

                    if (responseData.success && responseData.appointment) {
                        set((state) => ({
                            appointments: state.appointments.map((app) =>
                                app.id === id ? responseData.appointment : app,
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
                return get().updateAppointment(appointmentId, { staffId });
            },
            assignVehicle: async (appointmentId, vehicleId) => {
                return get().updateAppointment(appointmentId, { vehicleId });
            },
        }),
        {
            name: "appointment-storage",
        },
    ),
); 