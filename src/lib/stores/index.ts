// 从各个存储模块导出
export * from "./appointments";
export * from "./auth";
export * from "./checkout.store";
export * from "./info";
export * from "./staff";
export * from "./user";
export * from "./vehicles";
export * from "./destruction";

export type { User } from "./auth";
export type { Appointment } from "./appointments";
export type { Staff } from "./staff";
export type { Vehicle } from "./vehicles";
export type { AdminUser } from "./user"; 