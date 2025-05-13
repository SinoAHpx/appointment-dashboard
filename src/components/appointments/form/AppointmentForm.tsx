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
    documentCount: number;
    documentTypes: DocumentTypesData;
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

    const [formData, setFormData] = useState<AppointmentFormData>({
        dateTime: "",
        contactName: "",
        contactPhone: "",
        contactAddress: "",
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
                            documentTypes={formData.documentTypes}
                            notes={formData.notes}
                            onDateTimeChange={value => updateFormData("dateTime", value)}
                            onContactNameChange={value => updateFormData("contactName", value)}
                            onContactPhoneChange={value => updateFormData("contactPhone", value)}
                            onContactAddressChange={value => updateFormData("contactAddress", value)}
                            onDocumentTypesChange={value => updateFormData("documentTypes", value)}
                            onNotesChange={value => updateFormData("notes", value)}
                        />
                    </TabsContent>

                    <TabsContent value="admin" className="space-y-4">
                        <AdminProcessingForm
                            status={formData.status}
                            estimatedCompletionTime={formData.estimatedCompletionTime || ""}
                            assignedStaff={formData.assignedStaff || []}
                            assignedVehicle={formData.assignedVehicle || ""}
                            onStatusChange={value => updateFormData("status", value as AppointmentFormData["status"])}
                            onEstimatedCompletionTimeChange={value => updateFormData("estimatedCompletionTime", value)}
                            onAssignedStaffChange={value => updateFormData("assignedStaff", value)}
                            onAssignedVehicleChange={value => updateFormData("assignedVehicle", value)}
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
                        documentTypes={formData.documentTypes}
                        notes={formData.notes}
                        onDateTimeChange={value => updateFormData("dateTime", value)}
                        onContactNameChange={value => updateFormData("contactName", value)}
                        onContactPhoneChange={value => updateFormData("contactPhone", value)}
                        onContactAddressChange={value => updateFormData("contactAddress", value)}
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