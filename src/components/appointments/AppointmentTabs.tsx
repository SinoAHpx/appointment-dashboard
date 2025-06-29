"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminAppointmentTable } from "./AdminAppointmentTable";
import { type Appointment } from "@/lib/stores/appointments";
import { getStatusColor, getStatusLabel } from "@/lib/utils/appointments/helpers";
import { useState, useEffect } from "react";

// 当前预约状态列表（排除已完成和已取消）
const activeStatuses: Appointment["status"][] = [
    "pending",
    "confirmed",
    "in_progress",
];

// 历史预约状态列表
const historyStatuses: Appointment["status"][] = [
    "completed",
    "cancelled",
];

interface AppointmentTabsProps {
    appointments: Appointment[];
    isLoading: boolean;
    onEdit: (appointment: Appointment) => void;
    onDelete: (id: string) => void;
    onStatusUpdate: (id: string, status: Appointment["status"]) => void;
}

export function AppointmentTabs({
    appointments,
    isLoading,
    onEdit,
    onDelete,
    onStatusUpdate,
}: AppointmentTabsProps) {
    const [activeTab, setActiveTab] = useState<string>("current");

    // 按类别筛选的预约
    const getFilteredAppointments = () => {
        switch (activeTab) {
            case "current":
                return appointments.filter(appointment =>
                    activeStatuses.includes(appointment.status)
                );
            case "history":
                return appointments.filter(appointment =>
                    historyStatuses.includes(appointment.status)
                );
            case "pending":
                return appointments.filter(appointment => appointment.status === "pending");
            case "confirmed":
                return appointments.filter(appointment => appointment.status === "confirmed");
            case "in_progress":
                return appointments.filter(appointment => appointment.status === "in_progress");
            case "completed":
                return appointments.filter(appointment => appointment.status === "completed");
            case "cancelled":
                return appointments.filter(appointment => appointment.status === "cancelled");
            default:
                return appointments;
        }
    };

    const filteredAppointments = getFilteredAppointments();

    // 分页状态
    const [page, setPage] = useState(1);
    const perPage = 10;
    const totalPages = Math.ceil(filteredAppointments.length / perPage);

    // 重置页码当标签页变化时
    useEffect(() => {
        setPage(1);
    }, [activeTab]);

    // 分页数据
    const paginatedAppointments = filteredAppointments
        .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
        .slice((page - 1) * perPage, page * perPage);

    // 处理页面变更
    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };

    // 统计各状态的预约数量
    const counts = {
        current: appointments.filter(a => activeStatuses.includes(a.status)).length,
        history: appointments.filter(a => historyStatuses.includes(a.status)).length,
        pending: appointments.filter(a => a.status === "pending").length,
        confirmed: appointments.filter(a => a.status === "confirmed").length,
        in_progress: appointments.filter(a => a.status === "in_progress").length,
        completed: appointments.filter(a => a.status === "completed").length,
        cancelled: appointments.filter(a => a.status === "cancelled").length,
    };

    return (
        <Tabs defaultValue="current" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
                <TabsTrigger value="current">
                    当前预约
                    <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                        {counts.current}
                    </span>
                </TabsTrigger>
                <TabsTrigger value="history">
                    历史预约
                    <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-800">
                        {counts.history}
                    </span>
                </TabsTrigger>
                {/* 详细状态标签页 */}
                {activeStatuses.map((status) => (
                    <TabsTrigger key={status} value={status}>
                        {getStatusLabel(status)}
                        <span
                            className={`ml-2 px-2 py-0.5 rounded-full text-xs ${getStatusColor(status)}`}
                        >
                            {counts[status]}
                        </span>
                    </TabsTrigger>
                ))}
                {historyStatuses.map((status) => (
                    <TabsTrigger key={status} value={status}>
                        {getStatusLabel(status)}
                        <span
                            className={`ml-2 px-2 py-0.5 rounded-full text-xs ${getStatusColor(status)}`}
                        >
                            {counts[status]}
                        </span>
                    </TabsTrigger>
                ))}
            </TabsList>

            {/* 当前预约标签页 */}
            <TabsContent value="current">
                <div className="mb-4">
                    <p className="text-sm text-gray-600">
                        显示所有待处理、已确认和进行中的预约 ({counts.current} 条)
                    </p>
                </div>
                <AdminAppointmentTable
                    appointments={paginatedAppointments}
                    isLoading={isLoading}
                    page={page}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onStatusUpdate={onStatusUpdate}
                />
            </TabsContent>

            {/* 历史预约标签页 */}
            <TabsContent value="history">
                <div className="mb-4">
                    <p className="text-sm text-gray-600">
                        显示所有已完成和已取消的预约 ({counts.history} 条)
                    </p>
                </div>
                <AdminAppointmentTable
                    appointments={paginatedAppointments}
                    isLoading={isLoading}
                    page={page}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onStatusUpdate={onStatusUpdate}
                />
            </TabsContent>

            {/* 详细状态标签页 */}
            {[...activeStatuses, ...historyStatuses].map((status) => (
                <TabsContent key={status} value={status}>
                    <div className="mb-4">
                        <p className="text-sm text-gray-600">
                            显示状态为「{getStatusLabel(status)}」的预约 ({counts[status]} 条)
                        </p>
                    </div>
                    <AdminAppointmentTable
                        appointments={paginatedAppointments}
                        isLoading={isLoading}
                        page={page}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onStatusUpdate={onStatusUpdate}
                    />
                </TabsContent>
            ))}
        </Tabs>
    );
} 