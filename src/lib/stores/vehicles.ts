import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
    type Vehicle as DbVehicle,
    type NewVehicleData as DbNewVehicleData,
    type UpdateVehicleData as DbUpdateVehicleData,
} from "../db/vehicle.queries";

// 导出车辆类型（前端扩展版本）
export interface Vehicle {
    id: string;
    plateNumber: string;
    model: string;
    vehicleType: "electric" | "fuel"; // 车辆类型：电车或油车
    length: number; // 车长（米）
    isAvailable: boolean;
    capacity: number;    // 载重量（吨，允许小数）
    lastMaintenance: string; // 最近维护日期
    createdAt: string;
}

// 车辆前端表单数据类型
export interface VehicleFormData {
    plateNumber: string;
    model: string;
    vehicleType: "electric" | "fuel";
    length: number;
    capacity: number;
    lastMaintenance?: string;
    isAvailable?: boolean;
}

// 车辆管理状态类型定义
interface VehicleState {
    vehicles: Vehicle[];
    isLoading: boolean;
    error: string | null;
    fetchVehicles: () => Promise<void>;
    addVehicle: (vehicleData: VehicleFormData) => Promise<boolean>;
    updateVehicle: (id: string, data: Partial<VehicleFormData>) => Promise<boolean>;
    deleteVehicle: (id: string) => Promise<boolean>;
    toggleAvailability: (id: string) => Promise<boolean>;
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
                    const response = await fetch("/api/vehicles");
                    const data = await response.json();

                    if (data.success) {
                        const mappedVehicles = data.vehicles.map((v: DbVehicle) => ({
                            id: v.id.toString(),
                            plateNumber: v.plateNumber,
                            model: v.model,
                            vehicleType: v.vehicleType || "fuel",
                            length: v.length || 0,
                            isAvailable: v.isAvailable, // 直接使用数据库的 isAvailable
                            capacity: 1, // 默认值, 前端可以扩展此字段
                            lastMaintenance: '', // 默认值, 前端可以扩展此字段
                            createdAt: v.createdAt,
                        }));
                        set({ vehicles: mappedVehicles, isLoading: false });
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
                    const apiData: DbNewVehicleData = {
                        plateNumber: vehicleData.plateNumber,
                        model: vehicleData.model,
                        vehicleType: vehicleData.vehicleType,
                        length: vehicleData.length,
                        isAvailable: vehicleData.isAvailable === undefined ? true : vehicleData.isAvailable, // 默认为true
                    };

                    const response = await fetch("/api/vehicles", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(apiData),
                    });

                    const data = await response.json();

                    if (data.success && data.vehicle) {
                        const newVehicle: Vehicle = {
                            id: data.vehicle.id.toString(),
                            plateNumber: data.vehicle.plateNumber,
                            model: data.vehicle.model,
                            vehicleType: data.vehicle.vehicleType,
                            length: data.vehicle.length || 0,
                            isAvailable: data.vehicle.isAvailable,
                            capacity: vehicleData.capacity,
                            lastMaintenance: vehicleData.lastMaintenance || '',
                            createdAt: data.vehicle.createdAt,
                        };

                        set((state) => ({
                            vehicles: [...state.vehicles, newVehicle],
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
                    const currentVehicle = get().vehicles.find(v => v.id === id);
                    if (!currentVehicle) {
                        throw new Error(`Vehicle with ID ${id} not found.`);
                    }

                    const apiData: DbUpdateVehicleData = {};

                    if (data.plateNumber !== undefined) {
                        apiData.plateNumber = data.plateNumber;
                    }
                    if (data.model !== undefined) {
                        apiData.model = data.model;
                    }
                    if (data.vehicleType !== undefined) {
                        apiData.vehicleType = data.vehicleType;
                    }
                    if (data.length !== undefined) {
                        apiData.length = data.length;
                    }
                    if (data.isAvailable !== undefined) { // 只更新 isAvailable
                        apiData.isAvailable = data.isAvailable;
                    }

                    const response = await fetch("/api/vehicles", {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ id: parseInt(id), ...apiData }),
                    });

                    const responseData = await response.json();

                    if (responseData.success && responseData.vehicle) {
                        const updatedVehicleApi: DbVehicle = responseData.vehicle;
                        const updatedVehicle: Vehicle = {
                            id: updatedVehicleApi.id.toString(),
                            plateNumber: updatedVehicleApi.plateNumber,
                            model: updatedVehicleApi.model,
                            vehicleType: updatedVehicleApi.vehicleType,
                            length: updatedVehicleApi.length || 0,
                            isAvailable: updatedVehicleApi.isAvailable,
                            capacity: data.capacity !== undefined ? data.capacity : currentVehicle.capacity,
                            lastMaintenance: data.lastMaintenance !== undefined ? data.lastMaintenance : currentVehicle.lastMaintenance,
                            createdAt: updatedVehicleApi.createdAt,
                        };

                        set((state) => ({
                            vehicles: state.vehicles.map((v) =>
                                v.id === id ? updatedVehicle : v,
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
                return get().updateVehicle(id, { isAvailable: !currentVehicle.isAvailable });
            },
        }),
        {
            name: "vehicle-storage",
        },
    ),
); 