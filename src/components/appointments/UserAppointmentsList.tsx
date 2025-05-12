"use client";

import { FileText } from "lucide-react";
import { UserAppointmentCard } from "./UserAppointmentCard";
import { type Appointment } from "@/lib/stores/appointments";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { useState } from "react";

interface UserAppointmentsListProps {
    appointments: Appointment[];
    isLoading: boolean;
}

export function UserAppointmentsList({
    appointments,
    isLoading,
}: UserAppointmentsListProps) {
    // 内部分页逻辑
    const [page, setPage] = useState(1);
    const perPage = 5; // 用户界面每页显示5条
    const totalPages = Math.ceil(appointments.length / perPage);

    // 分页数据
    const paginatedAppointments = appointments
        .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
        .slice((page - 1) * perPage, page * perPage);

    // 处理页面变更
    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };

    const hasAppointments = appointments.length > 0;

    if (isLoading) {
        return (
            <div className="text-center py-12">
                <p>加载中...</p>
            </div>
        );
    }

    if (!hasAppointments) {
        return (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                    暂无预约记录
                </h3>
                <p className="text-gray-500 mb-4">
                    点击上方的「新建预约」按钮创建您的第一个预约
                </p>
            </div>
        );
    }

    return (
        <div>
            {paginatedAppointments.map((appointment) => (
                <UserAppointmentCard key={appointment.id} appointment={appointment} />
            ))}

            {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (page > 1) handlePageChange(page - 1);
                                    }}
                                    className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                                />
                            </PaginationItem>
                            {Array.from({ length: totalPages }).map((_, i) => (
                                <PaginationItem key={i}>
                                    <PaginationLink
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handlePageChange(i + 1);
                                        }}
                                        isActive={page === i + 1}
                                    >
                                        {i + 1}
                                    </PaginationLink>
                                </PaginationItem>
                            ))}
                            <PaginationItem>
                                <PaginationNext
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (page < totalPages) handlePageChange(page + 1);
                                    }}
                                    className={
                                        page >= totalPages ? "pointer-events-none opacity-50" : ""
                                    }
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}
        </div>
    );
} 