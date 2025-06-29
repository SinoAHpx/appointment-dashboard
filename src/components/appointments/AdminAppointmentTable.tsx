"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { type Appointment } from "@/lib/stores/appointments";
import { formatDateTime, getStatusColor, getStatusLabel } from "@/lib/utils/appointments/helpers";
import { Edit, Trash, Eye } from "lucide-react";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { AppointmentDetailsDialog } from "./AppointmentDetailsDialog";

interface AdminAppointmentTableProps {
    appointments: Appointment[];
    isLoading: boolean;
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onEdit: (appointment: Appointment) => void;
    onDelete: (id: string) => void;
    onStatusUpdate: (id: string, status: Appointment["status"]) => void;
}

export function AdminAppointmentTable({
    appointments,
    isLoading,
    page,
    totalPages,
    onPageChange,
    onEdit,
    onDelete,
    onStatusUpdate,
}: AdminAppointmentTableProps) {
    // Render status and action buttons
    const renderStatusCell = (appointment: Appointment) => {
        return (
            <div className="flex items-center gap-2">
                <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}
                >
                    {getStatusLabel(appointment.status)}
                </span>
            </div>
        );
    };

    return (
        <Card>
            <CardContent className="pt-6">
                <Table>
                    <TableCaption>预约列表</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead>预约编号</TableHead>
                            <TableHead>预约时间</TableHead>
                            <TableHead>联系人</TableHead>
                            <TableHead>联系电话</TableHead>
                            <TableHead>地址</TableHead>
                            <TableHead>状态</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-6">
                                    加载中...
                                </TableCell>
                            </TableRow>
                        ) : appointments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-6">
                                    暂无预约记录
                                </TableCell>
                            </TableRow>
                        ) : (
                            appointments.map((appointment) => (
                                <TableRow key={appointment.id}>
                                    <TableCell>
                                        <Badge variant="outline" className="font-mono font-medium">
                                            {appointment.appointmentId || `APT-${appointment.id}`}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{formatDateTime(appointment.dateTime)}</TableCell>
                                    <TableCell>{appointment.contactName}</TableCell>
                                    <TableCell>{appointment.contactPhone}</TableCell>
                                    <TableCell className="max-w-xs truncate">
                                        {appointment.contactAddress}
                                    </TableCell>
                                    <TableCell>
                                        {renderStatusCell(appointment)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <AppointmentDetailsDialog
                                                            appointment={appointment}
                                                            trigger={
                                                                <Button
                                                                    variant="outline"
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <Eye size={16} />
                                                                        详情
                                                                    </div>

                                                                </Button>
                                                            }
                                                        />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>查看详情</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => onEdit(appointment)}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <Edit size={16} />
                                                                处理
                                                            </div>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>处理</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <ConfirmDeleteDialog
                                                            title="删除预约"
                                                            description="确定要删除这个预约吗？"
                                                            onConfirm={() => onDelete(appointment.id)}
                                                            trigger={<Trash size={16} />}
                                                        />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>删除预约</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
            {totalPages > 1 && (
                <CardFooter>
                    <Pagination className="w-full justify-center">
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
                </CardFooter>
            )}
        </Card>
    );
} 