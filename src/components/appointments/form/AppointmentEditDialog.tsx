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
            // 转换数据格式
            const submitData = {
                id: appointment.id,
                customerName: data.contactName,
                appointmentTime: data.dateTime,
                contactPhone: data.contactPhone,
                contactAddress: data.contactAddress,
                notes: data.notes,
                documentCount: data.documentCount ||
                    Object.values(data.documentTypes).reduce((total, category) => total + (category.count || 0), 0),
                documentTypesJson: JSON.stringify({
                    paper: {
                        items: data.documentTypes.paper?.types || [],
                        count: data.documentTypes.paper?.count || 0
                    },
                    electronic: {
                        items: data.documentTypes.magnetic?.types || [],
                        count: data.documentTypes.magnetic?.count || 0
                    },
                    other: {
                        items: data.documentTypes.other?.types || [],
                        count: data.documentTypes.other?.count || 0
                    }
                }),
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
                    isAdmin={false} // 普通用户只能编辑基本信息
                    initialData={appointment}
                    onSubmit={handleSubmit}
                    submitLabel={isSubmitting ? "保存中..." : "保存修改"}
                />
            </DialogContent>
        </Dialog>
    );
} 