import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
    type Customer as DbCustomer,
    type NewCustomerData as DbNewCustomerData,
    type UpdateCustomerData as DbUpdateCustomerData,
} from "../db/customer.queries";

// 导出客户类型
export type CustomerUser = DbCustomer;

// 客户状态类型定义
interface CustomerState {
    customers: CustomerUser[];
    isLoading: boolean;
    error: string | null;
    fetchCustomers: () => Promise<void>;
    addCustomer: (customerData: DbNewCustomerData) => Promise<boolean>;
    updateCustomer: (id: number, data: DbUpdateCustomerData) => Promise<boolean>;
    deleteCustomer: (id: number) => Promise<boolean>;
}

// Customer Management State Store
export const useCustomerStore = create<CustomerState>()(
    persist(
        (set) => ({
            customers: [],
            isLoading: false,
            error: null,
            fetchCustomers: async () => {
                set({ isLoading: true, error: null });
                try {
                    // Use API endpoint
                    const response = await fetch("/api/customers");
                    const data = await response.json();

                    if (data.success) {
                        set({ customers: data.customers, isLoading: false });
                    } else {
                        throw new Error(data.message || "获取客户列表失败");
                    }
                } catch (error) {
                    console.error("Failed to fetch customers:", error);
                    set({ isLoading: false, error: (error as Error).message });
                }
            },
            addCustomer: async (customerData) => {
                set({ isLoading: true, error: null });
                try {
                    // Use API endpoint
                    const response = await fetch("/api/customers", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(customerData),
                    });

                    const data = await response.json();

                    if (data.success && data.customer) {
                        set((state) => ({
                            customers: [...state.customers, data.customer],
                            isLoading: false,
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
                    // Use API endpoint
                    const response = await fetch("/api/customers", {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ id, ...data }),
                    });

                    const responseData = await response.json();

                    if (responseData.success && responseData.customer) {
                        set((state) => ({
                            customers: state.customers.map((c) =>
                                c.id === id ? responseData.customer : c,
                            ),
                            isLoading: false,
                        }));
                        return true;
                    } else {
                        throw new Error(
                            responseData.message ||
                            `Failed to update customer with ID ${id}.`,
                        );
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
                    // Use API endpoint
                    const response = await fetch(`/api/customers?id=${id}`, {
                        method: "DELETE",
                    });

                    const data = await response.json();

                    if (data.success) {
                        set((state) => ({
                            customers: state.customers.filter((c) => c.id !== id),
                            isLoading: false,
                        }));
                        return true;
                    } else {
                        throw new Error(
                            data.message || `Failed to delete customer with ID ${id}.`,
                        );
                    }
                } catch (error) {
                    console.error("Failed to delete customer:", error);
                    set({ isLoading: false, error: (error as Error).message });
                    return false;
                }
            },
        }),
        {
            name: "customer-storage",
        },
    ),
); 