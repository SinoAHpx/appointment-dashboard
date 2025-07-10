"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Command,
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStaffStore, useVehicleStore } from "@/lib/stores";

interface AdminProcessingFormProps {
    status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
    estimatedCompletionTime: string;
    assignedStaff: string[];
    assignedVehicles: string[];
    onStatusChange: (value: string) => void;
    onEstimatedCompletionTimeChange: (value: string) => void;
    onAssignedStaffChange: (value: string[]) => void;
    onAssignedVehiclesChange: (value: string[]) => void;
}

export function AdminProcessingForm({
    status,
    estimatedCompletionTime,
    assignedStaff,
    assignedVehicles,
    onStatusChange,
    onEstimatedCompletionTimeChange,
    onAssignedStaffChange,
    onAssignedVehiclesChange
}: AdminProcessingFormProps) {
    const { staffList } = useStaffStore();
    const { vehicles } = useVehicleStore();

    const [staffDialogOpen, setStaffDialogOpen] = useState(false);
    const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);

    // 过滤可用的员工和车辆
    const availableStaff = staffList.filter(staff => staff.isAvailable);
    const availableVehicles = vehicles.filter(vehicle => vehicle.isAvailable);

    // 处理人员选择的改变
    const handleStaffSelection = (staffId: string) => {
        const currentAssignedStaff = [...assignedStaff];
        // 检查是否已选择
        if (currentAssignedStaff.includes(staffId)) {
            // 如果已选择，则移除
            onAssignedStaffChange(currentAssignedStaff.filter(id => id !== staffId));
        } else {
            // 如果未选择，则添加
            onAssignedStaffChange([...currentAssignedStaff, staffId]);
        }
    };

    // 处理车辆选择 - 支持多选
    const handleVehicleSelection = (vehicleId: string) => {
        const currentAssignedVehicles = [...assignedVehicles];
        // 检查是否已选择
        if (currentAssignedVehicles.includes(vehicleId)) {
            // 如果已选择，则移除
            onAssignedVehiclesChange(currentAssignedVehicles.filter(id => id !== vehicleId));
        } else {
            // 如果未选择，则添加
            onAssignedVehiclesChange([...currentAssignedVehicles, vehicleId]);
        }
    };

    // 获取已选人员名称
    const getSelectedStaffNames = () => {
        if (!assignedStaff?.length) return "选择处理人员";

        return assignedStaff.map(id => {
            const staff = availableStaff.find(s => s.id === String(id));
            return staff?.name || "未知人员";
        }).join(", ");
    };

    // 获取已选车辆信息
    const getSelectedVehiclesInfo = () => {
        if (!assignedVehicles?.length) return "选择派遣车辆";

        return assignedVehicles.map(id => {
            const vehicle = availableVehicles.find(v => v.id === String(id));
            return vehicle ? `${vehicle.plateNumber}` : "未知车辆";
        }).join(", ");
    };

    return (
        <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
                {/* 状态选择 */}
                <div className="flex flex-col gap-1.5 w-full">
                    <Label htmlFor="status">状态 *</Label>
                    <Select
                        value={status}
                        onValueChange={onStatusChange}
                    >
                        <SelectTrigger id="status" className="w-full">
                            <SelectValue placeholder="选择状态" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="pending">待确认</SelectItem>
                            <SelectItem value="confirmed">已预约</SelectItem>
                            <SelectItem value="in_progress">处理中</SelectItem>
                            <SelectItem value="completed">已完成</SelectItem>
                            <SelectItem value="cancelled">已取消</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* 预计上门时间 */}
                <div className="flex flex-col gap-1.5 w-full">
                    <Label htmlFor="estimatedCompletionTime">预计上门时间</Label>
                    <Input
                        id="estimatedCompletionTime"
                        name="estimatedCompletionTime"
                        type="datetime-local"
                        value={estimatedCompletionTime || ""}
                        onChange={(e) => onEstimatedCompletionTimeChange(e.target.value)}
                        className="w-full"
                    />
                </div>
            </div>

            {/* 资源分配 */}
            <div className="grid grid-cols-2 gap-3">
                {/* 指派人员 - 多选 */}
                <div className="flex flex-col gap-1.5">
                    <Label>指派人员</Label>
                    <Button
                        variant="outline"
                        onClick={() => setStaffDialogOpen(true)}
                        className="justify-between"
                    >
                        <div className="max-w-[90%] truncate text-left">
                            {getSelectedStaffNames()}
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>

                    {/* 显示已选人员 */}
                    {assignedStaff && assignedStaff.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {assignedStaff.map(staffId => {
                                const staff = availableStaff.find(s => s.id === String(staffId));
                                return staff && (
                                    <Badge key={staffId} variant="secondary" className="text-xs">
                                        {staff.name}
                                    </Badge>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 指派车辆 - 多选 */}
                <div className="flex flex-col gap-1.5">
                    <Label>指派车辆</Label>
                    <Button
                        variant="outline"
                        onClick={() => setVehicleDialogOpen(true)}
                        className="justify-between"
                    >
                        <div className="max-w-[90%] truncate text-left">
                            {getSelectedVehiclesInfo()}
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>

                    {/* 显示已选车辆 */}
                    {assignedVehicles && assignedVehicles.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {assignedVehicles.map(vehicleId => {
                                const vehicle = availableVehicles.find(v => v.id === String(vehicleId));
                                return vehicle && (
                                    <Badge key={vehicleId} variant="secondary" className="text-xs">
                                        {vehicle.plateNumber}
                                    </Badge>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* 人员选择对话框 */}
            <CommandDialog
                open={staffDialogOpen}
                onOpenChange={setStaffDialogOpen}
                title="选择处理人员"
                description="搜索并选择需要指派的处理人员"
            >
                <CommandInput placeholder="搜索人员..." />
                <CommandList>
                    <ScrollArea className="h-[400px]">
                        <CommandEmpty>未找到匹配的人员</CommandEmpty>
                        <CommandGroup>
                            {availableStaff.length ? availableStaff.map(staff => (
                                <CommandItem
                                    key={staff.id}
                                    value={staff.id}
                                    onSelect={() => handleStaffSelection(staff.id)}
                                    className="cursor-pointer"
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            assignedStaff?.includes(staff.id)
                                                ? "opacity-100"
                                                : "opacity-0"
                                        )}
                                    />
                                    {staff.name} ({staff.position})
                                </CommandItem>
                            )) : (
                                <div className="p-2 text-sm text-muted-foreground">
                                    暂无可用人员
                                </div>
                            )}
                        </CommandGroup>
                    </ScrollArea>
                </CommandList>
            </CommandDialog>

            {/* 车辆选择对话框 */}
            <CommandDialog
                open={vehicleDialogOpen}
                onOpenChange={setVehicleDialogOpen}
                title="选择派遣车辆"
                description="搜索并选择需要派遣的车辆"
            >
                <CommandInput placeholder="搜索车辆..." />
                <CommandList>
                    <ScrollArea className="h-[400px]">
                        <CommandEmpty>未找到匹配的车辆</CommandEmpty>
                        <CommandGroup>
                            {availableVehicles.length ? availableVehicles.map(vehicle => (
                                <CommandItem
                                    key={vehicle.id}
                                    value={vehicle.id}
                                    onSelect={() => handleVehicleSelection(vehicle.id)}
                                    className="cursor-pointer"
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            assignedVehicles?.includes(vehicle.id)
                                                ? "opacity-100"
                                                : "opacity-0"
                                        )}
                                    />
                                    {vehicle.plateNumber} ({vehicle.model})
                                </CommandItem>
                            )) : (
                                <div className="p-2 text-sm text-muted-foreground">
                                    暂无可用车辆
                                </div>
                            )}
                        </CommandGroup>
                    </ScrollArea>
                </CommandList>
            </CommandDialog>
        </div>
    );
} 