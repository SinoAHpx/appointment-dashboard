import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { type Vehicle } from "@/lib/store";
import { Check, Edit, Trash, X } from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";

interface VehicleTableProps {
    vehicles: Vehicle[];
    isLoading: boolean;
    searchQuery: string;
    formatDate: (date?: string) => string;
    getVehicleTypeIcon: (type: "electric" | "fuel") => React.ReactNode;
    getVehicleTypeLabel: (type: "electric" | "fuel") => string;
    handleToggleAvailability: (id: string) => Promise<void>;
    handleStartEdit: (vehicle: Vehicle) => void;
    handleDeleteVehicle: (id: string) => Promise<void>;
    page: number;
    setPage: (page: number) => void;
    totalPages: number;
}

export function VehicleTable({
    vehicles,
    isLoading,
    searchQuery,
    formatDate,
    getVehicleTypeIcon,
    getVehicleTypeLabel,
    handleToggleAvailability,
    handleStartEdit,
    handleDeleteVehicle,
    page,
    setPage,
    totalPages,
}: VehicleTableProps) {
    return (
        <>
            <Table>
                <TableCaption>车辆列表</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead>车牌号</TableHead>
                        <TableHead>车型</TableHead>
                        <TableHead>车辆类型</TableHead>
                        <TableHead>载重量（吨）</TableHead>
                        <TableHead>车长（米）</TableHead>
                        <TableHead>最近维护日期</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={8} className="text-center py-6">
                                加载中...
                            </TableCell>
                        </TableRow>
                    ) : vehicles.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="text-center py-6">
                                {searchQuery ? "没有找到匹配的车辆" : "暂无车辆记录"}
                            </TableCell>
                        </TableRow>
                    ) : (
                        vehicles.map((vehicle) => (
                            <TableRow key={vehicle.id}>
                                <TableCell className="font-medium">
                                    {vehicle.plateNumber}
                                </TableCell>
                                <TableCell>{vehicle.model}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1">
                                        {getVehicleTypeIcon(vehicle.vehicleType)}
                                        <span>{getVehicleTypeLabel(vehicle.vehicleType)}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{vehicle.capacity.toFixed(1)}</TableCell>
                                <TableCell>{vehicle.length.toFixed(1)}</TableCell>
                                <TableCell>{formatDate(vehicle.lastMaintenance)}</TableCell>
                                <TableCell>
                                    <Badge
                                        variant={
                                            vehicle.isAvailable ? "default" : "destructive"
                                        }
                                        className="flex items-center gap-1 cursor-pointer"
                                        onClick={() => handleToggleAvailability(vehicle.id)}
                                    >
                                        {vehicle.isAvailable ? (
                                            <>
                                                <Check size={12} /> 可用
                                            </>
                                        ) : (
                                            <>
                                                <X size={12} /> 不可用
                                            </>
                                        )}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => handleStartEdit(vehicle)}
                                        >
                                            <Edit size={16} />
                                        </Button>
                                        <ConfirmDeleteDialog
                                            title="删除车辆"
                                            description="确定要删除这个车辆吗？删除后无法恢复。"
                                            onConfirm={() => handleDeleteVehicle(vehicle.id)}
                                            trigger={<Trash size={16} />}
                                        />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            {totalPages > 1 && (
                <div className="mt-4">
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={() => setPage(Math.max(1, page - 1))}
                                    isActive={page === 1}
                                />
                            </PaginationItem>

                            {Array.from({ length: totalPages }).map((_, i) => (
                                <PaginationItem key={`vehicle-page-${i}`}>
                                    <PaginationLink
                                        onClick={() => setPage(i + 1)}
                                        isActive={page === i + 1}
                                    >
                                        {i + 1}
                                    </PaginationLink>
                                </PaginationItem>
                            ))}

                            <PaginationItem>
                                <PaginationNext
                                    onClick={() =>
                                        setPage(Math.min(totalPages, page + 1))
                                    }
                                    isActive={page === totalPages}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}
        </>
    );
} 