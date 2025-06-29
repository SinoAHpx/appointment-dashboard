import { type Appointment } from "@/lib/stores/appointments";

// 文件介质类别
export const documentCategories = [
    { value: "paper", label: "纸介质" },
    { value: "magnetic", label: "磁介质" },
    { value: "other", label: "其他介质" },
];

// 按类别分类的文件类型选项
export const documentTypesByCategory = {
    "paper": [
        { value: "confidential", label: "保密文件袋" },
        { value: "standard", label: "普通文件袋" },
        { value: "large", label: "大型文件盒" },
        { value: "small", label: "小型文件盒" },
    ],
    "magnetic": [
        { value: "computer", label: "主机" },
        { value: "laptop", label: "笔记本" },
        { value: "printer", label: "打印机" },
        { value: "videotape", label: "录像带" },
        { value: "motherboard", label: "主板" },
        { value: "server", label: "服务器" },
        { value: "disc", label: "光盘" },
        { value: "copier", label: "复印机" },
        { value: "scanner", label: "扫描仪" },
        { value: "monitor", label: "显示器" },
        { value: "harddrive", label: "硬盘" },
        { value: "fax", label: "传真机" },
        { value: "shredder", label: "碎纸机" },
        { value: "usb", label: "U盘" },
        { value: "floppy", label: "软盘" },
        { value: "toner", label: "硒鼓" },
        { value: "cartridge", label: "墨盒" },
        { value: "tape", label: "磁带" },
    ],
    "other": [
        { value: "mixed", label: "混合介质" },
        { value: "custom", label: "自定义" }
    ]
};

// 保留原有的扁平文件类型列表以便向后兼容
export const documentTypes = [
    { value: "confidential", label: "保密文件袋" },
    { value: "standard", label: "普通文件袋" },
    { value: "large", label: "大型文件盒" },
    { value: "small", label: "小型文件盒" },
    { value: "electromagnetic", label: "电磁介质" },
    { value: "other", label: "其他介质" },
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
                label: "已预约",
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
            return "已预约";
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