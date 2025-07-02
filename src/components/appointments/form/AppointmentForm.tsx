"use client";

import { Button } from "@/components/ui/button";
import {
    DialogClose,
    DialogFooter,
} from "@/components/ui/dialog";
import { type Appointment } from "@/lib/stores/appointments";
import { documentTypesByCategory } from "@/lib/utils/appointments/helpers";
import { useState, useEffect } from "react";
import { useStaffStore, useVehicleStore, useAuthStore } from "@/lib/stores";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { BasicInfoForm } from "./BasicInfoForm";
import { AdminProcessingForm } from "./AdminProcessingForm";
import { type DocumentTypesData } from "./DocumentTypesSelector";

export interface AppointmentFormData {
    dateTime: string;
    contactName: string;
    contactPhone: string;
    contactAddress: string;
    contactAddressDetails: string[];
    documentCount: number;
    documentTypes: DocumentTypesData;
    notes: string;
    status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
    estimatedCompletionTime?: string;
    processingNotes?: string;
    assignedStaff?: string[];
    assignedVehicles?: string[];
    assignedStaffJson?: string | null;
    assignedVehicleJson?: string | null;
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
    const [formData, setFormData] = useState<AppointmentFormData>({
        dateTime: "",
        contactName: "",
        contactPhone: "",
        contactAddress: "",
        contactAddressDetails: [],
        documentCount: 1,
        documentTypes: {
            paper: { items: {} },
            magnetic: { items: {} },
            other: { items: {} }
        },
        notes: "",
        status: "pending",
        estimatedCompletionTime: "",
        processingNotes: "",
        assignedStaff: [],
        assignedVehicles: [],
        assignedStaffJson: null,
        assignedVehicleJson: null,
    });

