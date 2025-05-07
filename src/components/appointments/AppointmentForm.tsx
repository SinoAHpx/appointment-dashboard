"use client";

import { Button } from "@/components/ui/button";
import {
    DialogClose,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { type Appointment } from "@/lib/stores/appointments";
import { documentTypes } from "@/lib/utils/appointments/helpers";
import { useState, useEffect } from "react";
import { useStaffStore, useVehicleStore, useAuthStore } from "@/lib/stores";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
import { Badge } from "@/components/ui/badge";

export interface AppointmentFormData {
    dateTime: string;
    contactName: string;
    contactPhone: string;
    contactAddress: string;
    documentCount: number;
    documentType: string;
    notes: string;
    status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
    estimatedCompletionTime?: string;
    processingNotes?: string;
    assignedStaff?: string[];
    assignedVehicle?: string;
}

interface AppointmentFormProps {
    isAdmin?: boolean;
    initialData?: Appointment;
    onSubmit: (data: AppointmentFormData) => void;
    submitLabel?: string;
}

export function AppointmentForm({
    isAdmin = false,
    initialData,
    onSubmit,
    submitLabel = "保存",
}: AppointmentFormProps) {
    const { isAdmin: checkIsAdmin } = useAuthStore();
    const { staffList, fetchStaff } = useStaffStore();
    const { vehicles, fetchVehicles } = useVehicleStore();

    const [staffSelectOpen, setStaffSelectOpen] = useState(false);
    const [vehicleSelectOpen, setVehicleSelectOpen] = useState(false);

    // 过滤可用的员工和车辆
    const availableStaff = staffList.filter(staff => staff.isAvailable);
    const availableVehicles = vehicles.filter(vehicle => vehicle.isAvailable);

    const [formData, setFormData] = useState<AppointmentFormData>({
        dateTime: "",
        contactName: "",
        contactPhone: "",
        contactAddress: "",
        documentCount: 1,
        documentType: "confidential",
        notes: "",
        status: "pending",
        estimatedCompletionTime: "",
        processingNotes: "",
        assignedStaff: [],
        assignedVehicle: "",
    });

    // Initialize form with provided data
    useEffect(() => {
        if (initialData) {
            // 将处理备注合并到普通备注中
            const combinedNotes = initialData.processingNotes
                ? (initialData.notes || '') + (initialData.notes ? '\n\n' : '') + (initialData.processingNotes || '')
                : initialData.notes || '';

            setFormData({
                dateTime: initialData.dateTime || "",
                contactName: initialData.contactName || "",
                contactPhone: initialData.contactPhone || "",
                contactAddress: initialData.contactAddress || "",
                documentCount: initialData.documentCount || 1,
                documentType: initialData.documentType || "confidential",
                notes: combinedNotes,
                status: initialData.status || "pending",
                estimatedCompletionTime: initialData.estimatedCompletionTime || "",
                processingNotes: "", // 不使用单独的处理备注
                assignedStaff: initialData.assignedStaff || [],
                assignedVehicle: initialData.assignedVehicle || "",
            });
        }
    }, [initialData]);

    // Fetch staff and vehicles data when component mounts
    useEffect(() => {
        if (isAdmin || checkIsAdmin()) {
            fetchStaff();
            fetchVehicles();
        }
    }, [isAdmin, checkIsAdmin, fetchStaff, fetchVehicles]);

    // Handle form changes
    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === "documentCount" ? parseInt(value) || 0 : value,
        }));
    };

    // Handle select changes
    const handleSelectChange = (name: string, value: string) => {
        if (name === "status") {
            setFormData((prev) => ({
                ...prev,
                status: value as AppointmentFormData["status"],
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    // 处理人员选择的改变
    const handleStaffSelection = (staffId: string) => {
        setFormData(prev => {
            const currentAssignedStaff = prev.assignedStaff || [];
            // 检查是否已选择
            if (currentAssignedStaff.includes(staffId)) {
                // 如果已选择，则移除
                return {
                    ...prev,
                    assignedStaff: currentAssignedStaff.filter(id => id !== staffId)
                };
            } else {
                // 如果未选择，则添加
                return {
                    ...prev,
                    assignedStaff: [...currentAssignedStaff, staffId]
                };
            }
        });
    };

    // 处理车辆选择
    const handleVehicleSelection = (vehicleId: string) => {
        setFormData(prev => ({
            ...prev,
            assignedVehicle: vehicleId === prev.assignedVehicle ? "" : vehicleId
        }));
    };

    // 获取已选人员名称
    const getSelectedStaffNames = () => {
        if (!formData.assignedStaff?.length) return "选择处理人员";

        return formData.assignedStaff.map(id => {
            const staff = availableStaff.find(s => s.id === id);
            return staff?.name || "未知人员";
        }).join(", ");
    };

    // 获取已选车辆信息
    const getSelectedVehicleInfo = () => {
        if (!formData.assignedVehicle) return "选择派遣车辆";

        const vehicle = availableVehicles.find(v => v.id === formData.assignedVehicle);
        return vehicle ? `${vehicle.plateNumber} (${vehicle.model})` : "未知车辆";
    };

    // Handle form submission
    const handleSubmit = () => {
        onSubmit(formData);
    };

    // Check if all required fields are filled
    const isFormValid = () => {
        return (
            formData.dateTime &&
            formData.contactName &&
            formData.contactPhone &&
            formData.contactAddress &&
            formData.documentCount > 0
        );
    };

    return (
        <ScrollArea className="h-[70vh] pr-4">
            <div className="grid gap-3 py-2">
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="dateTime">预约时间 *</Label>
                        <Input
                            id="dateTime"
                            name="dateTime"
                            type="datetime-local"
                            value={formData.dateTime}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="contactName">联系人 *</Label>
                        <Input
                            id="contactName"
                            name="contactName"
                            value={formData.contactName}
                            onChange={handleInputChange}
                            placeholder="请输入联系人姓名"
                            required
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="contactPhone">联系电话 *</Label>
                        <Input
                            id="contactPhone"
                            name="contactPhone"
                            value={formData.contactPhone}
                            onChange={handleInputChange}
                            placeholder="请输入联系电话"
                            required
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="documentCount">文件数量 *</Label>
                        <Input
                            id="documentCount"
                            name="documentCount"
                            type="number"
                            min="1"
                            value={formData.documentCount}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="documentType">文件类型 *</Label>
                        <Select
                            value={formData.documentType}
                            onValueChange={(value) => handleSelectChange("documentType", value)}
                        >
                            <SelectTrigger id="documentType">
                                <SelectValue placeholder="选择文件类型" />
                            </SelectTrigger>
                            <SelectContent>
                                {documentTypes.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="contactAddress">联系地址 *</Label>
                        <Input
                            id="contactAddress"
                            name="contactAddress"
                            value={formData.contactAddress}
                            onChange={handleInputChange}
                            placeholder="请输入联系地址"
                            required
                        />
                    </div>
                </div>

                {/* 备注字段 */}
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="notes">备注</Label>
                    <Textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        placeholder="请输入备注信息"
                        rows={3}
                    />
                </div>

                {/* Admin-only fields */}
                {isAdmin && (
                    <>
                        <Separator className="my-1" />

                        <div className="flex justify-between">
                            {/* 状态选择 */}
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="status">状态 *</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value) => handleSelectChange("status", value)}
                                >
                                    <SelectTrigger id="status">
                                        <SelectValue placeholder="选择状态" />
                                    </SelectTrigger>
                                    <SelectContent className="w-full">
                                        <SelectItem value="pending">待确认</SelectItem>
                                        <SelectItem value="confirmed">已确认</SelectItem>
                                        <SelectItem value="in_progress">处理中</SelectItem>
                                        <SelectItem value="completed">已完成</SelectItem>
                                        <SelectItem value="cancelled">已取消</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* 预计完成时间 */}
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="estimatedCompletionTime">预计完成时间</Label>
                                <Input
                                    id="estimatedCompletionTime"
                                    name="estimatedCompletionTime"
                                    type="datetime-local"
                                    value={formData.estimatedCompletionTime || ""}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        {/* 资源分配 */}
                        <div className="mt-1">
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
                                                    <ScrollArea className="h-[200px]">
                                                        {availableStaff.length ? availableStaff.map(staff => (
                                                            <CommandItem
                                                                key={staff.id}
                                                                value={staff.id}
                                                                onSelect={() => handleStaffSelection(staff.id)}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        formData.assignedStaff?.includes(staff.id)
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
                                                    </ScrollArea>
                                                </CommandGroup>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>

                                    {/* 显示已选人员 */}
                                    {formData.assignedStaff && formData.assignedStaff.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {formData.assignedStaff.map(staffId => {
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
                                                                        formData.assignedVehicle === vehicle.id
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
                                    {formData.assignedVehicle && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {(() => {
                                                const vehicle = availableVehicles.find(v => v.id === formData.assignedVehicle);
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
                    </>
                )}

                {/* Footer with actions */}
                <DialogFooter className="pt-3">
                    <DialogClose asChild>
                        <Button type="button" variant="outline">
                            取消
                        </Button>
                    </DialogClose>
                    <Button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={!isFormValid()}
                    >
                        {submitLabel}
                    </Button>
                </DialogFooter>
            </div>
        </ScrollArea>
    );
} 