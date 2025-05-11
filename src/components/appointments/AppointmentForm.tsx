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
import { documentCategories, documentTypesByCategory } from "@/lib/utils/appointments/helpers";
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
import { Checkbox } from "@/components/ui/checkbox";
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
    documentCounts: {
        [category: string]: number; // 每个类别的文件数量
    };
    documentTypes: {
        [category: string]: string[]; // 每个类别的文件类型
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
    const [activeTab, setActiveTab] = useState<string | "appointment" | "process">("process");

    // 过滤可用的员工和车辆
    const availableStaff = staffList.filter(staff => staff.isAvailable);
    const availableVehicles = vehicles.filter(vehicle => vehicle.isAvailable);

    const [formData, setFormData] = useState<AppointmentFormData>({
        dateTime: "",
        contactName: "",
        contactPhone: "",
        contactAddress: "",
        documentCounts: {
            paper: 0,
            magnetic: 0,
            other: 0
        },
        documentTypes: {
            paper: [],
            magnetic: [],
            other: []
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
            // 将处理备注合并到普通备注中
            const combinedNotes = initialData.processingNotes
                ? (initialData.notes || '') + (initialData.notes ? '\n\n' : '') + (initialData.processingNotes || '')
                : initialData.notes || '';

            // 处理文件类型数据结构的兼容
            const documentTypes: { [key: string]: string[] } = {
                paper: [],
                magnetic: [],
                other: []
            };

            // 初始化每个类别的数量
            const documentCounts: { [key: string]: number } = {
                paper: 0,
                magnetic: 0,
                other: 0
            };

            // 如果有旧数据，将文件类型放入对应的类别中
            if (initialData.documentType) {
                let foundCategory = "";

                // 在各类别中查找文件类型
                for (const [category, types] of Object.entries(documentTypesByCategory)) {
                    if (types.some(type => type.value === initialData.documentType)) {
                        foundCategory = category;
                        documentTypes[category] = [initialData.documentType];
                        break;
                    }
                }

                // 如果没找到类别，默认放入其他类别
                if (!foundCategory && initialData.documentType) {
                    documentTypes.other = [initialData.documentType];
                    foundCategory = "other";
                }

                // 如果有旧的文档数量，分配给找到的类别
                if (initialData.documentCount && foundCategory) {
                    documentCounts[foundCategory] = initialData.documentCount;
                }
            }

            // 如果有新格式的数据，优先使用
            if (initialData.documentCounts && typeof initialData.documentCounts === 'object') {
                Object.assign(documentCounts, initialData.documentCounts);
            }

            if (initialData.documentTypes && typeof initialData.documentTypes === 'object') {
                Object.assign(documentTypes, initialData.documentTypes);
            }

            setFormData({
                dateTime: initialData.dateTime || "",
                contactName: initialData.contactName || "",
                contactPhone: initialData.contactPhone || "",
                contactAddress: initialData.contactAddress || "",
                documentCounts,
                documentTypes,
                notes: combinedNotes,
                status: initialData.status || "pending",
                estimatedCompletionTime: initialData.estimatedCompletionTime || "",
                processingNotes: "",
                assignedStaff: initialData.assignedStaff || [],
                assignedVehicle: initialData.assignedVehicle || "",
            });

            // 如果是已存在的预约，默认显示处理tab
            if (initialData.id && isAdmin) {
                setActiveTab("process");
            }
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
            [name]: value,
        }));
    };

    // 处理文档数量输入
    const handleDocumentCountChange = (category: string, value: string) => {
        const count = parseInt(value) || 0;
        setFormData(prev => ({
            ...prev,
            documentCounts: {
                ...prev.documentCounts,
                [category]: count
            }
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

    // 处理文件类型复选框变化
    const handleDocumentTypeChange = (category: string, type: string, checked: boolean) => {
        setFormData(prev => {
            const currentTypes = [...(prev.documentTypes[category] || [])];

            if (checked && !currentTypes.includes(type)) {
                return {
                    ...prev,
                    documentTypes: {
                        ...prev.documentTypes,
                        [category]: [...currentTypes, type]
                    }
                };
            } else if (!checked && currentTypes.includes(type)) {
                return {
                    ...prev,
                    documentTypes: {
                        ...prev.documentTypes,
                        [category]: currentTypes.filter(t => t !== type)
                    }
                };
            }

            return prev;
        });
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

    // 获取所有选择的文件类型数量
    const getSelectedDocumentTypesCount = () => {
        return Object.values(formData.documentTypes).reduce(
            (count, types) => count + types.length,
            0
        );
    };

    // 获取总文档数量
    const getTotalDocumentCount = () => {
        return Object.values(formData.documentCounts).reduce(
            (total, count) => total + count,
            0
        );
    };

    // 转换表单数据以提交
    const prepareFormDataForSubmission = () => {
        // 找出第一个非空类别的第一个文件类型，用于向后兼容
        let primaryDocumentType = "";
        let primaryDocumentCategory = "";

        for (const category of documentCategories.map(c => c.value)) {
            if (formData.documentTypes[category]?.length > 0) {
                primaryDocumentType = formData.documentTypes[category][0];
                primaryDocumentCategory = category;
                break;
            }
        }

        // 计算总文档数量
        const totalDocumentCount = getTotalDocumentCount();

        // 返回处理后的数据
        return {
            ...formData,
            documentType: primaryDocumentType,
            documentCategory: primaryDocumentCategory,
            documentCount: totalDocumentCount,
        };
    };

    // Handle form submission
    const handleSubmit = () => {
        // 处理提交的数据，确保与API兼容
        const submissionData = prepareFormDataForSubmission();
        onSubmit(submissionData);
    };

    // 检查是否所有必填字段都已填写
    const isFormValid = () => {
        // 检查基本必填字段
        const basicFieldsValid =
            formData.dateTime &&
            formData.contactName &&
            formData.contactPhone &&
            formData.contactAddress;

        // 检查是否至少选择了一种文件类型
        const hasAnyDocumentType = getSelectedDocumentTypesCount() > 0;

        // 检查每个有选择文件类型的类别是否有对应的数量
        const hasValidCounts = Object.entries(formData.documentTypes).every(
            ([category, types]) => {
                return types.length === 0 || formData.documentCounts[category] > 0;
            }
        );

        return basicFieldsValid && hasAnyDocumentType && hasValidCounts;
    };

    // 基本信息表单
    const BasicInfoForm = () => (
        <>
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

                {/* 文件类型选择 - 更紧凑的布局 */}
                <div className="flex flex-col gap-1.5 mt-1">
                    <div>
                        <Label className="text-base font-medium">文件类型选择 *</Label>
                        <p className="text-sm text-muted-foreground">请为每种介质类别选择文件类型和数量</p>
                    </div>

                    <div className="grid gap-2">
                        {/* 循环渲染每一种介质类别 - 更紧凑的版本 */}
                        {documentCategories.map((category) => (
                            <div key={category.value} className="grid grid-cols-[1fr_120px] gap-2 items-center mb-1.5">
                                <div>
                                    <div className="font-medium text-sm mb-1">{category.label}</div>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className="w-full justify-between"
                                                size="sm"
                                            >
                                                <span className="truncate text-left">
                                                    {formData.documentTypes[category.value]?.length
                                                        ? `已选择 ${formData.documentTypes[category.value].length} 种类型`
                                                        : "选择文件类型"}
                                                </span>
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-full p-0">
                                            <Command>
                                                <CommandInput placeholder="搜索文件类型..." />
                                                <CommandEmpty>未找到匹配的文件类型</CommandEmpty>
                                                <CommandGroup>
                                                    <ScrollArea className="h-[200px]">
                                                        {documentTypesByCategory[category.value as keyof typeof documentTypesByCategory].map((type) => (
                                                            <CommandItem
                                                                key={type.value}
                                                                value={type.value}
                                                                onSelect={() => {
                                                                    const isSelected = formData.documentTypes[category.value]?.includes(type.value);
                                                                    handleDocumentTypeChange(
                                                                        category.value,
                                                                        type.value,
                                                                        !isSelected
                                                                    );
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        formData.documentTypes[category.value]?.includes(type.value)
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

                                    {/* 显示已选文件类型 */}
                                    {formData.documentTypes[category.value]?.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {formData.documentTypes[category.value].map(typeValue => {
                                                const typeInfo = documentTypesByCategory[category.value as keyof typeof documentTypesByCategory]
                                                    .find(t => t.value === typeValue);
                                                return typeInfo && (
                                                    <Badge key={typeValue} variant="secondary" className="text-xs">
                                                        {typeInfo.label}
                                                    </Badge>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Label htmlFor={`count-${category.value}`} className="text-xs whitespace-nowrap">数量:</Label>
                                    <Input
                                        id={`count-${category.value}`}
                                        type="number"
                                        min="0"
                                        value={formData.documentCounts[category.value] || 0}
                                        onChange={(e) => handleDocumentCountChange(category.value, e.target.value)}
                                        className="h-7 px-2"
                                    />
                                </div>
                            </div>
                        ))}
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
            </div>
        </>
    );

    // 处理预约表单（管理员）
    const ProcessAppointmentForm = () => (
        <>
            <div className="grid gap-3 py-2">
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
                        <Label htmlFor="estimatedCompletionTime">预计上门时间</Label>
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
                                        size="sm"
                                    >
                                        <div className="max-w-[90%] truncate text-left">
                                            {getSelectedStaffNames()}
                                        </div>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0">
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
                                        size="sm"
                                    >
                                        <div className="max-w-[90%] truncate text-left">
                                            {getSelectedVehicleInfo()}
                                        </div>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0">
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
            </div>
        </>
    );

    return (
        <>
            {isAdmin ? (
                <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid grid-cols-2 mb-2">
                        <TabsTrigger value="appointment">预约信息</TabsTrigger>
                        <TabsTrigger value="process">处理预约</TabsTrigger>
                    </TabsList>
                    <TabsContent value="appointment">
                        <BasicInfoForm />
                    </TabsContent>
                    <TabsContent value="process">
                        <ProcessAppointmentForm />
                    </TabsContent>
                </Tabs>
            ) : (
                <BasicInfoForm />
            )}

            <DialogFooter className="mt-4">
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