    // Initialize form with provided data
    useEffect(() => {
        if (initialData) {
            const combinedNotes = initialData.processingNotes
                ? (initialData.notes || '') + (initialData.notes ? '\n\n' : '') + (initialData.processingNotes || '')
                : initialData.notes || '';

            // 根据documentTypesJson初始化新的documentTypes结构
            let documentTypes: AppointmentFormData['documentTypes'] = {
                paper: { items: {} },
                magnetic: { items: {} },
                other: { items: {} }
            };

            // 尝试解析documentTypesJson并适配新旧两种数据格式
            if (initialData.documentTypesJson) {
                try {
                    const parsedData = JSON.parse(initialData.documentTypesJson);

                    // 处理新格式数据（每个子类型都有独立数量）
                    Object.keys(documentTypes).forEach(category => {
                        if (parsedData[category]) {
                            // 检查是否为新格式（items对象包含每个类型的详细信息）
                            if (parsedData[category].items && typeof parsedData[category].items === 'object') {
                                // 适配新旧格式：检查items对象的值类型
                                const items = parsedData[category].items;
                                const convertedItems: { [key: string]: { count: number; customName?: string } } = {};

                                Object.entries(items).forEach(([key, value]) => {
                                    if (typeof value === 'number') {
                                        // 旧格式：值是数字
                                        convertedItems[key] = { count: value };
                                    } else if (typeof value === 'object' && value !== null) {
                                        // 新格式：值是对象
                                        const valueObj = value as { count?: number; customName?: string };
                                        convertedItems[key] = {
                                            count: valueObj.count || 0,
                                            customName: valueObj.customName
                                        };
                                    }
                                });

                                documentTypes[category].items = convertedItems;
                            }
                            // 处理旧格式（types数组 + count数字）
                            else if (parsedData[category].items && Array.isArray(parsedData[category].items) && parsedData[category].count) {
                                // 旧格式：将types数组转换为items对象，每个类型分配相等数量
                                const types = parsedData[category].items;
                                const totalCount = parsedData[category].count;
                                const countPerType = Math.ceil(totalCount / types.length);

                                const items: { [key: string]: { count: number } } = {};
                                types.forEach((type: string, index: number) => {
                                    // 最后一个类型分配剩余数量
                                    items[type] = {
                                        count: index === types.length - 1
                                            ? totalCount - (countPerType * (types.length - 1))
                                            : countPerType
                                    };
                                });
                                documentTypes[category].items = items;
                            }
                        }
                    });

                    // 特殊处理电子介质的映射（旧数据中可能存储为electronic）
                    if (parsedData.electronic) {
                        if (parsedData.electronic.items && typeof parsedData.electronic.items === 'object') {
                            // 适配新旧格式：检查items对象的值类型
                            const items = parsedData.electronic.items;
                            const convertedItems: { [key: string]: { count: number; customName?: string } } = {};

                            Object.entries(items).forEach(([key, value]) => {
                                if (typeof value === 'number') {
                                    // 旧格式：值是数字
                                    convertedItems[key] = { count: value };
                                } else if (typeof value === 'object' && value !== null) {
                                    // 新格式：值是对象
                                    const valueObj = value as { count?: number; customName?: string };
                                    convertedItems[key] = {
                                        count: valueObj.count || 0,
                                        customName: valueObj.customName
                                    };
                                }
                            });

                            documentTypes.magnetic.items = convertedItems;
                        } else if (parsedData.electronic.items && Array.isArray(parsedData.electronic.items) && parsedData.electronic.count) {
                            const types = parsedData.electronic.items;
                            const totalCount = parsedData.electronic.count;
                            const countPerType = Math.ceil(totalCount / types.length);

                            const items: { [key: string]: { count: number } } = {};
                            types.forEach((type: string, index: number) => {
                                items[type] = {
                                    count: index === types.length - 1
                                        ? totalCount - (countPerType * (types.length - 1))
                                        : countPerType
                                };
                            });
                            documentTypes.magnetic.items = items;
                        }
                    }
                } catch (error) {
                    console.error("解析documentTypesJson失败:", error);
                }
            }

            // 处理人员和车辆分配
            let assignedStaff: string[] = [];
            let assignedVehicles: string[] = [];

            // 处理来自数据库的人员和车辆数据
            if (initialData.assignedStaff && Array.isArray(initialData.assignedStaff)) {
                assignedStaff = initialData.assignedStaff.map(id => String(id));
            } else if ((initialData as any).assignedStaffJson) {
                try {
                    const parsed = JSON.parse((initialData as any).assignedStaffJson);
                    if (Array.isArray(parsed)) {
                        assignedStaff = parsed.map(id => String(id));
                    }
                } catch (e) {
                    console.error("解析assignedStaffJson失败:", e);
                }
            }

            if (initialData.assignedVehicles && Array.isArray(initialData.assignedVehicles)) {
                assignedVehicles = initialData.assignedVehicles.map(id => String(id));
            } else if ((initialData as any).assignedVehicleJson) {
                try {
                    const parsed = JSON.parse((initialData as any).assignedVehicleJson);
                    if (Array.isArray(parsed)) {
                        assignedVehicles = parsed.map(id => String(id));
                    }
                } catch (e) {
                    console.error("解析assignedVehicleJson失败:", e);
                }
            }

            setFormData({
                dateTime: initialData.dateTime || "",
                contactName: initialData.contactName || "",
                contactPhone: initialData.contactPhone || "",
                contactAddress: initialData.contactAddress || "",
                contactAddressDetails: [],
                documentCount: initialData.documentCount || 1,
                documentTypes: documentTypes,
                notes: combinedNotes,
                status: initialData.status || "pending",
                estimatedCompletionTime: initialData.estimatedCompletionTime || "",
                processingNotes: initialData.processingNotes || "",
                assignedStaff: assignedStaff,
                assignedVehicles: assignedVehicles,
                assignedStaffJson: assignedStaff.length > 0 ? JSON.stringify(assignedStaff) : null,
                assignedVehicleJson: assignedVehicles.length > 0 ? JSON.stringify(assignedVehicles) : null,
            });
        }
    }, [initialData]);

    // Handle form submission
    const handleSubmit = () => {
        onSubmit(formData);
    };

    // 修改表单验证 - 检查是否有任何文档类型且总数量大于0
    const isFormValid = () => {
        const totalDocumentCount = Object.values(formData.documentTypes).reduce((total, category) => {
            return total + Object.values(category.items).reduce((sum, item) => {
                // 适配新的数据结构：item 可能是数字（旧格式）或对象（新格式）
                return sum + (typeof item === 'number' ? item : item?.count || 0);
            }, 0);
        }, 0);

        const hasValidDocuments = totalDocumentCount > 0;

        return (
            formData.dateTime &&
            formData.contactName &&
            formData.contactPhone &&
            formData.contactAddress &&
            hasValidDocuments
        );
    };

