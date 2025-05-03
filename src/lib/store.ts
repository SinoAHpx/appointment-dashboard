import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
    // Comment out direct database imports
    // getAllStaff as dbGetAllStaff,
    // addStaff as dbAddStaff,
    // updateStaff as dbUpdateStaff,
    // deleteStaff as dbDeleteStaff,
    type Staff as DbStaff // Keep the type definition
} from './staff.queries';
import {
    // Comment out direct database imports
    // getAllAppointments as dbGetAllAppointments,
    // addAppointment as dbAddAppointment,
    // updateAppointment as dbUpdateAppointment,
    // deleteAppointment as dbDeleteAppointment,
    type Appointment as DbAppointment, // Keep the type definition
    type NewAppointmentData as DbNewAppointmentData,
    type UpdateAppointmentData as DbUpdateAppointmentData
} from './appointment.queries';
import {
    // Comment out direct database imports
    // getAllVehicles as dbGetAllVehicles,
    // addVehicle as dbAddVehicle,
    // updateVehicle as dbUpdateVehicle,
    // deleteVehicle as dbDeleteVehicle,
    type Vehicle as DbVehicle, // Keep the type definition
    type NewVehicleData as DbNewVehicleData,
    type UpdateVehicleData as DbUpdateVehicleData
} from './vehicle.queries';
import {
    // Comment out direct database imports
    // getAllCustomers as dbGetAllCustomers,
    // addCustomer as dbAddCustomer,
    // updateCustomer as dbUpdateCustomer,
    // deleteCustomer as dbDeleteCustomer,
    type Customer as DbCustomer, // Keep the type definition
    type NewCustomerData as DbNewCustomerData,
    type UpdateCustomerData as DbUpdateCustomerData
} from './customer.queries';

// 用户类型定义
interface User {
    id: string
    username: string
    name: string
    role: 'admin' | 'user'
    email?: string
}

// 认证状态类型定义
interface AuthState {
    user: User | null
    isAuthenticated: boolean
    login: (username: string, password: string) => Promise<boolean>
    logout: () => void
    isAdmin: () => boolean
}

// 预约类型定义
export interface Appointment {
    id: string
    dateTime: string
    contactName: string
    contactPhone: string
    contactAddress: string
    documentCount: number
    documentType: string
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
    assignedStaff?: string[]
    assignedVehicle?: string
    notes?: string
    createdAt: string
}

// 预约状态类型定义
interface AppointmentState {
    appointments: Appointment[]
    isLoading: boolean
    error: string | null
    fetchAppointments: () => Promise<void>
    addAppointment: (appointmentData: DbNewAppointmentData) => Promise<boolean>
    updateAppointment: (id: number, data: DbUpdateAppointmentData) => Promise<boolean>
    deleteAppointment: (id: number) => Promise<boolean>
    assignStaff: (appointmentId: number, staffId: number | null) => Promise<boolean>
    assignVehicle: (appointmentId: number, vehicleId: number | null) => Promise<boolean>
}

// Use the DB-aligned Customer type
export type CustomerUser = DbCustomer; // Rename export to match usage

// Update CustomerState to use the correct types and signatures
interface CustomerState {
    customers: CustomerUser[]; // Use the DB type
    isLoading: boolean;
    error: string | null;
    fetchCustomers: () => Promise<void>;
    addCustomer: (customerData: DbNewCustomerData) => Promise<boolean>; // Use specific type
    updateCustomer: (id: number, data: DbUpdateCustomerData) => Promise<boolean>; // Use specific type, id is number
    deleteCustomer: (id: number) => Promise<boolean>; // id is number
}

// Use the DB-aligned Staff type
export type Staff = DbStaff;

// 员工管理状态类型定义
interface StaffState {
    staffList: Staff[]
    isLoading: boolean
    error: string | null
    fetchStaff: () => Promise<void>
    addStaff: (name: string, status?: Staff['status']) => Promise<boolean>
    updateStaff: (id: number, data: Partial<Pick<Staff, 'name' | 'status'>>) => Promise<boolean>
    deleteStaff: (id: number) => Promise<boolean>
}

// Use the DB-aligned Vehicle type
export type Vehicle = DbVehicle;

