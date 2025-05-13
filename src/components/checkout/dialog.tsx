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
import { useEffect, useState } from "react";
import { Wallet, FileText, Truck, User, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Appointment } from "@/lib/stores/appointments";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface CheckoutDialogProps {
    appointment?: Appointment; // 可选的预约信息
    trigger?: React.ReactNode; // 可选的触发器，允许用户自定义触发按钮
    className?: string;
}

interface PricingSettings {
    basicServicePrice: number;
    sortingServicePrice: number;
    packagingServicePrice: number;
}

export function CheckoutDialog({ appointment, trigger, className }: CheckoutDialogProps) {
    const [open, setOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [pricingSettings, setPricingSettings] = useState<PricingSettings | null>(null);
    const [needPackagingService, setNeedPackagingService] = useState(false);

    // 获取预约相关信息
    const staffCount = appointment?.assignedStaff?.length || 0;

    // 获取价格配置
    useEffect(() => {
        if (open) {
            fetchPricingSettings();
        }
    }, [open]);

    const fetchPricingSettings = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/checkout');
            if (!response.ok) {
                throw new Error('获取价格配置失败');
            }
            const data = await response.json();
            setPricingSettings(data);
        } catch (error) {
            console.error('获取价格配置出错:', error);
            toast.error('获取价格配置失败，请稍后重试');
        } finally {
            setIsLoading(false);
        }
    };

    // 计算各项费用
    const calculatePrices = () => {
        if (!pricingSettings) {
            return {
                basicServicePrice: 0,
                staffPrice: 0,
                packagingPrice: 0,
                totalPrice: 0
            };
        }

        const basicPrice = pricingSettings.basicServicePrice;
        const staffPrice = staffCount > 0 ? staffCount * pricingSettings.sortingServicePrice : 0;
        const packagingPrice = needPackagingService ? pricingSettings.packagingServicePrice : 0;
        const totalPrice = basicPrice + staffPrice + packagingPrice;

        return {
            basicServicePrice: basicPrice,
            staffPrice,
            packagingPrice,
            totalPrice
        };
    };

    const { basicServicePrice, staffPrice, packagingPrice, totalPrice } = calculatePrices();

    // 模拟结算处理
    const handleCheckout = async () => {
        setIsProcessing(true);

        // 这里将来会有真实的结算逻辑
        await new Promise(resolve => setTimeout(resolve, 1000));

        toast.success('结算成功');
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
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle>服务结算</DialogTitle>
                    <DialogDescription>
                        {appointment
                            ? "为此预约项目进行结算"
                            : "结算您的服务费用"}
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="py-8 flex justify-center">
                        <div className="animate-pulse text-center">
                            <p className="text-sm text-muted-foreground">正在获取价格信息...</p>
                        </div>
                    </div>
                ) : (
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
                                </CardContent>
                            </Card>
                        ) : (
                            <p className="text-center text-muted-foreground">
                                请在下一步完善结算详情
                            </p>
                        )}

                        {/* 结算价格表 */}
                        <Card className="border border-gray-200">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">服务费用明细</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* 基础服务费用 */}
                                <div className="flex items-start gap-3 p-2 border border-dashed border-gray-200 rounded-md bg-gray-50">
                                    <FileText className="text-blue-500 mt-0.5" size={18} />
                                    <div className="flex-1">
                                        <div className="flex justify-between">
                                            <span className="font-medium">基础服务费</span>
                                            <span className="font-medium">¥ {basicServicePrice.toFixed(2)}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            标准文件处理服务基础费用
                                        </p>
                                    </div>
                                </div>

                                {/* 人员费用 */}
                                <div className="flex items-start gap-3 p-2 border border-dashed border-gray-200 rounded-md bg-gray-50">
                                    <User className="text-indigo-500 mt-0.5" size={18} />
                                    <div className="flex-1">
                                        <div className="flex justify-between">
                                            <span className="font-medium">分拣服务费</span>
                                            <span className="font-medium">¥ {staffPrice.toFixed(2)}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {staffCount > 0
                                                ? `已分配 ${staffCount} 名工作人员，每人 ¥${pricingSettings?.sortingServicePrice.toFixed(2)}`
                                                : "未使用分拣服务"}
                                        </p>
                                    </div>
                                </div>

                                {/* 装卸服务选项 */}
                                <div className="flex items-start gap-3 p-2 border border-dashed border-gray-200 rounded-md bg-gray-50">
                                    <Truck className="text-green-500 mt-0.5" size={18} />
                                    <div className="flex-1">
                                        <div className="flex justify-between">
                                            <span className="font-medium">装卸服务费</span>
                                            <span className="font-medium">
                                                {needPackagingService
                                                    ? `¥ ${packagingPrice.toFixed(2)}`
                                                    : "¥ 0.00"}
                                            </span>
                                        </div>
                                        <div className="flex items-center space-x-2 mt-2">
                                            <Checkbox
                                                id="packaging-service"
                                                checked={needPackagingService}
                                                onCheckedChange={(checked) =>
                                                    setNeedPackagingService(checked === true)
                                                }
                                            />
                                            <Label htmlFor="packaging-service" className="text-xs text-muted-foreground cursor-pointer">
                                                需要装卸服务（¥{pricingSettings?.packagingServicePrice.toFixed(2)}）
                                            </Label>
                                        </div>
                                    </div>
                                </div>

                                {/* 总计 */}
                                <div className="pt-2 mt-2">
                                    <Separator className="mb-2" />
                                    <div className="flex justify-between text-base font-bold">
                                        <span>总计金额:</span>
                                        <span className="text-primary">¥ {totalPrice.toFixed(2)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">取消</Button>
                    </DialogClose>
                    <Button
                        type="submit"
                        onClick={handleCheckout}
                        disabled={isProcessing || isLoading}
                        className="gap-1"
                    >
                        {isProcessing ? "处理中..." : (
                            <>
                                <Check size={16} />
                                <span>确认结算 (¥{totalPrice.toFixed(2)})</span>
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 