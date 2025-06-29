"use client";

import { FileText, History } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface UserAppointmentsListProps {
    appointments: Appointment[];
    isLoading: boolean;
    onShowHistory: () => void;
}

export function UserAppointmentsList({
    appointments,
    isLoading,
    onShowHistory,
}: UserAppointmentsListProps) {
    // 内部分页逻辑
    const [page, setPage] = useState(1);
    const perPage = 5; // 用户界面每页显示5条

    // 过滤出未完成的预约 (排除已完成和已取消的)
    const activeAppointments = appointments.filter(
        appointment => appointment.status !== "completed" && appointment.status !== "cancelled"
    );

    // 获取历史预约数量 (已完成或已取消的)
    const historyCount = appointments.filter(
        appointment => appointment.status === "completed" || appointment.status === "cancelled"
    ).length;

    const totalPages = Math.ceil(activeAppointments.length / perPage);

    // 分页数据
    const paginatedAppointments = activeAppointments
        .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
        .slice((page - 1) * perPage, page * perPage);

    // 处理页面变更
    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };

    const hasActiveAppointments = activeAppointments.length > 0;

    if (isLoading) {
        return (
            <div className="text-center py-12">
                <p>加载中...</p>
            </div>
        );
    }

    return (
        <div>
            {/* 历史预约入口 */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">当前预约</h2>
                <Button
                    variant="outline"
                    onClick={onShowHistory}
                    className="flex items-center gap-2"
                >
                    <History className="h-4 w-4" />
                    历史预约 {historyCount > 0 && `(${historyCount})`}
                </Button>
            </div>

            {!hasActiveAppointments ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                        暂无进行中的预约
                    </h3>
                    <p className="text-gray-500 mb-4">
                        点击上方的「新建预约」按钮创建您的第一个预约
                    </p>
                    {historyCount > 0 && (
                        <Button
                            variant="link"
                            onClick={onShowHistory}
                            className="text-blue-600 hover:text-blue-800"
                        >
                            查看历史预约记录 ({historyCount} 条)
                        </Button>
                    )}
                </div>
            ) : (
                <>
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
                </>
            )}
        </div>
    );
} 