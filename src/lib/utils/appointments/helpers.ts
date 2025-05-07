import { type Appointment } from "@/lib/stores/appointments";

// 文件袋类型选项
export const documentTypes = [
    { value: "confidential", label: "保密文件袋" },
    { value: "standard", label: "普通文件袋" },
    { value: "large", label: "大型文件盒" },
    { value: "small", label: "小型文件盒" },
];

// Get status display data
export function getStatusData(status: string) {
    switch (status) {
        case "pending":
            return {
                label: "待处理",
                color: "bg-yellow-100 text-yellow-800 border-yellow-300",
                icon: "clock",
            };
        case "confirmed":
            return {
                label: "已确认",
                color: "bg-blue-100 text-blue-800 border-blue-300",
                icon: "check-circle",
            };
        case "in_progress":
            return {
                label: "处理中",
                color: "bg-purple-100 text-purple-800 border-purple-300",
                icon: "rotate-ccw",
            };
        case "completed":
            return {
                label: "已完成",
                color: "bg-green-100 text-green-800 border-green-300",
                icon: "check-circle",
            };
        case "cancelled":
            return {
                label: "已取消",
                color: "bg-red-100 text-red-800 border-red-300",
                icon: "x-circle",
            };
        default:
            return {
                label: "未知状态",
                color: "bg-gray-100 text-gray-800 border-gray-300",
                icon: "clock",
            };
    }
}

// Format date time
export function formatDateTime(dateTimeStr: string) {
    try {
        const date = new Date(dateTimeStr);
        return new Intl.DateTimeFormat("zh-CN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        }).format(date);
    } catch (e) {
        return dateTimeStr || "未设置时间";
    }
}

// Get status label
export function getStatusLabel(status: string) {
    switch (status) {
        case "pending":
            return "待确认";
        case "confirmed":
            return "已确认";
        case "in_progress":
            return "处理中";
        case "completed":
            return "已完成";
        case "cancelled":
            return "已取消";
        default:
            return status;
    }
}

// Get status color
export function getStatusColor(status: string) {
    switch (status) {
        case "pending":
            return "bg-yellow-100 text-yellow-800";
        case "confirmed":
            return "bg-blue-100 text-blue-800";
        case "in_progress":
            return "bg-purple-100 text-purple-800";
        case "completed":
            return "bg-green-100 text-green-800";
        case "cancelled":
            return "bg-red-100 text-red-800";
        default:
            return "bg-gray-100 text-gray-800";
    }
}

// Filter appointments based on search query
export function filterAppointments(appointments: Appointment[], searchQuery: string) {
    return appointments.filter(
        (appointment) =>
            (appointment.contactName ?? '')
                .toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
            (appointment.contactPhone ?? '').includes(searchQuery) ||
            (appointment.contactAddress ?? '')
                .toLowerCase()
                .includes(searchQuery.toLowerCase()),
    );
} 