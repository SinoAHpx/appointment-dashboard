"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminAppointmentTable } from "./AdminAppointmentTable";
import { type Appointment } from "@/lib/stores/appointments";
import { getStatusColor, getStatusLabel } from "@/lib/utils/appointments/helpers";
import { useState, useEffect } from "react";

// 预约状态列表
const appointmentStatuses: Appointment["status"][] = [
    "pending",
    "confirmed",
    "in_progress",
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
    const [activeTab, setActiveTab] = useState<string>("all");

    // 按状态筛选的预约
    const filteredAppointments = activeTab === "all"
        ? appointments
        : appointments.filter(appointment => appointment.status === activeTab);

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
        all: appointments.length,
        pending: appointments.filter(a => a.status === "pending").length,
        confirmed: appointments.filter(a => a.status === "confirmed").length,
        in_progress: appointments.filter(a => a.status === "in_progress").length,
        completed: appointments.filter(a => a.status === "completed").length,
        cancelled: appointments.filter(a => a.status === "cancelled").length,
    };

    return (
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
                <TabsTrigger value="all">
                    全部预约
                    <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-800">
                        {counts.all}
                    </span>
                </TabsTrigger>
                {appointmentStatuses.map((status) => (
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

            <TabsContent value="all">
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

            {appointmentStatuses.map((status) => (
                <TabsContent key={status} value={status}>
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