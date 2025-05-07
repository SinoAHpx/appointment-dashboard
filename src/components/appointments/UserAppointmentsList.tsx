"use client";

import { Button } from "@/components/ui/button";
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

interface UserAppointmentsListProps {
    appointments: Appointment[];
    isLoading: boolean;
    searchQuery: string;
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onClearSearch: () => void;
}

export function UserAppointmentsList({
    appointments,
    isLoading,
    searchQuery,
    page,
    totalPages,
    onPageChange,
    onClearSearch,
}: UserAppointmentsListProps) {
    return (
        <div>
            {isLoading ? (
                <div className="text-center py-12">
                    <p>加载中...</p>
                </div>
            ) : appointments.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                        {searchQuery ? "没有找到匹配的预约" : "暂无预约记录"}
                    </h3>
                    <p className="text-gray-500 mb-4">
                        {searchQuery
                            ? "请尝试使用其他关键词搜索"
                            : "点击上方的「新建预约」按钮创建您的第一个预约"}
                    </p>
                    {searchQuery && (
                        <Button variant="outline" onClick={onClearSearch}>
                            清除搜索
                        </Button>
                    )}
                </div>
            ) : (
                <div>
                    {appointments.map((appointment) => (
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
                                                if (page > 1) onPageChange(page - 1);
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
                                                    onPageChange(i + 1);
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
                                                if (page < totalPages) onPageChange(page + 1);
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
            )}
        </div>
    );
} 