// 车辆管理状态类型定义
interface VehicleState {
    vehicles: Vehicle[]
    isLoading: boolean
    error: string | null
    fetchVehicles: () => Promise<void>
    addVehicle: (vehicleData: DbNewVehicleData) => Promise<boolean>
    updateVehicle: (id: number, data: DbUpdateVehicleData) => Promise<boolean>
    deleteVehicle: (id: number) => Promise<boolean>
    toggleAvailability: (id: number) => Promise<boolean>
}

// 报表过滤条件类型定义
export interface ReportFilters {
    startDate?: string
    endDate?: string
    status?: string
    staffId?: string
    vehicleId?: string
}

// 报表数据类型定义
interface ReportData {
    appointments: Appointment[]
    totalAppointments: number
    completedAppointments: number
    cancelledAppointments: number
    pendingAppointments: number
}

// 报表管理状态类型定义
interface ReportState {
    reportData: ReportData | null
    isLoading: boolean
    error: string | null
    fetchReportData: (filters: ReportFilters) => Promise<void>
    exportToCSV: (filters: ReportFilters) => Promise<boolean>
    exportToExcel: (filters: ReportFilters) => Promise<boolean>
}

// 认证状态存储
export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            login: async (username: string, password: string) => {
                try {
                    // 使用API调用进行登录验证
                    const response = await fetch('/api/auth', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ username, password }),
                    });

                    const data = await response.json();

                    if (data.success && data.user) {
                        set({
                            user: data.user,
                            isAuthenticated: true
                        });
                        return true;
                    }
                    return false;
                } catch (error) {
                    console.error('登录失败:', error);
                    return false;
                }
            },
            logout: () => {
                set({ user: null, isAuthenticated: false });
            },
            isAdmin: () => {
                const { user } = get();
                return user?.role === 'admin';
            }
        }),
        {
            name: 'auth-storage'
        }
    )
)

// 模拟API延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// 创建UUID
const createId = () => Math.random().toString(36).substring(2, 9)

