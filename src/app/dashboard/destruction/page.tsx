"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/stores";
import { useDestructionStore } from "@/lib/stores/destruction";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, FileText, Package, Plus, Trash2, Weight } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function DestructionPage() {
    const { user } = useAuthStore();
    const { tasks, isLoading, fetchTasks, createTask } = useDestructionStore();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    // 新建销毁任务表单状态
    const [formData, setFormData] = useState({
        customerName: "",
        contactPhone: "",
        contactAddress: "",
        scheduledDate: "",
        serviceType: "standard",
        itemDescription: "",
        estimatedWeight: "",
        specialRequirements: "",
    });

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    // 处理表单输入变化
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // 处理服务类型变化
    const handleServiceTypeChange = (value: string) => {
        setFormData(prev => ({ ...prev, serviceType: value }));
    };

    // 提交新建销毁任务
    const handleSubmit = async () => {
        try {
            const success = await createTask({
                ...formData,
                estimatedWeight: formData.estimatedWeight ? parseFloat(formData.estimatedWeight) : undefined,
            });

            if (success) {
                toast.success("销毁任务创建成功");
                setIsCreateDialogOpen(false);
                // 重置表单
                setFormData({
                    customerName: "",
                    contactPhone: "",
                    contactAddress: "",
                    scheduledDate: "",
                    serviceType: "standard",
                    itemDescription: "",
                    estimatedWeight: "",
                    specialRequirements: "",
                });
            } else {
                toast.error("创建销毁任务失败");
            }
        } catch (error) {
            toast.error("创建销毁任务时发生错误");
        }
    };

    // 获取状态对应的徽章样式
    const getStatusBadge = (status: string) => {
        const statusConfig = {
            pending: { label: "待确认", variant: "secondary" as const },
            scheduled: { label: "已安排", variant: "default" as const },
            in_progress: { label: "进行中", variant: "default" as const },
            completed: { label: "已完成", variant: "default" as const },
            cancelled: { label: "已取消", variant: "destructive" as const },
        };
        const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: "secondary" as const };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    return (
        <AuthGuard requiredRole="user">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">销毁任务管理</h1>
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                创建销毁任务
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                                <DialogTitle>创建销毁任务</DialogTitle>
                                <DialogDescription>
                                    填写销毁任务信息，我们将按时上门提供服务
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="customerName">客户名称 *</Label>
                                        <Input
                                            id="customerName"
                                            name="customerName"
                                            value={formData.customerName}
                                            onChange={handleInputChange}
                                            placeholder="请输入客户名称"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="contactPhone">联系电话 *</Label>
                                        <Input
                                            id="contactPhone"
                                            name="contactPhone"
                                            value={formData.contactPhone}
                                            onChange={handleInputChange}
                                            placeholder="请输入联系电话"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="contactAddress">联系地址 *</Label>
                                    <Input
                                        id="contactAddress"
                                        name="contactAddress"
                                        value={formData.contactAddress}
                                        onChange={handleInputChange}
                                        placeholder="请输入详细地址"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="scheduledDate">预约日期 *</Label>
                                        <Input
                                            id="scheduledDate"
                                            name="scheduledDate"
                                            type="datetime-local"
                                            value={formData.scheduledDate}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="serviceType">服务类型 *</Label>
                                        <Select value={formData.serviceType} onValueChange={handleServiceTypeChange}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="选择服务类型" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="standard">标准销毁</SelectItem>
                                                <SelectItem value="urgent">加急销毁</SelectItem>
                                                <SelectItem value="onsite">现场销毁</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="itemDescription">物品描述</Label>
                                    <Textarea
                                        id="itemDescription"
                                        name="itemDescription"
                                        value={formData.itemDescription}
                                        onChange={handleInputChange}
                                        placeholder="请描述需要销毁的物品类型和数量"
                                        rows={3}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="estimatedWeight">预估重量（公斤）</Label>
                                        <Input
                                            id="estimatedWeight"
                                            name="estimatedWeight"
                                            type="number"
                                            value={formData.estimatedWeight}
                                            onChange={handleInputChange}
                                            placeholder="请输入预估重量"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="specialRequirements">特殊要求</Label>
                                    <Textarea
                                        id="specialRequirements"
                                        name="specialRequirements"
                                        value={formData.specialRequirements}
                                        onChange={handleInputChange}
                                        placeholder="如有特殊要求请在此说明"
                                        rows={2}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                    取消
                                </Button>
                                <Button onClick={handleSubmit}>创建任务</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* 用户计费信息卡片 */}
                {user && (
                    <Card>
                        <CardHeader>
                            <CardTitle>账户信息</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">客户名称</p>
                                    <p className="font-medium">{user.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">计费模式</p>
                                    <p className="font-medium">
                                        {user.billingType === "yearly" ? "年费用户" : "按次收费"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">联系电话</p>
                                    <p className="font-medium">{user.phone || "-"}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* 销毁任务列表 */}
                <Card>
                    <CardHeader>
                        <CardTitle>销毁任务列表</CardTitle>
                        <CardDescription>
                            查看和管理您的所有销毁任务
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center py-8">加载中...</div>
                        ) : tasks.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                暂无销毁任务，点击上方按钮创建新任务
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>任务编号</TableHead>
                                        <TableHead>客户名称</TableHead>
                                        <TableHead>预约时间</TableHead>
                                        <TableHead>服务类型</TableHead>
                                        <TableHead>状态</TableHead>
                                        <TableHead>创建时间</TableHead>
                                        <TableHead>操作</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tasks.map((task) => (
                                        <TableRow key={task.id}>
                                            <TableCell className="font-mono">{task.taskId}</TableCell>
                                            <TableCell>{task.customerName}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-4 w-4" />
                                                    {format(new Date(task.scheduledDate), "yyyy-MM-dd HH:mm")}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {task.serviceType === "standard" && "标准销毁"}
                                                {task.serviceType === "urgent" && "加急销毁"}
                                                {task.serviceType === "onsite" && "现场销毁"}
                                            </TableCell>
                                            <TableCell>{getStatusBadge(task.status)}</TableCell>
                                            <TableCell>
                                                {format(new Date(task.createdAt), "yyyy-MM-dd")}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button variant="outline" size="sm">
                                                        查看详情
                                                    </Button>
                                                    {task.status === "completed" && (
                                                        <Button variant="outline" size="sm">
                                                            <FileText className="h-4 w-4 mr-1" />
                                                            下载证明
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AuthGuard>
    );
} 