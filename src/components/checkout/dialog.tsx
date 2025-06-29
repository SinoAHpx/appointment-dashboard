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
import { Wallet, FileText, Truck, User, Check, Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Appointment } from "@/lib/stores/appointments";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface CheckoutDialogProps {
    appointment?: Appointment; // 可选的预约信息
    trigger?: React.ReactNode; // 可选的触发器，允许用户自定义触发按钮
    className?: string;
}

interface ServiceItem {
    id: number;
    name: string;
    unit: string;
    price: number;
    description?: string;
    isActive: boolean;
}

interface ServiceQuantity {
    serviceId: number;
    quantity: number;
}

export function CheckoutDialog({ appointment, trigger, className }: CheckoutDialogProps) {
    const [open, setOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
    const [serviceQuantities, setServiceQuantities] = useState<ServiceQuantity[]>([]);

    // 获取动态服务项目
    useEffect(() => {
        if (open) {
            fetchServiceItems();
        }
    }, [open]);

    const fetchServiceItems = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/checkout/service-items?active=true');
            if (!response.ok) {
                throw new Error('获取服务项目失败');
            }
            const result = await response.json();
            if (result.success) {
                setServiceItems(result.data);
                // 初始化数量，默认每个服务项目数量为0
                setServiceQuantities(result.data.map((item: ServiceItem) => ({
                    serviceId: item.id,
                    quantity: 0
                })));
            } else {
                throw new Error(result.error || '获取服务项目失败');
            }
        } catch (error) {
            console.error('获取服务项目出错:', error);
            toast.error('获取服务项目失败，请稍后重试');
        } finally {
            setIsLoading(false);
        }
    };

    // 更新服务数量
    const updateServiceQuantity = (serviceId: number, quantity: number) => {
        setServiceQuantities(prev => prev.map(sq =>
            sq.serviceId === serviceId
                ? { ...sq, quantity: Math.max(0, quantity) }
                : sq
        ));
    };

    // 计算总价
    const calculateTotal = () => {
        return serviceQuantities.reduce((total, sq) => {
            const service = serviceItems.find(si => si.id === sq.serviceId);
            return total + (service ? service.price * sq.quantity : 0);
        }, 0);
    };

    const totalPrice = calculateTotal();

    // 模拟结算处理
    const handleCheckout = async () => {
        // 检查是否选择了任何服务
        const hasSelectedServices = serviceQuantities.some(sq => sq.quantity > 0);
        if (!hasSelectedServices) {
            toast.error('请至少选择一项服务');
            return;
        }

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
            <DialogContent className="sm:max-w-[650px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>服务结算</DialogTitle>
                    <DialogDescription>
                        {appointment
                            ? "为此预约项目进行结算"
                            : "选择需要的服务并进行结算"}
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="py-8 flex justify-center">
                        <div className="animate-pulse text-center">
                            <p className="text-sm text-muted-foreground">正在获取服务项目...</p>
                        </div>
                    </div>
                ) : (
                    <div className="py-4 space-y-4">
                        {appointment && (
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
                                            {appointment.status === "confirmed" && "已预约"}
                                            {appointment.status === "completed" && "已完成"}
                                            {appointment.status === "cancelled" && "已取消"}
                                            {appointment.status === "in_progress" && "处理中"}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* 服务项目选择 */}
                        <Card className="border border-gray-200">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">选择服务项目</CardTitle>
                                <CardDescription>
                                    请选择需要的服务并设置数量
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {serviceItems.length === 0 ? (
                                    <div className="text-center py-4 text-muted-foreground">
                                        暂无可用的服务项目
                                    </div>
                                ) : (
                                    serviceItems.map((service) => {
                                        const quantityData = serviceQuantities.find(sq => sq.serviceId === service.id);
                                        const quantity = quantityData?.quantity || 0;
                                        const itemTotal = service.price * quantity;

                                        return (
                                            <div key={service.id} className="flex items-center gap-3 p-3 border border-dashed border-gray-200 rounded-md bg-gray-50">
                                                <FileText className="text-blue-500 flex-shrink-0" size={18} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <span className="font-medium">{service.name}</span>
                                                            <span className="text-sm text-muted-foreground ml-2">
                                                                ({service.unit})
                                                            </span>
                                                        </div>
                                                        <span className="font-medium text-right">
                                                            ¥{service.price.toFixed(2)}
                                                        </span>
                                                    </div>
                                                    {service.description && (
                                                        <p className="text-xs text-muted-foreground mb-2">
                                                            {service.description}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8 w-8 p-0"
                                                                onClick={() => updateServiceQuantity(service.id, quantity - 1)}
                                                                disabled={quantity <= 0}
                                                            >
                                                                <Minus className="h-4 w-4" />
                                                            </Button>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                value={quantity}
                                                                onChange={(e) => updateServiceQuantity(service.id, Number(e.target.value) || 0)}
                                                                className="h-8 w-16 text-center"
                                                            />
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8 w-8 p-0"
                                                                onClick={() => updateServiceQuantity(service.id, quantity + 1)}
                                                            >
                                                                <Plus className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-sm text-muted-foreground">小计: </span>
                                                            <span className="font-medium">
                                                                ¥{itemTotal.toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}

                                {/* 总计 */}
                                {serviceItems.length > 0 && (
                                    <div className="pt-2 mt-4">
                                        <Separator className="mb-4" />
                                        <div className="flex justify-between text-lg font-bold">
                                            <span>总计金额:</span>
                                            <span className="text-primary">¥{totalPrice.toFixed(2)}</span>
                                        </div>
                                    </div>
                                )}
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
                        disabled={isProcessing || isLoading || totalPrice === 0}
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