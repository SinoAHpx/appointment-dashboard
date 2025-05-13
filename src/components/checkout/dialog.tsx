"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Appointment } from "@/lib/stores/appointments";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface CheckoutDialogProps {
    appointment?: Appointment; // 可选的预约信息
    trigger?: React.ReactNode; // 可选的触发器，允许用户自定义触发按钮
    className?: string;
}

export function CheckoutDialog({ appointment, trigger, className }: CheckoutDialogProps) {
    const [open, setOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // 模拟结算处理
    const handleCheckout = async () => {
        setIsProcessing(true);

        // 这里将来会有真实的结算逻辑
        await new Promise(resolve => setTimeout(resolve, 1000));

        setIsProcessing(false);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button
                        variant="outline"
                        className={cn("flex items-center gap-1", className)}
                    >
                        <Wallet size={16} />
                        <span>结算</span>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>服务结算</DialogTitle>
                    <DialogDescription>
                        {appointment
                            ? "为此预约项目进行结算"
                            : "结算您的服务费用"}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    {appointment ? (
                        <Card className="border border-gray-200">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">预约详情</CardTitle>
                                <CardDescription>
                                    预约号: #{appointment.appointmentId || appointment.id}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2 pt-0 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">预约时间:</span>
                                    <span className="font-medium">
                                        {new Date(appointment.dateTime).toLocaleString('zh-CN')}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">服务类型:</span>
                                    <span className="font-medium">{appointment.documentType}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">状态:</span>
                                    <span className="font-medium capitalize">
                                        {appointment.status === "pending" && "待确认"}
                                        {appointment.status === "confirmed" && "已确认"}
                                        {appointment.status === "completed" && "已完成"}
                                        {appointment.status === "cancelled" && "已取消"}
                                        {appointment.status === "in_progress" && "处理中"}
                                    </span>
                                </div>
                                <div className="flex justify-between pt-2 text-base font-semibold">
                                    <span>应付金额:</span>
                                    <span className="text-primary">¥ 350.00</span>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <p className="text-center text-muted-foreground">
                            请在下一步完善结算详情
                        </p>
                    )}
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">取消</Button>
                    </DialogClose>
                    <Button
                        type="submit"
                        onClick={handleCheckout}
                        disabled={isProcessing}
                    >
                        {isProcessing ? "处理中..." : "确认结算"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 