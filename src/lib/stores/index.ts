// 从各个存储模块导出
export { useAuthStore } from "./auth";
export type { User } from "./auth";

export { useAppointmentStore } from "./appointments";
export type { Appointment } from "./appointments";

export { useCustomerStore } from "./customers";
export type { CustomerUser } from "./customers";

export { useStaffStore } from "./staff";
export type { Staff } from "./staff";

export { useVehicleStore } from "./vehicles";
export type { Vehicle } from "./vehicles"; 