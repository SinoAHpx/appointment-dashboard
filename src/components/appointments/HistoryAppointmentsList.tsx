"use client";

import { ArrowLeft, FileText, Search } from "lucide-react";
import { UserAppointmentCard } from "./UserAppointmentCard";
import { type Appointment } from "@/lib/stores/appointments";
import { getSmartPaginationPages } from "@/lib/utils";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";

interface HistoryAppointmentsListProps {
    appointments: Appointment[];
    isLoading: boolean;
    onBack: () => void;
}

export function HistoryAppointmentsList({
    appointments,
    isLoading,
    onBack,
}: HistoryAppointmentsListProps) {
    // 搜索和过滤状态
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "cancelled">("all");

    // 分页状态
    const [page, setPage] = useState(1);
    const perPage = 8; // 历史预约每页显示8条

    // 过滤出历史预约 (已完成或已取消的)
    const historyAppointments = useMemo(() => {
        let filtered = appointments.filter(
            appointment => appointment.status === "completed" || appointment.status === "cancelled"
        );

        // 根据状态过滤
        if (statusFilter !== "all") {
            filtered = filtered.filter(appointment => appointment.status === statusFilter);
        }

        // 根据搜索查询过滤
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(appointment =>
                appointment.contactName?.toLowerCase().includes(query) ||
                appointment.contactPhone?.includes(query) ||
                appointment.contactAddress?.toLowerCase().includes(query) ||
                appointment.appointmentId?.toLowerCase().includes(query) ||
                appointment.documentType?.toLowerCase().includes(query)
            );
        }

        // 按时间倒序排序
        return filtered.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
    }, [appointments, searchQuery, statusFilter]);

    const totalPages = Math.ceil(historyAppointments.length / perPage);

    // 分页数据
    const paginatedAppointments = historyAppointments.slice(
        (page - 1) * perPage,
        page * perPage
    );

    // 处理页面变更
    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };

    // 重置分页当搜索或过滤条件改变时
    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        setPage(1);
    };

    const handleStatusFilterChange = (value: string) => {
        setStatusFilter(value as "all" | "completed" | "cancelled");
        setPage(1);
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case "completed":
                return "已完成";
            case "cancelled":
                return "已取消";
            default:
                return status;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed":
                return "text-green-600 bg-green-50 border-green-200";
            case "cancelled":
                return "text-red-600 bg-red-50 border-red-200";
            default:
                return "text-gray-600 bg-gray-50 border-gray-200";
        }
    };

    if (isLoading) {
        return (
            <div className="text-center py-12">
                <p>加载中...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 头部导航 */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    onClick={onBack}
                    className="flex items-center gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    返回当前预约
                </Button>
                <h2 className="text-xl font-semibold text-gray-900">历史预约</h2>
            </div>

            {/* 搜索和筛选 */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="搜索联系人、电话、地址或预约编号..."
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                    <SelectTrigger className="w-full sm:w-40">
                        <SelectValue placeholder="筛选状态" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">全部状态</SelectItem>
                        <SelectItem value="completed">已完成</SelectItem>
                        <SelectItem value="cancelled">已取消</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* 结果统计 */}
            <div className="text-sm text-gray-600">
                共找到 {historyAppointments.length} 条历史预约记录
                {searchQuery && ` (关键词: "${searchQuery}")`}
                {statusFilter !== "all" && ` (状态: ${getStatusText(statusFilter)})`}
            </div>

            {/* 预约列表 */}
            {historyAppointments.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                        {searchQuery || statusFilter !== "all" ? "未找到匹配的历史预约" : "暂无历史预约记录"}
                    </h3>
                    <p className="text-gray-500 mb-4">
                        {searchQuery || statusFilter !== "all"
                            ? "请尝试调整搜索条件或筛选器"
                            : "完成或取消的预约将出现在这里"
                        }
                    </p>
                    {(searchQuery || statusFilter !== "all") && (
                        <Button
                            variant="outline"
                            onClick={() => {
                                setSearchQuery("");
                                setStatusFilter("all");
                                setPage(1);
                            }}
                        >
                            清除筛选条件
                        </Button>
                    )}
                </div>
            ) : (
                <>
                    <div className="space-y-4">
                        {paginatedAppointments.map((appointment) => (
                            <div key={appointment.id} className="relative">
                                <UserAppointmentCard appointment={appointment} />
                                {/* 状态标签覆盖 */}
                                <div className={`absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                                    {getStatusText(appointment.status)}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* 分页 */}
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
                                    {getSmartPaginationPages(page, totalPages).map((item) => (
                                        <PaginationItem key={item.key}>
                                            {item.type === 'ellipsis' ? (
                                                <PaginationEllipsis />
                                            ) : (
                                                <PaginationLink
                                                    href="#"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handlePageChange(item.value);
                                                    }}
                                                    isActive={page === item.value}
                                                >
                                                    {item.value}
                                                </PaginationLink>
                                            )}
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