    // 更新表单数据的处理函数
    const updateFormData = <K extends keyof AppointmentFormData>(key: K, value: AppointmentFormData[K]) => {
        setFormData(prev => ({
            ...prev,
            [key]: value
        }));
    };

    // 每当人员或车辆分配变化时，更新JSON字段
    useEffect(() => {
        if (formData.assignedStaff) {
            const staffJson = formData.assignedStaff.length > 0
                ? JSON.stringify(formData.assignedStaff)
                : null;

            setFormData(prev => ({
                ...prev,
                assignedStaffJson: staffJson
            }));
        }
    }, [formData.assignedStaff]);

    useEffect(() => {
        if (formData.assignedVehicles) {
            const vehicleJson = formData.assignedVehicles.length > 0
                ? JSON.stringify(formData.assignedVehicles)
                : null;

            setFormData(prev => ({
                ...prev,
                assignedVehicleJson: vehicleJson
            }));
        }
    }, [formData.assignedVehicles]);

    return (
        <>
            {isAdmin ? (
                <Tabs defaultValue="admin" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="basic">基本信息</TabsTrigger>
                        <TabsTrigger value="admin">处理信息</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-4">
                        <BasicInfoForm
                            dateTime={formData.dateTime}
                            contactName={formData.contactName}
                            contactPhone={formData.contactPhone}
                            contactAddress={formData.contactAddress}
                            contactAddressDetails={formData.contactAddressDetails}
                            documentTypes={formData.documentTypes}
                            notes={formData.notes}
                            onDateTimeChange={value => updateFormData("dateTime", value)}
                            onContactNameChange={value => updateFormData("contactName", value)}
                            onContactPhoneChange={value => updateFormData("contactPhone", value)}
                            onContactAddressChange={value => updateFormData("contactAddress", value)}
                            onContactAddressDetailsChange={value => updateFormData("contactAddressDetails", value)}
                            onDocumentTypesChange={value => updateFormData("documentTypes", value)}
                            onNotesChange={value => updateFormData("notes", value)}
                        />
                    </TabsContent>

                    <TabsContent value="admin" className="space-y-4">
                        <AdminProcessingForm
                            status={formData.status}
                            estimatedCompletionTime={formData.estimatedCompletionTime || ""}
                            assignedStaff={formData.assignedStaff || []}
                            assignedVehicles={formData.assignedVehicles || []}
                            onStatusChange={value => updateFormData("status", value as AppointmentFormData["status"])}
                            onEstimatedCompletionTimeChange={value => updateFormData("estimatedCompletionTime", value)}
                            onAssignedStaffChange={value => {
                                updateFormData("assignedStaff", value);
                                // 直接更新 JSON 字段
                                updateFormData("assignedStaffJson", value.length > 0 ? JSON.stringify(value) : null);
                            }}
                            onAssignedVehiclesChange={value => {
                                updateFormData("assignedVehicles", value);
                                // 直接更新 JSON 字段
                                updateFormData("assignedVehicleJson", value.length > 0 ? JSON.stringify(value) : null);
                            }}
                        />
                    </TabsContent>
                </Tabs>
            ) : (
                <div className="space-y-4">
                    <BasicInfoForm
                        dateTime={formData.dateTime}
                        contactName={formData.contactName}
                        contactPhone={formData.contactPhone}
                        contactAddress={formData.contactAddress}
                        contactAddressDetails={formData.contactAddressDetails}
                        documentTypes={formData.documentTypes}
                        notes={formData.notes}
                        onDateTimeChange={value => updateFormData("dateTime", value)}
                        onContactNameChange={value => updateFormData("contactName", value)}
                        onContactPhoneChange={value => updateFormData("contactPhone", value)}
                        onContactAddressChange={value => updateFormData("contactAddress", value)}
                        onContactAddressDetailsChange={value => updateFormData("contactAddressDetails", value)}
                        onDocumentTypesChange={value => updateFormData("documentTypes", value)}
                        onNotesChange={value => updateFormData("notes", value)}
                    />
                </div>
            )}

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