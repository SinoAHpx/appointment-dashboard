import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
    addAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt'>) => Promise<boolean>
    updateAppointment: (id: string, data: Partial<Appointment>) => Promise<boolean>
    deleteAppointment: (id: string) => Promise<boolean>
    assignStaff: (appointmentId: string, staffIds: string[]) => Promise<boolean>
    assignVehicle: (appointmentId: string, vehicleId: string) => Promise<boolean>
}

// 用户信息类型定义
export interface CustomerUser {
    id: string
    name: string
    phone: string
    email: string
    address: string
    company?: string
    createdAt: string
}

// 用户管理状态类型定义
interface CustomerState {
    customers: CustomerUser[]
    isLoading: boolean
    error: string | null
    fetchCustomers: () => Promise<void>
    addCustomer: (customer: Omit<CustomerUser, 'id' | 'createdAt'>) => Promise<boolean>
    updateCustomer: (id: string, data: Partial<CustomerUser>) => Promise<boolean>
    deleteCustomer: (id: string) => Promise<boolean>
}

// 员工类型定义
export interface Staff {
    id: string
    name: string
    phone: string
    email: string
    position: string
    isAvailable: boolean
    createdAt: string
}

// 员工管理状态类型定义
interface StaffState {
    staffList: Staff[]
    isLoading: boolean
    error: string | null
    fetchStaff: () => Promise<void>
    addStaff: (staff: Omit<Staff, 'id' | 'createdAt'>) => Promise<boolean>
    updateStaff: (id: string, data: Partial<Staff>) => Promise<boolean>
    deleteStaff: (id: string) => Promise<boolean>
    toggleAvailability: (id: string) => Promise<boolean>
}

// 车辆类型定义
export interface Vehicle {
    id: string
    plateNumber: string
    model: string
    capacity: number
    isAvailable: boolean
    lastMaintenance?: string
    createdAt: string
}

