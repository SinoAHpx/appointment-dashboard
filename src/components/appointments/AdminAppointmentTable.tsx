"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
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
import { documentTypes, formatDateTime, getStatusColor, getStatusLabel } from "@/lib/utils/appointments/helpers";
import { CheckCircle, Clock, Pencil, RotateCcw, Trash, Truck, XCircle } from "lucide-react";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

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
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="ml-2 h-7 px-2 text-xs"
                        >
                            处理
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-2">
                        <div className="grid gap-1">
                            <h4 className="text-sm font-semibold mb-1">更新状态</h4>
                            <Button
                                variant="ghost"
                                size="sm"
                                className={`justify-start text-xs ${appointment.status === "pending" ? "bg-secondary" : ""}`}
                                onClick={() => onStatusUpdate(appointment.id, "pending")}
                                disabled={appointment.status === "pending"}
                            >
                                <RotateCcw className="mr-2 h-4 w-4" />
                                待确认
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className={`justify-start text-xs ${appointment.status === "confirmed" ? "bg-secondary" : ""}`}
                                onClick={() => onStatusUpdate(appointment.id, "confirmed")}
                                disabled={appointment.status === "confirmed"}
                            >
                                <Clock className="mr-2 h-4 w-4" />
                                已确认
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className={`justify-start text-xs ${appointment.status === "in_progress" ? "bg-secondary" : ""}`}
                                onClick={() => onStatusUpdate(appointment.id, "in_progress")}
                                disabled={appointment.status === "in_progress"}
                            >
                                <Truck className="mr-2 h-4 w-4" />
                                处理中
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className={`justify-start text-xs ${appointment.status === "completed" ? "bg-secondary" : ""}`}
                                onClick={() => onStatusUpdate(appointment.id, "completed")}
                                disabled={appointment.status === "completed"}
                            >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                已完成
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className={`justify-start text-xs ${appointment.status === "cancelled" ? "bg-secondary" : ""}`}
                                onClick={() => onStatusUpdate(appointment.id, "cancelled")}
                                disabled={appointment.status === "cancelled"}
                            >
                                <XCircle className="mr-2 h-4 w-4" />
                                已取消
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>
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
                            <TableHead>文件数量</TableHead>
                            <TableHead>文件类型</TableHead>
                            <TableHead>状态</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center py-6">
                                    加载中...
                                </TableCell>
                            </TableRow>
                        ) : appointments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center py-6">
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
                                    <TableCell>{appointment.documentCount}</TableCell>
                                    <TableCell>
                                        {documentTypes.find(
                                            (t) => t.value === appointment.documentType,
                                        )?.label || appointment.documentType}
                                    </TableCell>
                                    <TableCell>
                                        {renderStatusCell(appointment)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => onEdit(appointment)}
                                                        >
                                                            <Pencil size={16} />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>编辑预约</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => onDelete(appointment.id)}
                                                        >
                                                            <Trash size={16} />
                                                        </Button>
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