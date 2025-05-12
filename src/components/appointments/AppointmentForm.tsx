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
import { documentTypes, documentCategories, documentTypesByCategory } from "@/lib/utils/appointments/helpers";
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
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";

export interface AppointmentFormData {
    dateTime: string;
    contactName: string;
    contactPhone: string;
    contactAddress: string;
    documentCount: number;
    documentTypes: {
        [category: string]: {
            types: string[];
            count: number;
        };
    };
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
    const [typeSelectOpen, setTypeSelectOpen] = useState<{ [key: string]: boolean }>({});

    // 过滤可用的员工和车辆
    const availableStaff = staffList.filter(staff => staff.isAvailable);
    const availableVehicles = vehicles.filter(vehicle => vehicle.isAvailable);

    const [formData, setFormData] = useState<AppointmentFormData>({
        dateTime: "",
        contactName: "",
        contactPhone: "",
        contactAddress: "",
        documentCount: 1,
        documentTypes: {
            paper: { types: [], count: 0 },
            electronic: { types: [], count: 0 },
            other: { types: [], count: 0 }
        },
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
            const combinedNotes = initialData.processingNotes
                ? (initialData.notes || '') + (initialData.notes ? '\n\n' : '') + (initialData.processingNotes || '')
                : initialData.notes || '';

            // 根据documentTypesJson初始化新的documentTypes结构
            let documentTypes: AppointmentFormData['documentTypes'] = {
                paper: { types: [], count: 0 },
                magnetic: { types: [], count: 0 },
                other: { types: [], count: 0 }
            };

            // 尝试解析documentTypesJson
            if (initialData.documentTypesJson) {
                try {
                    const parsedData = JSON.parse(initialData.documentTypesJson);

                    // 处理paper类别
                    if (parsedData.paper) {
                        documentTypes.paper = {
                            types: parsedData.paper.items || [],
                            count: parsedData.paper.count || 0
                        };
                    }

                    // 处理electronic/magnetic类别
                    if (parsedData.electronic) {
                        documentTypes.magnetic = {
                            types: parsedData.electronic.items || [],
                            count: parsedData.electronic.count || 0
                        };
                    }

                    // 处理other类别
                    if (parsedData.other) {
                        documentTypes.other = {
                            types: parsedData.other.items || [],
                            count: parsedData.other.count || 0
                        };
                    }
                } catch (error) {
                    console.error("解析documentTypesJson时出错:", error);
                    // 如果解析失败，使用原有的方式处理（向后兼容）
                    if (initialData.documentType) {
                        for (const [category, types] of Object.entries(documentTypesByCategory)) {
                            if (types.some(type => type.value === initialData.documentType)) {
                                documentTypes[category as keyof typeof documentTypes] = {
                                    types: [initialData.documentType],
                                    count: initialData.documentCount || 0
                                };
                                break;
                            }
                        }
                    }
                }
            } else if (initialData.documentType) {
                // 向后兼容 - 如果没有documentTypesJson但有documentType
                for (const [category, types] of Object.entries(documentTypesByCategory)) {
                    if (types.some(type => type.value === initialData.documentType)) {
                        documentTypes[category as keyof typeof documentTypes] = {
                            types: [initialData.documentType],
                            count: initialData.documentCount || 0
                        };
                        break;
                    }
                }
            }

            setFormData({
                dateTime: initialData.dateTime || "",
                contactName: initialData.contactName || "",
                contactPhone: initialData.contactPhone || "",
                contactAddress: initialData.contactAddress || "",
                documentCount: initialData.documentCount || 1,
                documentTypes,
                notes: combinedNotes,
                status: initialData.status || "pending",
                estimatedCompletionTime: initialData.estimatedCompletionTime || "",
                processingNotes: "",
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
        // 将documentTypes转换为JSON格式，符合需求格式
        const documentTypesJson = JSON.stringify({
            paper: {
                items: formData.documentTypes.paper?.types || [],
                count: formData.documentTypes.paper?.count || 0
            },
            electronic: {
                items: formData.documentTypes.magnetic?.types || [],
                count: formData.documentTypes.magnetic?.count || 0
            },
            other: {
                items: formData.documentTypes.other?.types || [],
                count: formData.documentTypes.other?.count || 0
            }
        });

        // 准备提交数据
        const submitData = {
            ...formData,
            documentTypesJson
        };

        onSubmit(submitData);
    };

    // 处理文件类型选择
    const handleTypeSelection = (category: string, typeValue: string) => {
        setFormData(prev => {
            const currentTypes = prev.documentTypes[category]?.types || [];
            const newTypes = currentTypes.includes(typeValue)
                ? currentTypes.filter(t => t !== typeValue)
                : [...currentTypes, typeValue];

            return {
                ...prev,
                documentTypes: {
                    ...prev.documentTypes,
                    [category]: {
                        ...prev.documentTypes[category],
                        types: newTypes
                    }
                }
            };
        });
    };

    // 处理文件数量变更
    const handleCountChange = (category: string, count: number) => {
        setFormData(prev => ({
            ...prev,
            documentTypes: {
                ...prev.documentTypes,
                [category]: {
                    ...prev.documentTypes[category],
                    count: count
                }
            }
        }));
    };

    // 获取已选类型的显示文本
    const getSelectedTypesDisplay = (category: string) => {
        const types = formData.documentTypes[category]?.types || [];
        if (types.length === 0) return "选择文件类型";

        return types.map(typeValue => {
            const typeObj = documentTypesByCategory[category as keyof typeof documentTypesByCategory]
                .find(t => t.value === typeValue);
            return typeObj?.label || typeValue;
        }).join(", ");
    };

    // 修改表单验证
    const isFormValid = () => {
        const hasValidDocuments = Object.values(formData.documentTypes).some(
            category => category.types.length > 0 && category.count > 0
        );

        return (
            formData.dateTime &&
            formData.contactName &&
            formData.contactPhone &&
            formData.contactAddress &&
            hasValidDocuments
        );
    };

    return (
        <>
            <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="basic">基本信息</TabsTrigger>
                    <TabsTrigger value="admin">处理信息</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                    <div className="grid gap-3">
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

                        {/* 文件类型选择部分 - 优化布局 */}
                        <div className="grid gap-2">
                            {documentCategories.map((category) => (
                                <div key={category.value} className="grid grid-cols-[1fr,3fr] gap-3 items-start">
                                    <Label className="pt-2.5">{category.label}</Label>
                                    <div className="flex items-start space-x-2">
                                        <div className="flex-1">
                                            <Popover
                                                open={typeSelectOpen[category.value]}
                                                onOpenChange={(open) => setTypeSelectOpen(prev => ({ ...prev, [category.value]: open }))}
                                            >
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className="justify-between w-full"
                                                    >
                                                        <div className="max-w-[90%] truncate text-left">
                                                            {getSelectedTypesDisplay(category.value)}
                                                        </div>
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[300px] p-0" align="start">
                                                    <Command>
                                                        <CommandInput placeholder="搜索文件类型..." />
                                                        <CommandEmpty>未找到匹配的类型</CommandEmpty>
                                                        <CommandGroup>
                                                            <ScrollArea className="h-[200px]">
                                                                {documentTypesByCategory[category.value as keyof typeof documentTypesByCategory].map((type) => (
                                                                    <CommandItem
                                                                        key={type.value}
                                                                        value={type.value}
                                                                        onSelect={() => handleTypeSelection(category.value, type.value)}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                formData.documentTypes[category.value]?.types.includes(type.value)
                                                                                    ? "opacity-100"
                                                                                    : "opacity-0"
                                                                            )}
                                                                        />
                                                                        {type.label}
                                                                    </CommandItem>
                                                                ))}
                                                            </ScrollArea>
                                                        </CommandGroup>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                            {formData.documentTypes[category.value]?.types.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {formData.documentTypes[category.value].types.map(typeValue => {
                                                        const type = documentTypesByCategory[category.value as keyof typeof documentTypesByCategory]
                                                            .find(t => t.value === typeValue);
                                                        return (
                                                            <Badge key={typeValue} variant="secondary" className="text-xs">
                                                                {type?.label || typeValue}
                                                            </Badge>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                        <Input
                                            type="number"
                                            min="0"
                                            value={formData.documentTypes[category.value]?.count || 0}
                                            onChange={(e) => handleCountChange(category.value, parseInt(e.target.value) || 0)}
                                            className="w-24"
                                            placeholder="数量"
                                        />
                                    </div>
                                </div>
                            ))}
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
                    </div>
                </TabsContent>

                <TabsContent value="admin" className="space-y-4">
                    {isAdmin && (
                        <div className="grid gap-3">
                            <div className="grid grid-cols-2 gap-3">
                                {/* 状态选择 */}
                                <div className="flex flex-col gap-1.5 w-full">
                                    <Label htmlFor="status">状态 *</Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(value) => handleSelectChange("status", value)}
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

                                {/* 预计完成时间 */}
                                <div className="flex flex-col gap-1.5 w-full">
                                    <Label htmlFor="estimatedCompletionTime">预计完成时间</Label>
                                    <Input
                                        id="estimatedCompletionTime"
                                        name="estimatedCompletionTime"
                                        type="datetime-local"
                                        value={formData.estimatedCompletionTime || ""}
                                        onChange={handleInputChange}
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
                                        <div className="flex flex-wrap gap-1">
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
                                        <div className="flex flex-wrap gap-1">
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
                    )}
                </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6">
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
        </>
    );
} 