// 车辆管理状态类型定义
interface VehicleState {
    vehicles: Vehicle[]
    isLoading: boolean
    error: string | null
    fetchVehicles: () => Promise<void>
    addVehicle: (vehicle: Omit<Vehicle, 'id' | 'createdAt'>) => Promise<boolean>
    updateVehicle: (id: string, data: Partial<Vehicle>) => Promise<boolean>
    deleteVehicle: (id: string) => Promise<boolean>
    toggleAvailability: (id: string) => Promise<boolean>
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

// 预约状态存储
export const useAppointmentStore = create<AppointmentState>()(
    persist(
        (set, get) => ({
            appointments: [],
            isLoading: false,
            error: null,
            fetchAppointments: async () => {
                set({ isLoading: true, error: null })
                try {
                    // 模拟API请求
                    await delay(500)
                    // 这里将来应该改为实际API调用
                    // 暂时不设置appointments，保持模拟数据为空
                    set({ isLoading: false })
                } catch (error) {
                    set({ isLoading: false, error: (error as Error).message })
                }
            },
            addAppointment: async (appointmentData) => {
                set({ isLoading: true, error: null })
                try {
                    // 模拟API请求
                    await delay(500)
                    // 创建新预约
                    const newAppointment: Appointment = {
                        ...appointmentData,
                        id: createId(),
                        createdAt: new Date().toISOString(),
                        status: 'pending'
                    }
                    // 更新状态
                    set(state => ({
                        appointments: [...state.appointments, newAppointment],
                        isLoading: false
                    }))
                    return true
                } catch (error) {
                    set({ isLoading: false, error: (error as Error).message })
                    return false
                }
            },
            updateAppointment: async (id, data) => {
                set({ isLoading: true, error: null })
                try {
                    // 模拟API请求
                    await delay(500)
                    // 更新预约
                    set(state => ({
                        appointments: state.appointments.map(appointment =>
                            appointment.id === id
                                ? { ...appointment, ...data }
                                : appointment
                        ),
                        isLoading: false
                    }))
                    return true
                } catch (error) {
                    set({ isLoading: false, error: (error as Error).message })
                    return false
                }
            },
            deleteAppointment: async (id) => {
                set({ isLoading: true, error: null })
                try {
                    // 模拟API请求
                    await delay(500)
                    // 删除预约
                    set(state => ({
                        appointments: state.appointments.filter(appointment => appointment.id !== id),
                        isLoading: false
                    }))
                    return true
                } catch (error) {
                    set({ isLoading: false, error: (error as Error).message })
                    return false
                }
            },
            assignStaff: async (appointmentId, staffIds) => {
                set({ isLoading: true, error: null })
                try {
                    // 模拟API请求
                    await delay(500)
                    // 分配员工
                    set(state => ({
                        appointments: state.appointments.map(appointment =>
                            appointment.id === appointmentId
                                ? { ...appointment, assignedStaff: staffIds }
                                : appointment
                        ),
                        isLoading: false
                    }))
                    return true
                } catch (error) {
                    set({ isLoading: false, error: (error as Error).message })
                    return false
                }
            },
            assignVehicle: async (appointmentId, vehicleId) => {
                set({ isLoading: true, error: null })
                try {
                    // 模拟API请求
                    await delay(500)
                    // 分配车辆
                    set(state => ({
                        appointments: state.appointments.map(appointment =>
                            appointment.id === appointmentId
                                ? { ...appointment, assignedVehicle: vehicleId }
                                : appointment
                        ),
                        isLoading: false
                    }))
                    return true
                } catch (error) {
                    set({ isLoading: false, error: (error as Error).message })
                    return false
                }
            }
        }),
        {
            name: 'appointment-storage'
        }
    )
)

// 用户管理状态存储
export const useCustomerStore = create<CustomerState>()(
    persist(
        (set) => ({
            customers: [],
            isLoading: false,
            error: null,
            fetchCustomers: async () => {
                set({ isLoading: true, error: null })
                try {
                    // 模拟API请求
                    await delay(500)
                    // 这里将来应该改为实际API调用
                    set({ isLoading: false })
                } catch (error) {
                    set({ isLoading: false, error: (error as Error).message })
                }
            },
            addCustomer: async (customerData) => {
                set({ isLoading: true, error: null })
                try {
                    // 模拟API请求
                    await delay(500)
                    // 创建新用户
                    const newCustomer: CustomerUser = {
                        ...customerData,
                        id: createId(),
                        createdAt: new Date().toISOString()
                    }
                    // 更新状态
                    set(state => ({
                        customers: [...state.customers, newCustomer],
                        isLoading: false
                    }))
                    return true
                } catch (error) {
                    set({ isLoading: false, error: (error as Error).message })
                    return false
                }
            },
            updateCustomer: async (id, data) => {
                set({ isLoading: true, error: null })
                try {
                    // 模拟API请求
                    await delay(500)
                    // 更新用户
                    set(state => ({
                        customers: state.customers.map(customer =>
                            customer.id === id
                                ? { ...customer, ...data }
                                : customer
                        ),
                        isLoading: false
                    }))
                    return true
                } catch (error) {
                    set({ isLoading: false, error: (error as Error).message })
                    return false
                }
            },
            deleteCustomer: async (id) => {
                set({ isLoading: true, error: null })
                try {
                    // 模拟API请求
                    await delay(500)
                    // 删除用户
                    set(state => ({
                        customers: state.customers.filter(customer => customer.id !== id),
                        isLoading: false
                    }))
                    return true
                } catch (error) {
                    set({ isLoading: false, error: (error as Error).message })
                    return false
                }
            }
        }),
        {
            name: 'customer-storage'
        }
    )
)

// 员工管理状态存储
export const useStaffStore = create<StaffState>()(
    persist(
        (set) => ({
            staffList: [],
            isLoading: false,
            error: null,
            fetchStaff: async () => {
                set({ isLoading: true, error: null })
                try {
                    // 模拟API请求
                    await delay(500)
                    // 这里将来应该改为实际API调用
                    set({ isLoading: false })
                } catch (error) {
                    set({ isLoading: false, error: (error as Error).message })
                }
            },
            addStaff: async (staffData) => {
                set({ isLoading: true, error: null })
                try {
                    // 模拟API请求
                    await delay(500)
                    // 创建新员工
                    const newStaff: Staff = {
                        ...staffData,
                        id: createId(),
                        createdAt: new Date().toISOString()
                    }
                    // 更新状态
                    set(state => ({
                        staffList: [...state.staffList, newStaff],
                        isLoading: false
                    }))
                    return true
                } catch (error) {
                    set({ isLoading: false, error: (error as Error).message })
                    return false
                }
            },
            updateStaff: async (id, data) => {
                set({ isLoading: true, error: null })
                try {
                    // 模拟API请求
                    await delay(500)
                    // 更新员工
                    set(state => ({
                        staffList: state.staffList.map(staff =>
                            staff.id === id
                                ? { ...staff, ...data }
                                : staff
                        ),
                        isLoading: false
                    }))
                    return true
                } catch (error) {
                    set({ isLoading: false, error: (error as Error).message })
                    return false
                }
            },
            deleteStaff: async (id) => {
                set({ isLoading: true, error: null })
                try {
                    // 模拟API请求
                    await delay(500)
                    // 删除员工
                    set(state => ({
                        staffList: state.staffList.filter(staff => staff.id !== id),
                        isLoading: false
                    }))
                    return true
                } catch (error) {
                    set({ isLoading: false, error: (error as Error).message })
                    return false
                }
            },
            toggleAvailability: async (id) => {
                set({ isLoading: true, error: null })
                try {
                    // 模拟API请求
                    await delay(500)
                    // 切换可用性
                    set(state => ({
                        staffList: state.staffList.map(staff =>
                            staff.id === id
                                ? { ...staff, isAvailable: !staff.isAvailable }
                                : staff
                        ),
                        isLoading: false
                    }))
                    return true
                } catch (error) {
                    set({ isLoading: false, error: (error as Error).message })
                    return false
                }
            }
        }),
        {
            name: 'staff-storage'
        }
    )
)

// 车辆管理状态存储
export const useVehicleStore = create<VehicleState>()(
    persist(
        (set) => ({
            vehicles: [],
            isLoading: false,
            error: null,
            fetchVehicles: async () => {
                set({ isLoading: true, error: null })
                try {
                    // 模拟API请求
                    await delay(500)
                    // 这里将来应该改为实际API调用
                    set({ isLoading: false })
                } catch (error) {
                    set({ isLoading: false, error: (error as Error).message })
                }
            },
            addVehicle: async (vehicleData) => {
                set({ isLoading: true, error: null })
                try {
                    // 模拟API请求
                    await delay(500)
                    // 创建新车辆
                    const newVehicle: Vehicle = {
                        ...vehicleData,
                        id: createId(),
                        createdAt: new Date().toISOString()
                    }
                    // 更新状态
                    set(state => ({
                        vehicles: [...state.vehicles, newVehicle],
                        isLoading: false
                    }))
                    return true
                } catch (error) {
                    set({ isLoading: false, error: (error as Error).message })
                    return false
                }
            },
            updateVehicle: async (id, data) => {
                set({ isLoading: true, error: null })
                try {
                    // 模拟API请求
                    await delay(500)
                    // 更新车辆
                    set(state => ({
                        vehicles: state.vehicles.map(vehicle =>
                            vehicle.id === id
                                ? { ...vehicle, ...data }
                                : vehicle
                        ),
                        isLoading: false
                    }))
                    return true
                } catch (error) {
                    set({ isLoading: false, error: (error as Error).message })
                    return false
                }
            },
            deleteVehicle: async (id) => {
                set({ isLoading: true, error: null })
                try {
                    // 模拟API请求
                    await delay(500)
                    // 删除车辆
                    set(state => ({
                        vehicles: state.vehicles.filter(vehicle => vehicle.id !== id),
                        isLoading: false
                    }))
                    return true
                } catch (error) {
                    set({ isLoading: false, error: (error as Error).message })
                    return false
                }
            },
            toggleAvailability: async (id) => {
                set({ isLoading: true, error: null })
                try {
                    // 模拟API请求
                    await delay(500)
                    // 切换可用性
                    set(state => ({
                        vehicles: state.vehicles.map(vehicle =>
                            vehicle.id === id
                                ? { ...vehicle, isAvailable: !vehicle.isAvailable }
                                : vehicle
                        ),
                        isLoading: false
                    }))
                    return true
                } catch (error) {
                    set({ isLoading: false, error: (error as Error).message })
                    return false
                }
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