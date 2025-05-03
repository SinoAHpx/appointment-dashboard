import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
    type Vehicle as DbVehicle,
    type NewVehicleData as DbNewVehicleData,
    type UpdateVehicleData as DbUpdateVehicleData,
} from "../vehicle.queries";

// 导出车辆类型
export type Vehicle = DbVehicle;

// 车辆管理状态类型定义
interface VehicleState {
    vehicles: Vehicle[];
    isLoading: boolean;
    error: string | null;
    fetchVehicles: () => Promise<void>;
    addVehicle: (vehicleData: DbNewVehicleData) => Promise<boolean>;
    updateVehicle: (id: number, data: DbUpdateVehicleData) => Promise<boolean>;
    deleteVehicle: (id: number) => Promise<boolean>;
    toggleAvailability: (id: number) => Promise<boolean>;
}

// Vehicle Management State Store
export const useVehicleStore = create<VehicleState>()(
    persist(
        (set, get) => ({
            vehicles: [],
            isLoading: false,
            error: null,
            fetchVehicles: async () => {
                set({ isLoading: true, error: null });
                try {
                    // Use API endpoint
                    const response = await fetch("/api/vehicles");
                    const data = await response.json();

                    if (data.success) {
                        set({ vehicles: data.vehicles, isLoading: false });
                    } else {
                        throw new Error(data.message || "获取车辆列表失败");
                    }
                } catch (error) {
                    console.error("Failed to fetch vehicles:", error);
                    set({ isLoading: false, error: (error as Error).message });
                }
            },
            addVehicle: async (vehicleData) => {
                set({ isLoading: true, error: null });
                try {
                    // Use API endpoint
                    const response = await fetch("/api/vehicles", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(vehicleData),
                    });

                    const data = await response.json();

                    if (data.success && data.vehicle) {
                        set((state) => ({
                            vehicles: [...state.vehicles, data.vehicle],
                            isLoading: false,
                        }));
                        return true;
                    } else {
                        throw new Error(data.message || "Failed to add vehicle.");
                    }
                } catch (error) {
                    console.error("Failed to add vehicle:", error);
                    set({ isLoading: false, error: (error as Error).message });
                    return false;
                }
            },
            updateVehicle: async (id, data) => {
                set({ isLoading: true, error: null });
                try {
                    // Use API endpoint
                    const response = await fetch("/api/vehicles", {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ id, ...data }),
                    });

                    const responseData = await response.json();

                    if (responseData.success && responseData.vehicle) {
                        set((state) => ({
                            vehicles: state.vehicles.map((v) =>
                                v.id === id ? responseData.vehicle : v,
                            ),
                            isLoading: false,
                        }));
                        return true;
                    } else {
                        throw new Error(
                            responseData.message || `Failed to update vehicle with ID ${id}.`,
                        );
                    }
                } catch (error) {
                    console.error("Failed to update vehicle:", error);
                    set({ isLoading: false, error: (error as Error).message });
                    return false;
                }
            },
            deleteVehicle: async (id) => {
                set({ isLoading: true, error: null });
                try {
                    // Use API endpoint
                    const response = await fetch(`/api/vehicles?id=${id}`, {
                        method: "DELETE",
                    });

                    const data = await response.json();

                    if (data.success) {
                        set((state) => ({
                            vehicles: state.vehicles.filter((v) => v.id !== id),
                            isLoading: false,
                        }));
                        return true;
                    } else {
                        throw new Error(
                            data.message || `Failed to delete vehicle with ID ${id}.`,
                        );
                    }
                } catch (error) {
                    console.error("Failed to delete vehicle:", error);
                    set({ isLoading: false, error: (error as Error).message });
                    return false;
                }
            },
            toggleAvailability: async (id) => {
                const currentVehicle = get().vehicles.find((v) => v.id === id);
                if (!currentVehicle) {
                    console.warn(
                        `Vehicle with ID ${id} not found for toggling availability.`,
                    );
                    return false;
                }
                // Simple toggle: available <-> in_use. Maintenance needs explicit update.
                const newStatus =
                    currentVehicle.status === "available" ? "in_use" : "available";

                // Use the existing updateVehicle method through API
                return get().updateVehicle(id, { status: newStatus });
            },
        }),
        {
            name: "vehicle-storage",
        },
    ),
); 