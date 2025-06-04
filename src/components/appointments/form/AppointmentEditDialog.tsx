"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { AppointmentForm, type AppointmentFormData } from "./AppointmentForm";
import { type Appointment } from "@/lib/stores/appointments";
import { useAuthStore } from "@/lib/stores";

interface AppointmentEditDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    appointment: Appointment;
    onUpdateSuccess?: () => void;
}

export function AppointmentEditDialog({
    open,
    onOpenChange,
    appointment,
    onUpdateSuccess,
}: AppointmentEditDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAuthStore();

    const handleSubmit = async (data: AppointmentFormData) => {
        setIsSubmitting(true);

        try {
            // 准备人员和车辆分配的数据
            const assignedStaffJson = data.assignedStaff && data.assignedStaff.length > 0
                ? JSON.stringify(data.assignedStaff)
                : null;

            const assignedVehicleJson = data.assignedVehicles && data.assignedVehicles.length > 0
                ? JSON.stringify(data.assignedVehicles)
                : null;

            // 记录重要的提交数据，用于调试
            console.log("AppointmentEditDialog 提交数据:", {
                assignedStaff: data.assignedStaff,
                assignedVehicles: data.assignedVehicles,
                assignedStaffJson,
                assignedVehicleJson,
                status: data.status,
                estimatedCompletionTime: data.estimatedCompletionTime
            });

            // 计算总文档数量（从新的数据结构中）
            const totalDocumentCount = Object.values(data.documentTypes).reduce((total, category) => {
                return total + Object.values(category.items).reduce((sum, count) => sum + count, 0);
            }, 0);

            // 转换数据格式 - 使用新的文档类型结构
            const submitData = {
                id: appointment.id,
                customerName: data.contactName,
                appointmentTime: data.dateTime,
                contactPhone: data.contactPhone,
                contactAddress: data.contactAddress,
                notes: data.notes,
                documentCount: data.documentCount || totalDocumentCount,
                documentTypesJson: JSON.stringify({
                    paper: {
                        items: data.documentTypes.paper?.items || {}
                    },
                    electronic: {
                        items: data.documentTypes.magnetic?.items || {}
                    },
                    other: {
                        items: data.documentTypes.other?.items || {}
                    }
                }),
                // 添加管理员可以设置的字段
                status: data.status,
                estimatedCompletionTime: data.estimatedCompletionTime,
                processingNotes: data.processingNotes,
                // 添加分配相关字段
                assignedStaff: data.assignedStaff,
                assignedVehicles: data.assignedVehicles,
                assignedStaffJson: assignedStaffJson,
                assignedVehicleJson: assignedVehicleJson
            };

            const response = await fetch(`/api/appointments`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(submitData),
            });

            const result = await response.json();

            if (result.success) {
                onOpenChange(false);
                if (onUpdateSuccess) {
                    onUpdateSuccess();
                }
            } else {
                console.error("更新预约失败:", result.message);
                alert("更新预约失败: " + result.message);
            }
        } catch (error) {
            console.error("更新预约时出错:", error);
            alert("更新预约出错，请稍后重试");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>编辑预约</DialogTitle>
                </DialogHeader>

                <AppointmentForm
                    isAdmin={user?.role === 'admin'} // 根据用户权限决定可编辑内容
                    initialData={appointment}
                    onSubmit={handleSubmit}
                    submitLabel={isSubmitting ? "保存中..." : "保存修改"}
                />
            </DialogContent>
        </Dialog>
    );
} 