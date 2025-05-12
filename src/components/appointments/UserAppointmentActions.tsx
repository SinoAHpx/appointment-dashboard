"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit, X } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { type Appointment } from "@/lib/stores/appointments";
import { useRouter } from "next/navigation";
import { AppointmentEditDialog } from "./form/AppointmentEditDialog";

interface UserAppointmentActionsProps {
    appointment: Appointment;
    onCancelSuccess?: () => void;
    onUpdateSuccess?: () => void;
}

export function UserAppointmentActions({
    appointment,
    onCancelSuccess,
    onUpdateSuccess,
}: UserAppointmentActionsProps) {
    const router = useRouter();
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // 判断预约是否可以被取消（只有 pending 和 confirmed 状态可取消）
    const canCancel = ["pending", "confirmed"].includes(appointment.status);

    // 判断预约是否可以被编辑（已完成或已取消的预约不能编辑）
    const canEdit = appointment.status === "pending";

    // 取消预约
    const handleCancelAppointment = async () => {
        setIsLoading(true);

        try {
            const response = await fetch(`/api/appointments`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: appointment.id,
                    status: "cancelled",
                }),
            });

            const data = await response.json();

            if (data.success) {
                setIsCancelDialogOpen(false);
                if (onCancelSuccess) {
                    onCancelSuccess();
                } else {
                    router.refresh();
                }
            } else {
                console.error("取消预约失败:", data.message);
                alert("取消预约失败: " + data.message);
            }
        } catch (error) {
            console.error("取消预约出错:", error);
            alert("取消预约出错，请稍后重试");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="flex space-x-2">
                {canEdit && (
                    <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => setIsEditDialogOpen(true)}
                    >
                        <Edit size={14} className="mr-1" />
                        编辑
                    </Button>
                )}

                {canCancel && (
                    <Button
                        size="sm"
                        variant="destructive"
                        className="text-xs"
                        onClick={() => setIsCancelDialogOpen(true)}
                    >
                        <X size={14} className="mr-1" />
                        取消预约
                    </Button>
                )}
            </div>

            {/* 取消预约确认对话框 */}
            <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认取消预约？</AlertDialogTitle>
                        <AlertDialogDescription>
                            您确定要取消此预约吗？此操作无法撤销。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isLoading}>取消</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleCancelAppointment}
                            disabled={isLoading}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isLoading ? "处理中..." : "确认取消"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* 编辑预约对话框 */}
            <AppointmentEditDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                appointment={appointment}
                onUpdateSuccess={() => {
                    if (onUpdateSuccess) {
                        onUpdateSuccess();
                    } else {
                        router.refresh();
                    }
                }}
            />
        </>
    );
} 