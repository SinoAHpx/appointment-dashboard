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
    status: "available" | "in_use" | "maintenance";
    isAvailable: boolean; // 前端用于显示状态
    capacity: number;    // 载重量
    lastMaintenance: string; // 最近维护日期
    createdAt: string;
}

// 车辆前端表单数据类型
export interface VehicleFormData {
    plateNumber: string;
    model: string;
    capacity?: number;
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
                    // Use API endpoint
                    const response = await fetch("/api/vehicles");
                    const data = await response.json();

                    if (data.success) {
                        // 将API返回的数据映射到前端模型
                        const mappedVehicles = data.vehicles.map((v: DbVehicle) => ({
                            id: v.id.toString(),
                            plateNumber: v.plateNumber,
                            model: v.model,
                            status: v.status,
                            isAvailable: v.status === 'available',
                            capacity: 1, // 默认值
                            lastMaintenance: '', // 默认值
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
                    // 将前端表单数据映射到API模型
                    const apiData: DbNewVehicleData = {
                        plateNumber: vehicleData.plateNumber,
                        model: vehicleData.model,
                        status: vehicleData.isAvailable ? 'available' : 'in_use',
                    };

                    // Use API endpoint
                    const response = await fetch("/api/vehicles", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(apiData),
                    });

                    const data = await response.json();

                    if (data.success && data.vehicle) {
                        // 将API返回数据映射到前端模型
                        const newVehicle: Vehicle = {
                            id: data.vehicle.id.toString(),
                            plateNumber: data.vehicle.plateNumber,
                            model: data.vehicle.model,
                            status: data.vehicle.status,
                            isAvailable: data.vehicle.status === 'available',
                            capacity: vehicleData.capacity || 1,
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
                    // 获取当前车辆数据
                    const currentVehicle = get().vehicles.find(v => v.id === id);
                    if (!currentVehicle) {
                        throw new Error(`Vehicle with ID ${id} not found.`);
                    }

                    // 将前端表单数据映射到API模型
                    const apiData: DbUpdateVehicleData = {};

                    if (data.plateNumber !== undefined) {
                        apiData.plateNumber = data.plateNumber;
                    }

                    if (data.model !== undefined) {
                        apiData.model = data.model;
                    }

                    if (data.isAvailable !== undefined) {
                        apiData.status = data.isAvailable ? 'available' : 'in_use';
                    }

                    // Use API endpoint
                    const response = await fetch("/api/vehicles", {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ id: parseInt(id), ...apiData }),
                    });

                    const responseData = await response.json();

                    if (responseData.success && responseData.vehicle) {
                        // 将API返回数据映射到前端模型
                        const updatedVehicle: Vehicle = {
                            id: responseData.vehicle.id.toString(),
                            plateNumber: responseData.vehicle.plateNumber,
                            model: responseData.vehicle.model,
                            status: responseData.vehicle.status,
                            isAvailable: responseData.vehicle.status === 'available',
                            // 保留前端特有字段值
                            capacity: data.capacity !== undefined ? data.capacity : currentVehicle.capacity,
                            lastMaintenance: data.lastMaintenance !== undefined ? data.lastMaintenance : currentVehicle.lastMaintenance,
                            createdAt: responseData.vehicle.createdAt,
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
                // 切换可用状态
                return get().updateVehicle(id, { isAvailable: !currentVehicle.isAvailable });
            },
        }),
        {
            name: "vehicle-storage",
        },
    ),
); 