// Appointment Management State Store (Updated to use API)
export const useAppointmentStore = create<AppointmentState>()(
    persist(
        (set, get) => ({
            appointments: [],
            isLoading: false,
            error: null,
            fetchAppointments: async () => {
                set({ isLoading: true, error: null });
                try {
                    // Use API endpoint instead of direct DB call
                    const response = await fetch('/api/appointments');
                    const data = await response.json();

                    if (data.success) {
                        set({ appointments: data.appointments, isLoading: false });
                    } else {
                        throw new Error(data.message || '获取预约列表失败');
                    }
                } catch (error) {
                    console.error("Failed to fetch appointments:", error);
                    set({ isLoading: false, error: (error as Error).message });
                }
            },
            addAppointment: async (appointmentData) => {
                set({ isLoading: true, error: null });
                try {
                    // Use API endpoint instead of direct DB call
                    const response = await fetch('/api/appointments', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(appointmentData),
                    });

                    const data = await response.json();

                    if (data.success && data.appointment) {
                        set(state => ({
                            appointments: [...state.appointments, data.appointment],
                            isLoading: false
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
                    // Use API endpoint instead of direct DB call
                    const response = await fetch('/api/appointments', {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ id, ...data }),
                    });

                    const responseData = await response.json();

                    if (responseData.success && responseData.appointment) {
                        set(state => ({
                            appointments: state.appointments.map(app =>
                                app.id === id ? responseData.appointment : app
                            ),
                            isLoading: false
                        }));
                        return true;
                    } else {
                        throw new Error(responseData.message || `Failed to update appointment with ID ${id}.`);
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
                    // Use API endpoint instead of direct DB call
                    const response = await fetch(`/api/appointments?id=${id}`, {
                        method: 'DELETE',
                    });

                    const data = await response.json();

                    if (data.success) {
                        set(state => ({
                            appointments: state.appointments.filter(app => app.id !== id),
                            isLoading: false
                        }));
                        return true;
                    } else {
                        throw new Error(data.message || `Failed to delete appointment with ID ${id}.`);
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
            }
        }),
        {
            name: 'appointment-storage'
        }
    )
)

// Customer Management State Store (Updated to use API)
export const useCustomerStore = create<CustomerState>()(
    persist(
        (set) => ({
            customers: [],
            isLoading: false,
            error: null,
            fetchCustomers: async () => {
                set({ isLoading: true, error: null });
                try {
                    // Use API endpoint instead of direct DB call
                    const response = await fetch('/api/customers');
                    const data = await response.json();

                    if (data.success) {
                        set({ customers: data.customers, isLoading: false });
                    } else {
                        throw new Error(data.message || '获取客户列表失败');
                    }
                } catch (error) {
                    console.error("Failed to fetch customers:", error);
                    set({ isLoading: false, error: (error as Error).message });
                }
            },
            addCustomer: async (customerData) => {
                set({ isLoading: true, error: null });
                try {
                    // Use API endpoint instead of direct DB call
                    const response = await fetch('/api/customers', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(customerData),
                    });

                    const data = await response.json();

                    if (data.success && data.customer) {
                        set(state => ({
                            customers: [...state.customers, data.customer],
                            isLoading: false
                        }));
                        return true;
                    } else {
                        throw new Error(data.message || "Failed to add customer.");
                    }
                } catch (error) {
                    console.error("Failed to add customer:", error);
                    set({ isLoading: false, error: (error as Error).message });
                    return false;
                }
            },
            updateCustomer: async (id, data) => {
                set({ isLoading: true, error: null });
                try {
                    // Use API endpoint instead of direct DB call
                    const response = await fetch('/api/customers', {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ id, ...data }),
                    });

                    const responseData = await response.json();

                    if (responseData.success && responseData.customer) {
                        set(state => ({
                            customers: state.customers.map(c =>
                                c.id === id ? responseData.customer : c
                            ),
                            isLoading: false
                        }));
                        return true;
                    } else {
                        throw new Error(responseData.message || `Failed to update customer with ID ${id}.`);
                    }
                } catch (error) {
                    console.error("Failed to update customer:", error);
                    set({ isLoading: false, error: (error as Error).message });
                    return false;
                }
            },
            deleteCustomer: async (id) => {
                set({ isLoading: true, error: null });
                try {
                    // Use API endpoint instead of direct DB call
                    const response = await fetch(`/api/customers?id=${id}`, {
                        method: 'DELETE',
                    });

                    const data = await response.json();

                    if (data.success) {
                        set(state => ({
                            customers: state.customers.filter(c => c.id !== id),
                            isLoading: false
                        }));
                        return true;
                    } else {
                        throw new Error(data.message || `Failed to delete customer with ID ${id}.`);
                    }
                } catch (error) {
                    console.error("Failed to delete customer:", error);
                    set({ isLoading: false, error: (error as Error).message });
                    return false;
                }
            }
        }),
        {
            name: 'customer-storage'
        }
    )
)

// Staff Management State Store (Updated to use API)
export const useStaffStore = create<StaffState>()(
    persist(
        (set, get) => ({
            staffList: [],
            isLoading: false,
            error: null,
            fetchStaff: async () => {
                set({ isLoading: true, error: null });
                try {
                    // Use API endpoint instead of direct DB call
                    const response = await fetch('/api/staff');
                    const data = await response.json();

                    if (data.success) {
                        set({ staffList: data.staffList, isLoading: false });
                    } else {
                        throw new Error(data.message || '获取员工列表失败');
                    }
                } catch (error) {
                    console.error("Failed to fetch staff:", error);
                    set({ isLoading: false, error: (error as Error).message });
                }
            },
            addStaff: async (name, status) => {
                set({ isLoading: true, error: null });
                try {
                    // Use API endpoint instead of direct DB call
                    const response = await fetch('/api/staff', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ name, status }),
                    });

                    const data = await response.json();

                    if (data.success && data.staff) {
                        set(state => ({
                            staffList: [...state.staffList, data.staff],
                            isLoading: false
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
                    // Use API endpoint instead of direct DB call
                    const response = await fetch('/api/staff', {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ id, ...data }),
                    });

                    const responseData = await response.json();

                    if (responseData.success && responseData.staff) {
                        set(state => ({
                            staffList: state.staffList.map(staff =>
                                staff.id === id ? responseData.staff : staff
                            ),
                            isLoading: false
                        }));
                        return true;
                    } else {
                        throw new Error(responseData.message || `Failed to update staff member with ID ${id}.`);
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
                    // Use API endpoint instead of direct DB call
                    const response = await fetch(`/api/staff?id=${id}`, {
                        method: 'DELETE',
                    });

                    const data = await response.json();

                    if (data.success) {
                        set(state => ({
                            staffList: state.staffList.filter(staff => staff.id !== id),
                            isLoading: false
                        }));
                        return true;
                    } else {
                        throw new Error(data.message || `Failed to delete staff member with ID ${id}.`);
                    }
                } catch (error) {
                    console.error("Failed to delete staff:", error);
                    set({ isLoading: false, error: (error as Error).message });
                    return false;
                }
            },
        }),
        {
            name: 'staff-storage'
        }
    )
)

// Vehicle Management State Store (Updated to use API)
export const useVehicleStore = create<VehicleState>()(
    persist(
        (set, get) => ({
            vehicles: [],
            isLoading: false,
            error: null,
            fetchVehicles: async () => {
                set({ isLoading: true, error: null });
                try {
                    // Use API endpoint instead of direct DB call
                    const response = await fetch('/api/vehicles');
                    const data = await response.json();

                    if (data.success) {
                        set({ vehicles: data.vehicles, isLoading: false });
                    } else {
                        throw new Error(data.message || '获取车辆列表失败');
                    }
                } catch (error) {
                    console.error("Failed to fetch vehicles:", error);
                    set({ isLoading: false, error: (error as Error).message });
                }
            },
            addVehicle: async (vehicleData) => {
                set({ isLoading: true, error: null });
                try {
                    // Use API endpoint instead of direct DB call
                    const response = await fetch('/api/vehicles', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(vehicleData),
                    });

                    const data = await response.json();

                    if (data.success && data.vehicle) {
                        set(state => ({
                            vehicles: [...state.vehicles, data.vehicle],
                            isLoading: false
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
                    // Use API endpoint instead of direct DB call
                    const response = await fetch('/api/vehicles', {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ id, ...data }),
                    });

                    const responseData = await response.json();

                    if (responseData.success && responseData.vehicle) {
                        set(state => ({
                            vehicles: state.vehicles.map(v =>
                                v.id === id ? responseData.vehicle : v
                            ),
                            isLoading: false
                        }));
                        return true;
                    } else {
                        throw new Error(responseData.message || `Failed to update vehicle with ID ${id}.`);
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
                    // Use API endpoint instead of direct DB call
                    const response = await fetch(`/api/vehicles?id=${id}`, {
                        method: 'DELETE',
                    });

                    const data = await response.json();

                    if (data.success) {
                        set(state => ({
                            vehicles: state.vehicles.filter(v => v.id !== id),
                            isLoading: false
                        }));
                        return true;
                    } else {
                        throw new Error(data.message || `Failed to delete vehicle with ID ${id}.`);
                    }
                } catch (error) {
                    console.error("Failed to delete vehicle:", error);
                    set({ isLoading: false, error: (error as Error).message });
                    return false;
                }
            },
            toggleAvailability: async (id) => {
                const currentVehicle = get().vehicles.find(v => v.id === id);
                if (!currentVehicle) {
                    console.warn(`Vehicle with ID ${id} not found for toggling availability.`);
                    return false;
                }
                // Simple toggle: available <-> in_use. Maintenance needs explicit update.
                const newStatus = currentVehicle.status === 'available' ? 'in_use' : 'available';

                // Use the existing updateVehicle method through API
                return get().updateVehicle(id, { status: newStatus });
            }
        }),
        {
            name: 'vehicle-storage'
        }
    )
)

// 报表管理状态存储
export const useReportStore = create<ReportState>()((set) => ({
    reportData: null,
    isLoading: false,
    error: null,
    fetchReportData: async (filters) => {
        set({ isLoading: true, error: null })
        try {
            // 模拟API请求
            await delay(800)
            // 这里将来应该改为实际API调用，现在生成假数据
            const mockData: ReportData = {
                appointments: [],
                totalAppointments: 0,
                completedAppointments: 0,
                cancelledAppointments: 0,
                pendingAppointments: 0
            }
            set({ reportData: mockData, isLoading: false })
        } catch (error) {
            set({ isLoading: false, error: (error as Error).message })
        }
    },
    exportToCSV: async (filters) => {
        set({ isLoading: true, error: null })
        try {
            // 模拟API请求
            await delay(1000)
            // 这里将来应该改为实际API调用
            set({ isLoading: false })
            return true
        } catch (error) {
            set({ isLoading: false, error: (error as Error).message })
            return false
        }
    },
    exportToExcel: async (filters) => {
        set({ isLoading: true, error: null })
        try {
            // 模拟API请求
            await delay(1000)
            // 这里将来应该改为实际API调用
            set({ isLoading: false })
            return true
        } catch (error) {
            set({ isLoading: false, error: (error as Error).message })
            return false
        }
    }
})) 