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
            paper: { types: [], count: 0 },
            magnetic: { types: [], count: 0 },
            other: { types: [], count: 0 }
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
                    console.error("解析documentTypesJson失败:", error);
                }
            }

            // 处理人员和车辆分配
            let assignedStaff: string[] = [];
            let assignedVehicles: string[] = [];

            // 处理来自数据库的人员和车辆数据
            if (initialData.assignedStaff && Array.isArray(initialData.assignedStaff)) {
                assignedStaff = initialData.assignedStaff;
            }

            if (initialData.assignedVehicles && Array.isArray(initialData.assignedVehicles)) {
                assignedVehicles = initialData.assignedVehicles;
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

        // 准备分配的人员和车辆的JSON字符串
        const assignedStaffJson = formData.assignedStaff && formData.assignedStaff.length > 0
            ? JSON.stringify(formData.assignedStaff)
            : null;

        const assignedVehicleJson = formData.assignedVehicles && formData.assignedVehicles.length > 0
            ? JSON.stringify(formData.assignedVehicles)
            : null;

        // 记录关键数据，确保数据被正确传递
        console.log('提交表单数据:', {
            assignedStaff: formData.assignedStaff,
            assignedVehicles: formData.assignedVehicles,
            assignedStaffJson,
            assignedVehicleJson
        });

        // 准备提交数据
        const submitData = {
            ...formData,
            documentTypesJson,
            assignedStaffJson,
            assignedVehicleJson
        };

        onSubmit(submitData);
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