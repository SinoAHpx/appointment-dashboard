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
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStaffStore, useVehicleStore } from "@/lib/stores";
import { type Staff } from "@/lib/stores/staff";
import { type Vehicle } from "@/lib/stores/vehicles";

interface AdminProcessingFormProps {
    status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
    estimatedCompletionTime: string;
    assignedStaff: string[];
    assignedVehicle: string;
    onStatusChange: (value: string) => void;
    onEstimatedCompletionTimeChange: (value: string) => void;
    onAssignedStaffChange: (value: string[]) => void;
    onAssignedVehicleChange: (value: string) => void;
}

export function AdminProcessingForm({
    status,
    estimatedCompletionTime,
    assignedStaff,
    assignedVehicle,
    onStatusChange,
    onEstimatedCompletionTimeChange,
    onAssignedStaffChange,
    onAssignedVehicleChange
}: AdminProcessingFormProps) {
    const { staffList } = useStaffStore();
    const { vehicles } = useVehicleStore();

    const [staffSelectOpen, setStaffSelectOpen] = useState(false);
    const [vehicleSelectOpen, setVehicleSelectOpen] = useState(false);

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

    // 处理车辆选择
    const handleVehicleSelection = (vehicleId: string) => {
        onAssignedVehicleChange(vehicleId === assignedVehicle ? "" : vehicleId);
    };

    // 获取已选人员名称
    const getSelectedStaffNames = () => {
        if (!assignedStaff?.length) return "选择处理人员";

        return assignedStaff.map(id => {
            const staff = availableStaff.find(s => s.id === id);
            return staff?.name || "未知人员";
        }).join(", ");
    };

    // 获取已选车辆信息
    const getSelectedVehicleInfo = () => {
        if (!assignedVehicle) return "选择派遣车辆";

        const vehicle = availableVehicles.find(v => v.id === assignedVehicle);
        return vehicle ? `${vehicle.plateNumber} (${vehicle.model})` : "未知车辆";
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
                            <SelectItem value="confirmed">已确认</SelectItem>
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
                    <Popover open={staffSelectOpen} onOpenChange={setStaffSelectOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                className="justify-between"
                            >
                                <div className="max-w-[90%] truncate text-left">
                                    {getSelectedStaffNames()}
                                </div>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                            <Command>
                                <CommandInput placeholder="搜索人员..." />
                                <CommandEmpty>未找到匹配的人员</CommandEmpty>
                                <CommandGroup>
                                    {availableStaff.length ? availableStaff.map(staff => (
                                        <CommandItem
                                            key={staff.id}
                                            value={staff.id}
                                            onSelect={() => handleStaffSelection(staff.id)}
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
                            </Command>
                        </PopoverContent>
                    </Popover>

                    {/* 显示已选人员 */}
                    {assignedStaff && assignedStaff.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {assignedStaff.map(staffId => {
                                const staff = availableStaff.find(s => s.id === staffId);
                                return staff && (
                                    <Badge key={staffId} variant="secondary" className="text-xs">
                                        {staff.name}
                                    </Badge>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 指派车辆 - 单选 */}
                <div className="flex flex-col gap-1.5">
                    <Label>指派车辆</Label>
                    <Popover open={vehicleSelectOpen} onOpenChange={setVehicleSelectOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                className="justify-between"
                            >
                                <div className="max-w-[90%] truncate text-left">
                                    {getSelectedVehicleInfo()}
                                </div>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                            <Command>
                                <CommandInput placeholder="搜索车辆..." />
                                <CommandEmpty>未找到匹配的车辆</CommandEmpty>
                                <CommandGroup>
                                    <ScrollArea className="h-[200px]">
                                        {availableVehicles.length ? availableVehicles.map(vehicle => (
                                            <CommandItem
                                                key={vehicle.id}
                                                value={vehicle.id}
                                                onSelect={() => handleVehicleSelection(vehicle.id)}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        assignedVehicle === vehicle.id
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
                                    </ScrollArea>
                                </CommandGroup>
                            </Command>
                        </PopoverContent>
                    </Popover>

                    {/* 显示已选车辆 */}
                    {assignedVehicle && (
                        <div className="flex flex-wrap gap-1">
                            {(() => {
                                const vehicle = availableVehicles.find(v => v.id === assignedVehicle);
                                return vehicle && (
                                    <Badge variant="secondary" className="text-xs">
                                        {vehicle.plateNumber}
                                    </Badge>
                                );
                            })()}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 