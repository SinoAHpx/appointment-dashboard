"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Appointment, useAppointmentStore } from "@/lib/stores";
import { Download, FileDown, FileSpreadsheet, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { Skeleton } from "@/components/ui/skeleton";
import { documentTypesByCategory } from "@/lib/utils/appointments/helpers";

type ExportType = "appointments" | "users" | "vehicles";

export function DataExport() {
    const { appointments, fetchAppointments, isLoading } = useAppointmentStore();
    const [selectedExportType, setSelectedExportType] = useState<ExportType>("appointments");
    const [selectedFields, setSelectedFields] = useState<Record<string, boolean>>({
        appointmentId: true,
        contactName: true,
        contactPhone: true,
        contactAddress: true,
        dateTime: true,
        status: true,
        documentTypesJson: true,
        notes: false,
        createdAt: false,
    });
    const [isExporting, setIsExporting] = useState(false);

    // 组件加载时获取预约数据
    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    // 设置选择的字段
    const handleFieldSelection = (field: string, checked: boolean) => {
        setSelectedFields((prev) => ({
            ...prev,
            [field]: checked,
        }));
    };

    // 将value转换为对应的label
    const valueToLabel = (category: string, value: string): string => {
        const items = documentTypesByCategory[category as keyof typeof documentTypesByCategory] || [];
        const item = items.find(item => item.value === value);
        return item ? item.label : value;
    };

    // 格式化文件类型JSON为人类可读格式
    const formatDocumentTypes = (documentTypesJson: string | undefined): string => {
        if (!documentTypesJson) return "无数据";

        try {
            const data = JSON.parse(documentTypesJson);
            const parts = [];

            // 处理纸介质
            if (data.paper && data.paper.items && Object.keys(data.paper.items).length > 0) {
                const itemsWithCounts = Object.entries(data.paper.items)
                    .filter(([_, item]) => {
                        const count = typeof item === 'number' ? item : ((item as any)?.count || 0);
                        return count > 0;
                    })
                    .map(([type, item]) => {
                        const count = typeof item === 'number' ? item : ((item as any)?.count || 0);
                        const customName = typeof item === 'object' ? (item as any)?.customName : undefined;
                        const displayName = customName || valueToLabel("paper", type);
                        return `${displayName}(${count})`;
                    });

                if (itemsWithCounts.length > 0) {
                    const totalCount = Object.values(data.paper.items)
                        .reduce((sum, item) => sum + (typeof item === 'number' ? item : ((item as any)?.count || 0)), 0);
                    parts.push(`纸介质 ${itemsWithCounts.join("、")} 共${totalCount}个`);
                }
            }

            // 处理电子/磁介质
            if (data.electronic && data.electronic.items && Object.keys(data.electronic.items).length > 0) {
                const itemsWithCounts = Object.entries(data.electronic.items)
                    .filter(([_, item]) => {
                        const count = typeof item === 'number' ? item : ((item as any)?.count || 0);
                        return count > 0;
                    })
                    .map(([type, item]) => {
                        const count = typeof item === 'number' ? item : ((item as any)?.count || 0);
                        const customName = typeof item === 'object' ? (item as any)?.customName : undefined;
                        const displayName = customName || valueToLabel("magnetic", type);
                        return `${displayName}(${count})`;
                    });

                if (itemsWithCounts.length > 0) {
                    const totalCount = Object.values(data.electronic.items)
                        .reduce((sum, item) => sum + (typeof item === 'number' ? item : ((item as any)?.count || 0)), 0);
                    parts.push(`磁介质 ${itemsWithCounts.join("、")} 共${totalCount}个`);
                }
            }

            // 处理其他类型
            if (data.other && data.other.items && Object.keys(data.other.items).length > 0) {
                const itemsWithCounts = Object.entries(data.other.items)
                    .filter(([_, item]) => {
                        const count = typeof item === 'number' ? item : ((item as any)?.count || 0);
                        return count > 0;
                    })
                    .map(([type, item]) => {
                        const count = typeof item === 'number' ? item : ((item as any)?.count || 0);
                        const customName = typeof item === 'object' ? (item as any)?.customName : undefined;
                        const displayName = customName || valueToLabel("other", type);
                        return `${displayName}(${count})`;
                    });

                if (itemsWithCounts.length > 0) {
                    const totalCount = Object.values(data.other.items)
                        .reduce((sum, item) => sum + (typeof item === 'number' ? item : ((item as any)?.count || 0)), 0);
                    parts.push(`其他介质 ${itemsWithCounts.join("、")} 共${totalCount}个`);
                }
            }

            return parts.length > 0 ? parts.join("，") : "无数据";
        } catch (error) {
            console.error("解析文件类型JSON出错:", error);
            return "格式错误";
        }
    };

    // 导出预约数据到Excel
    const exportAppointmentsToExcel = () => {
        setIsExporting(true);

        try {
            // 准备要导出的数据
            const exportData = appointments.map((appointment) => {
                const row: Record<string, any> = {};

                // 只包含选中的字段
                if (selectedFields.appointmentId) row["预约编号"] = appointment.appointmentId;
                if (selectedFields.contactName) row["姓名"] = appointment.contactName;
                if (selectedFields.contactPhone) row["电话"] = appointment.contactPhone;
                if (selectedFields.contactAddress) row["地址"] = appointment.contactAddress;
                if (selectedFields.dateTime) row["预约时间"] = formatDate(appointment.dateTime);
                if (selectedFields.status) row["状态"] = getStatusText(appointment.status);
                if (selectedFields.documentTypesJson) row["文件类型"] = formatDocumentTypes(appointment.documentTypesJson);
                if (selectedFields.notes) row["备注"] = appointment.notes || "";
                if (selectedFields.createdAt) row["创建时间"] = formatDate(appointment.createdAt);

                return row;
            });

            // 创建工作簿和工作表
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(exportData);

            // 添加工作表到工作簿
            XLSX.utils.book_append_sheet(workbook, worksheet, "预约数据");

            // 生成时间戳用于文件名
            const timestamp = new Date().toISOString().replace(/:/g, "-").replace(/\./g, "-").substring(0, 19);

            // 导出Excel文件
            XLSX.writeFile(workbook, `预约数据_${timestamp}.xlsx`);
        } catch (error) {
            console.error("导出Excel失败:", error);
        } finally {
            setIsExporting(false);
        }
    };

    // 获取状态文本
    const getStatusText = (status: Appointment["status"]): string => {
        const statusMap: Record<Appointment["status"], string> = {
            pending: "待处理",
            confirmed: "已预约",
            in_progress: "处理中",
            completed: "已完成",
            cancelled: "已取消",
        };
        return statusMap[status] || status;
    };

    // 添加formatDate函数到组件内部
    function formatDate(dateTimeStr: string): string {
        try {
            const date = new Date(dateTimeStr);
            return date.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return dateTimeStr;
        }
    }

    return (
        <div className="space-y-6">
            <RadioGroup
                value={selectedExportType}
                onValueChange={(value) => setSelectedExportType(value as ExportType)}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
                <div>
                    <RadioGroupItem
                        value="appointments"
                        id="appointments"
                        className="peer sr-only"
                    />
                    <Label
                        htmlFor="appointments"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                        <FileSpreadsheet className="mb-3 h-6 w-6" />
                        <span className="text-sm font-medium">预约数据</span>
                    </Label>
                </div>

                <div>
                    <RadioGroupItem
                        value="users"
                        id="users"
                        className="peer sr-only"
                        disabled
                    />
                    <Label
                        htmlFor="users"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary opacity-50 cursor-not-allowed"
                    >
                        <FileSpreadsheet className="mb-3 h-6 w-6" />
                        <span className="text-sm font-medium">用户数据</span>
                    </Label>
                </div>

                <div>
                    <RadioGroupItem
                        value="vehicles"
                        id="vehicles"
                        className="peer sr-only"
                        disabled
                    />
                    <Label
                        htmlFor="vehicles"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary opacity-50 cursor-not-allowed"
                    >
                        <FileSpreadsheet className="mb-3 h-6 w-6" />
                        <span className="text-sm font-medium">车辆数据</span>
                    </Label>
                </div>
            </RadioGroup>

            {isLoading ? (
                <Card>
                    <CardHeader>
                        <Skeleton className="h-5 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {Array.from({ length: 9 }).map((_, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                    <Skeleton className="h-4 w-4" />
                                    <Skeleton className="h-4 w-[100px]" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Skeleton className="h-9 w-full" />
                    </CardFooter>
                </Card>
            ) : (
                selectedExportType === "appointments" && (
                    <Card>
                        <CardHeader>
                            <CardTitle>预约数据导出选项</CardTitle>
                            <CardDescription>选择要导出的字段</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="appointmentId"
                                        checked={selectedFields.appointmentId}
                                        onCheckedChange={(checked) => handleFieldSelection("appointmentId", !!checked)}
                                    />
                                    <Label htmlFor="appointmentId">预约编号</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="contactName"
                                        checked={selectedFields.contactName}
                                        onCheckedChange={(checked) => handleFieldSelection("contactName", !!checked)}
                                    />
                                    <Label htmlFor="contactName">姓名</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="contactPhone"
                                        checked={selectedFields.contactPhone}
                                        onCheckedChange={(checked) => handleFieldSelection("contactPhone", !!checked)}
                                    />
                                    <Label htmlFor="contactPhone">电话</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="contactAddress"
                                        checked={selectedFields.contactAddress}
                                        onCheckedChange={(checked) => handleFieldSelection("contactAddress", !!checked)}
                                    />
                                    <Label htmlFor="contactAddress">地址</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="dateTime"
                                        checked={selectedFields.dateTime}
                                        onCheckedChange={(checked) => handleFieldSelection("dateTime", !!checked)}
                                    />
                                    <Label htmlFor="dateTime">预约时间</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="status"
                                        checked={selectedFields.status}
                                        onCheckedChange={(checked) => handleFieldSelection("status", !!checked)}
                                    />
                                    <Label htmlFor="status">状态</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="documentTypesJson"
                                        checked={selectedFields.documentTypesJson}
                                        onCheckedChange={(checked) => handleFieldSelection("documentTypesJson", !!checked)}
                                    />
                                    <Label htmlFor="documentTypesJson">文件类型</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="notes"
                                        checked={selectedFields.notes}
                                        onCheckedChange={(checked) => handleFieldSelection("notes", !!checked)}
                                    />
                                    <Label htmlFor="notes">备注</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="createdAt"
                                        checked={selectedFields.createdAt}
                                        onCheckedChange={(checked) => handleFieldSelection("createdAt", !!checked)}
                                    />
                                    <Label htmlFor="createdAt">创建时间</Label>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                onClick={exportAppointmentsToExcel}
                                disabled={isLoading || isExporting || appointments.length === 0}
                                className="w-full"
                            >
                                {isExporting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        正在导出...
                                    </>
                                ) : (
                                    <>
                                        <Download className="mr-2 h-4 w-4" />
                                        导出到Excel{appointments.length > 0 ? ` (${appointments.length}条记录)` : ''}
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                )
            )}
        </div>
    );
} 