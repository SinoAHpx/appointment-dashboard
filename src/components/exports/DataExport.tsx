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
import { useUserStore, AdminUser } from "@/lib/stores/user";
import { useStaffStore, Staff } from "@/lib/stores/staff";
import { useVehicleStore, Vehicle } from "@/lib/stores/vehicles";
import { Download, FileDown, FileSpreadsheet, Loader2, Database } from "lucide-react";
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { Skeleton } from "@/components/ui/skeleton";
import { documentTypesByCategory } from "@/lib/utils/appointments/helpers";

type ExportType = "appointments" | "users" | "staff" | "vehicles" | "waste-auctions" | "waste-bids";

// 废料竞价相关接口定义
interface WasteAuction {
    id: number;
    batchId: number;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    basePrice: number;
    reservePrice?: number;
    status: string;
    createdAt: string;
    createdBy: number;
    winnerId?: number;
    winningBid?: number;
    batch?: {
        batchNumber: string;
        title: string;
        wasteType: string;
        estimatedWeight?: number;
        location?: string;
    };
    bidCount: number;
    highestBid: number;
}

interface WasteBid {
    id: number;
    auctionId: number;
    bidderId: number;
    bidAmount: number;
    bidTime: string;
    notes?: string;
    status: string;
    bidder?: {
        name: string;
        username: string;
    };
    auctionTitle?: string;
    batchTitle?: string;
    batchNumber?: string;
}

export function DataExport() {
    const { appointments, fetchAppointments, isLoading: appointmentsLoading } = useAppointmentStore();
    const { users, fetchUsers, isLoading: usersLoading } = useUserStore();
    const { staffList, fetchStaff, isLoading: staffLoading } = useStaffStore();
    const { vehicles, fetchVehicles, isLoading: vehiclesLoading } = useVehicleStore();

    const [selectedExportType, setSelectedExportType] = useState<ExportType>("appointments");
    const [wasteAuctions, setWasteAuctions] = useState<WasteAuction[]>([]);
    const [wasteBids, setWasteBids] = useState<WasteBid[]>([]);
    const [wasteAuctionsLoading, setWasteAuctionsLoading] = useState(false);
    const [wasteBidsLoading, setWasteBidsLoading] = useState(false);

    const [selectedFields, setSelectedFields] = useState<Record<string, boolean>>({
        // 预约字段
        appointmentId: true,
        contactName: true,
        contactPhone: true,
        contactAddress: true,
        dateTime: true,
        status: true,
        documentTypesJson: true,
        notes: false,
        createdAt: false,

        // 用户字段
        userId: true,
        username: true,
        userName: true,
        userRole: true,
        userPhone: true,
        isGovUser: true,
        billingType: false,
        contractStartDate: false,
        contractEndDate: false,
        userCreatedAt: false,

        // 员工字段
        staffId: true,
        staffName: true,
        staffPhone: true,
        idCard: true,
        position: true,
        staffStatus: true,
        isAvailable: true,
        staffCreatedAt: false,

        // 车辆字段
        vehicleId: true,
        plateNumber: true,
        model: true,
        vehicleType: true,
        length: true,
        vehicleIsAvailable: true,
        vehicleCreatedAt: false,

        // 废料竞价字段
        auctionId: true,
        auctionTitle: true,
        batchNumber: true,
        startTime: true,
        endTime: true,
        basePrice: true,
        reservePrice: false,
        auctionStatus: true,
        bidCount: true,
        highestBid: true,
        winnerInfo: false,
        auctionCreatedAt: false,

        // 出价字段
        bidId: true,
        bidAuctionTitle: true,
        bidBatchNumber: true,
        bidder: true,
        bidAmount: true,
        bidTime: true,
        bidStatus: true,
        bidNotes: false,
    });
    const [isExporting, setIsExporting] = useState(false);
    const [isBackingUp, setIsBackingUp] = useState(false);

    // 组件加载时获取数据
    useEffect(() => {
        fetchAppointments();
        fetchUsers();
        fetchStaff();
        fetchVehicles();
    }, [fetchAppointments, fetchUsers, fetchStaff, fetchVehicles]);

    // 获取废料竞价数据
    const fetchWasteAuctions = async () => {
        setWasteAuctionsLoading(true);
        try {
            const response = await fetch("/api/waste-auctions");
            const data = await response.json();
            if (data.success) {
                setWasteAuctions(data.data || []);
            }
        } catch (error) {
            console.error("获取废料竞价数据失败:", error);
        } finally {
            setWasteAuctionsLoading(false);
        }
    };

    // 获取废料出价数据
    const fetchWasteBids = async () => {
        setWasteBidsLoading(true);
        try {
            const response = await fetch("/api/waste-bids");
            const data = await response.json();
            if (data.success) {
                setWasteBids(data.data || []);
            }
        } catch (error) {
            console.error("获取废料出价数据失败:", error);
        } finally {
            setWasteBidsLoading(false);
        }
    };

    // 根据选择的导出类型加载对应数据
    useEffect(() => {
        if (selectedExportType === "waste-auctions") {
            fetchWasteAuctions();
        } else if (selectedExportType === "waste-bids") {
            fetchWasteBids();
        }
    }, [selectedExportType]);

    // 计算当前loading状态
    const getCurrentLoadingState = () => {
        switch (selectedExportType) {
            case "appointments": return appointmentsLoading;
            case "users": return usersLoading;
            case "staff": return staffLoading;
            case "vehicles": return vehiclesLoading;
            case "waste-auctions": return wasteAuctionsLoading;
            case "waste-bids": return wasteBidsLoading;
            default: return false;
        }
    };

    const isLoading = getCurrentLoadingState();

    // 获取当前数据集的长度
    const getCurrentDataLength = () => {
        switch (selectedExportType) {
            case "appointments": return appointments.length;
            case "users": return users.length;
            case "staff": return staffList.length;
            case "vehicles": return vehicles.length;
            case "waste-auctions": return wasteAuctions.length;
            case "waste-bids": return wasteBids.length;
            default: return 0;
        }
    };

    const currentDataLength = getCurrentDataLength();

    // 获取当前数据类型的标题和描述
    const getCurrentTypeInfo = () => {
        switch (selectedExportType) {
            case "appointments": return { title: "预约数据导出选项", description: "选择要导出的预约字段" };
            case "users": return { title: "用户数据导出选项", description: "选择要导出的用户字段" };
            case "staff": return { title: "员工数据导出选项", description: "选择要导出的员工字段" };
            case "vehicles": return { title: "车辆数据导出选项", description: "选择要导出的车辆字段" };
            case "waste-auctions": return { title: "尾料竞价导出选项", description: "选择要导出的竞价字段" };
            case "waste-bids": return { title: "出价记录导出选项", description: "选择要导出的出价字段" };
            default: return { title: "数据导出选项", description: "选择要导出的字段" };
        }
    };

    const typeInfo = getCurrentTypeInfo();

    // 设置选择的字段
    const handleFieldSelection = (field: string, checked: boolean) => {
        setSelectedFields((prev) => ({
            ...prev,
            [field]: checked,
        }));
    };

    // 渲染字段选择器
    const renderFieldSelectors = () => {
        switch (selectedExportType) {
            case "appointments":
                return (
                    <>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="appointmentId" checked={selectedFields.appointmentId} onCheckedChange={(checked) => handleFieldSelection("appointmentId", !!checked)} />
                            <Label htmlFor="appointmentId">预约编号</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="contactName" checked={selectedFields.contactName} onCheckedChange={(checked) => handleFieldSelection("contactName", !!checked)} />
                            <Label htmlFor="contactName">姓名</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="contactPhone" checked={selectedFields.contactPhone} onCheckedChange={(checked) => handleFieldSelection("contactPhone", !!checked)} />
                            <Label htmlFor="contactPhone">电话</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="contactAddress" checked={selectedFields.contactAddress} onCheckedChange={(checked) => handleFieldSelection("contactAddress", !!checked)} />
                            <Label htmlFor="contactAddress">地址</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="dateTime" checked={selectedFields.dateTime} onCheckedChange={(checked) => handleFieldSelection("dateTime", !!checked)} />
                            <Label htmlFor="dateTime">预约时间</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="status" checked={selectedFields.status} onCheckedChange={(checked) => handleFieldSelection("status", !!checked)} />
                            <Label htmlFor="status">状态</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="documentTypesJson" checked={selectedFields.documentTypesJson} onCheckedChange={(checked) => handleFieldSelection("documentTypesJson", !!checked)} />
                            <Label htmlFor="documentTypesJson">文件类型</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="notes" checked={selectedFields.notes} onCheckedChange={(checked) => handleFieldSelection("notes", !!checked)} />
                            <Label htmlFor="notes">备注</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="createdAt" checked={selectedFields.createdAt} onCheckedChange={(checked) => handleFieldSelection("createdAt", !!checked)} />
                            <Label htmlFor="createdAt">创建时间</Label>
                        </div>
                    </>
                );

            case "users":
                return (
                    <>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="userId" checked={selectedFields.userId} onCheckedChange={(checked) => handleFieldSelection("userId", !!checked)} />
                            <Label htmlFor="userId">用户ID</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="username" checked={selectedFields.username} onCheckedChange={(checked) => handleFieldSelection("username", !!checked)} />
                            <Label htmlFor="username">用户名</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="userName" checked={selectedFields.userName} onCheckedChange={(checked) => handleFieldSelection("userName", !!checked)} />
                            <Label htmlFor="userName">姓名</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="userRole" checked={selectedFields.userRole} onCheckedChange={(checked) => handleFieldSelection("userRole", !!checked)} />
                            <Label htmlFor="userRole">角色</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="userPhone" checked={selectedFields.userPhone} onCheckedChange={(checked) => handleFieldSelection("userPhone", !!checked)} />
                            <Label htmlFor="userPhone">电话</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="isGovUser" checked={selectedFields.isGovUser} onCheckedChange={(checked) => handleFieldSelection("isGovUser", !!checked)} />
                            <Label htmlFor="isGovUser">政府用户</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="billingType" checked={selectedFields.billingType} onCheckedChange={(checked) => handleFieldSelection("billingType", !!checked)} />
                            <Label htmlFor="billingType">计费类型</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="contractStartDate" checked={selectedFields.contractStartDate} onCheckedChange={(checked) => handleFieldSelection("contractStartDate", !!checked)} />
                            <Label htmlFor="contractStartDate">合同开始日期</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="contractEndDate" checked={selectedFields.contractEndDate} onCheckedChange={(checked) => handleFieldSelection("contractEndDate", !!checked)} />
                            <Label htmlFor="contractEndDate">合同结束日期</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="userCreatedAt" checked={selectedFields.userCreatedAt} onCheckedChange={(checked) => handleFieldSelection("userCreatedAt", !!checked)} />
                            <Label htmlFor="userCreatedAt">创建时间</Label>
                        </div>
                    </>
                );

            case "staff":
                return (
                    <>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="staffId" checked={selectedFields.staffId} onCheckedChange={(checked) => handleFieldSelection("staffId", !!checked)} />
                            <Label htmlFor="staffId">员工ID</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="staffName" checked={selectedFields.staffName} onCheckedChange={(checked) => handleFieldSelection("staffName", !!checked)} />
                            <Label htmlFor="staffName">姓名</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="staffPhone" checked={selectedFields.staffPhone} onCheckedChange={(checked) => handleFieldSelection("staffPhone", !!checked)} />
                            <Label htmlFor="staffPhone">电话</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="idCard" checked={selectedFields.idCard} onCheckedChange={(checked) => handleFieldSelection("idCard", !!checked)} />
                            <Label htmlFor="idCard">身份证号</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="position" checked={selectedFields.position} onCheckedChange={(checked) => handleFieldSelection("position", !!checked)} />
                            <Label htmlFor="position">职位</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="staffStatus" checked={selectedFields.staffStatus} onCheckedChange={(checked) => handleFieldSelection("staffStatus", !!checked)} />
                            <Label htmlFor="staffStatus">状态</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="isAvailable" checked={selectedFields.isAvailable} onCheckedChange={(checked) => handleFieldSelection("isAvailable", !!checked)} />
                            <Label htmlFor="isAvailable">是否可用</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="staffCreatedAt" checked={selectedFields.staffCreatedAt} onCheckedChange={(checked) => handleFieldSelection("staffCreatedAt", !!checked)} />
                            <Label htmlFor="staffCreatedAt">创建时间</Label>
                        </div>
                    </>
                );

            case "vehicles":
                return (
                    <>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="vehicleId" checked={selectedFields.vehicleId} onCheckedChange={(checked) => handleFieldSelection("vehicleId", !!checked)} />
                            <Label htmlFor="vehicleId">车辆ID</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="plateNumber" checked={selectedFields.plateNumber} onCheckedChange={(checked) => handleFieldSelection("plateNumber", !!checked)} />
                            <Label htmlFor="plateNumber">车牌号</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="model" checked={selectedFields.model} onCheckedChange={(checked) => handleFieldSelection("model", !!checked)} />
                            <Label htmlFor="model">车型</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="vehicleType" checked={selectedFields.vehicleType} onCheckedChange={(checked) => handleFieldSelection("vehicleType", !!checked)} />
                            <Label htmlFor="vehicleType">车辆类型</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="length" checked={selectedFields.length} onCheckedChange={(checked) => handleFieldSelection("length", !!checked)} />
                            <Label htmlFor="length">车长</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="vehicleIsAvailable" checked={selectedFields.vehicleIsAvailable} onCheckedChange={(checked) => handleFieldSelection("vehicleIsAvailable", !!checked)} />
                            <Label htmlFor="vehicleIsAvailable">是否可用</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="vehicleCreatedAt" checked={selectedFields.vehicleCreatedAt} onCheckedChange={(checked) => handleFieldSelection("vehicleCreatedAt", !!checked)} />
                            <Label htmlFor="vehicleCreatedAt">创建时间</Label>
                        </div>
                    </>
                );

            case "waste-auctions":
                return (
                    <>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="auctionId" checked={selectedFields.auctionId} onCheckedChange={(checked) => handleFieldSelection("auctionId", !!checked)} />
                            <Label htmlFor="auctionId">竞价ID</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="auctionTitle" checked={selectedFields.auctionTitle} onCheckedChange={(checked) => handleFieldSelection("auctionTitle", !!checked)} />
                            <Label htmlFor="auctionTitle">竞价标题</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="batchNumber" checked={selectedFields.batchNumber} onCheckedChange={(checked) => handleFieldSelection("batchNumber", !!checked)} />
                            <Label htmlFor="batchNumber">批次号</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="startTime" checked={selectedFields.startTime} onCheckedChange={(checked) => handleFieldSelection("startTime", !!checked)} />
                            <Label htmlFor="startTime">开始时间</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="endTime" checked={selectedFields.endTime} onCheckedChange={(checked) => handleFieldSelection("endTime", !!checked)} />
                            <Label htmlFor="endTime">结束时间</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="basePrice" checked={selectedFields.basePrice} onCheckedChange={(checked) => handleFieldSelection("basePrice", !!checked)} />
                            <Label htmlFor="basePrice">起拍价</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="reservePrice" checked={selectedFields.reservePrice} onCheckedChange={(checked) => handleFieldSelection("reservePrice", !!checked)} />
                            <Label htmlFor="reservePrice">保留价</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="auctionStatus" checked={selectedFields.auctionStatus} onCheckedChange={(checked) => handleFieldSelection("auctionStatus", !!checked)} />
                            <Label htmlFor="auctionStatus">状态</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="bidCount" checked={selectedFields.bidCount} onCheckedChange={(checked) => handleFieldSelection("bidCount", !!checked)} />
                            <Label htmlFor="bidCount">出价次数</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="highestBid" checked={selectedFields.highestBid} onCheckedChange={(checked) => handleFieldSelection("highestBid", !!checked)} />
                            <Label htmlFor="highestBid">最高出价</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="winnerInfo" checked={selectedFields.winnerInfo} onCheckedChange={(checked) => handleFieldSelection("winnerInfo", !!checked)} />
                            <Label htmlFor="winnerInfo">中标信息</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="auctionCreatedAt" checked={selectedFields.auctionCreatedAt} onCheckedChange={(checked) => handleFieldSelection("auctionCreatedAt", !!checked)} />
                            <Label htmlFor="auctionCreatedAt">创建时间</Label>
                        </div>
                    </>
                );

            case "waste-bids":
                return (
                    <>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="bidId" checked={selectedFields.bidId} onCheckedChange={(checked) => handleFieldSelection("bidId", !!checked)} />
                            <Label htmlFor="bidId">出价ID</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="bidAuctionTitle" checked={selectedFields.bidAuctionTitle} onCheckedChange={(checked) => handleFieldSelection("bidAuctionTitle", !!checked)} />
                            <Label htmlFor="bidAuctionTitle">竞价标题</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="bidBatchNumber" checked={selectedFields.bidBatchNumber} onCheckedChange={(checked) => handleFieldSelection("bidBatchNumber", !!checked)} />
                            <Label htmlFor="bidBatchNumber">批次号</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="bidder" checked={selectedFields.bidder} onCheckedChange={(checked) => handleFieldSelection("bidder", !!checked)} />
                            <Label htmlFor="bidder">出价人</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="bidAmount" checked={selectedFields.bidAmount} onCheckedChange={(checked) => handleFieldSelection("bidAmount", !!checked)} />
                            <Label htmlFor="bidAmount">出价金额</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="bidTime" checked={selectedFields.bidTime} onCheckedChange={(checked) => handleFieldSelection("bidTime", !!checked)} />
                            <Label htmlFor="bidTime">出价时间</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="bidStatus" checked={selectedFields.bidStatus} onCheckedChange={(checked) => handleFieldSelection("bidStatus", !!checked)} />
                            <Label htmlFor="bidStatus">出价状态</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="bidNotes" checked={selectedFields.bidNotes} onCheckedChange={(checked) => handleFieldSelection("bidNotes", !!checked)} />
                            <Label htmlFor="bidNotes">备注</Label>
                        </div>
                    </>
                );

            default:
                return null;
        }
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

    // 通用导出函数
    const exportToExcel = () => {
        setIsExporting(true);

        try {
            let exportData: Record<string, any>[] = [];
            let sheetName = "";
            let fileName = "";

            switch (selectedExportType) {
                case "appointments":
                    exportData = appointments.map((appointment) => {
                        const row: Record<string, any> = {};
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
                    sheetName = "预约数据";
                    fileName = "预约数据";
                    break;

                case "users":
                    exportData = users.map((user) => {
                        const row: Record<string, any> = {};
                        if (selectedFields.userId) row["用户ID"] = user.id;
                        if (selectedFields.username) row["用户名"] = user.username;
                        if (selectedFields.userName) row["姓名"] = user.name;
                        if (selectedFields.userRole) row["角色"] = getRoleText(user.role);
                        if (selectedFields.userPhone) row["电话"] = user.phone || "";
                        if (selectedFields.isGovUser) row["政府用户"] = user.isGovUser ? "是" : "否";
                        if (selectedFields.billingType) row["计费类型"] = getBillingTypeText(user.billingType);
                        if (selectedFields.contractStartDate) row["合同开始日期"] = user.contractStartDate || "";
                        if (selectedFields.contractEndDate) row["合同结束日期"] = user.contractEndDate || "";
                        if (selectedFields.userCreatedAt) row["创建时间"] = formatDate(user.createdAt);
                        return row;
                    });
                    sheetName = "用户数据";
                    fileName = "用户数据";
                    break;

                case "staff":
                    exportData = staffList.map((staff) => {
                        const row: Record<string, any> = {};
                        if (selectedFields.staffId) row["员工ID"] = staff.id;
                        if (selectedFields.staffName) row["姓名"] = staff.name;
                        if (selectedFields.staffPhone) row["电话"] = staff.phone;
                        if (selectedFields.idCard) row["身份证号"] = staff.idCard;
                        if (selectedFields.position) row["职位"] = staff.position;
                        if (selectedFields.staffStatus) row["状态"] = getStaffStatusText(staff.status);
                        if (selectedFields.isAvailable) row["是否可用"] = staff.isAvailable ? "是" : "否";
                        if (selectedFields.staffCreatedAt) row["创建时间"] = formatDate(staff.createdAt);
                        return row;
                    });
                    sheetName = "员工数据";
                    fileName = "员工数据";
                    break;

                case "vehicles":
                    exportData = vehicles.map((vehicle) => {
                        const row: Record<string, any> = {};
                        if (selectedFields.vehicleId) row["车辆ID"] = vehicle.id;
                        if (selectedFields.plateNumber) row["车牌号"] = vehicle.plateNumber;
                        if (selectedFields.model) row["车型"] = vehicle.model;
                        if (selectedFields.vehicleType) row["车辆类型"] = getVehicleTypeText(vehicle.vehicleType);
                        if (selectedFields.length) row["车长(米)"] = vehicle.length;
                        if (selectedFields.vehicleIsAvailable) row["是否可用"] = vehicle.isAvailable ? "是" : "否";
                        if (selectedFields.vehicleCreatedAt) row["创建时间"] = formatDate(vehicle.createdAt);
                        return row;
                    });
                    sheetName = "车辆数据";
                    fileName = "车辆数据";
                    break;

                case "waste-auctions":
                    exportData = wasteAuctions.map((auction) => {
                        const row: Record<string, any> = {};
                        if (selectedFields.auctionId) row["竞价ID"] = auction.id;
                        if (selectedFields.auctionTitle) row["竞价标题"] = auction.title;
                        if (selectedFields.batchNumber) row["批次号"] = auction.batch?.batchNumber || "";
                        if (selectedFields.startTime) row["开始时间"] = formatDate(auction.startTime);
                        if (selectedFields.endTime) row["结束时间"] = formatDate(auction.endTime);
                        if (selectedFields.basePrice) row["起拍价"] = auction.basePrice;
                        if (selectedFields.reservePrice) row["保留价"] = auction.reservePrice || "";
                        if (selectedFields.auctionStatus) row["状态"] = getAuctionStatusText(auction.status);
                        if (selectedFields.bidCount) row["出价次数"] = auction.bidCount;
                        if (selectedFields.highestBid) row["最高出价"] = auction.highestBid;
                        if (selectedFields.winnerInfo) row["中标信息"] = auction.winnerId ? `用户${auction.winnerId} - ¥${auction.winningBid}` : "";
                        if (selectedFields.auctionCreatedAt) row["创建时间"] = formatDate(auction.createdAt);
                        return row;
                    });
                    sheetName = "尾料竞价";
                    fileName = "尾料竞价";
                    break;

                case "waste-bids":
                    exportData = wasteBids.map((bid) => {
                        const row: Record<string, any> = {};
                        if (selectedFields.bidId) row["出价ID"] = bid.id;
                        if (selectedFields.bidAuctionTitle) row["竞价标题"] = bid.auctionTitle || "";
                        if (selectedFields.bidBatchNumber) row["批次号"] = bid.batchNumber || "";
                        if (selectedFields.bidder) row["出价人"] = bid.bidder?.name || "";
                        if (selectedFields.bidAmount) row["出价金额"] = bid.bidAmount;
                        if (selectedFields.bidTime) row["出价时间"] = formatDate(bid.bidTime);
                        if (selectedFields.bidStatus) row["出价状态"] = getBidStatusText(bid.status);
                        if (selectedFields.bidNotes) row["备注"] = bid.notes || "";
                        return row;
                    });
                    sheetName = "出价记录";
                    fileName = "出价记录";
                    break;

                default:
                    throw new Error("未知的导出类型");
            }

            // 创建工作簿和工作表
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(exportData);

            // 添加工作表到工作簿
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

            // 生成时间戳用于文件名
            const timestamp = new Date().toISOString().replace(/:/g, "-").replace(/\./g, "-").substring(0, 19);

            // 导出Excel文件
            XLSX.writeFile(workbook, `${fileName}_${timestamp}.xlsx`);
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

    // 获取用户角色文本
    const getRoleText = (role: string): string => {
        const roleMap: Record<string, string> = {
            admin: "管理员",
            user: "普通用户",
            waste_disposal_merchant: "废料处理商",
        };
        return roleMap[role] || role;
    };

    // 获取计费类型文本
    const getBillingTypeText = (billingType: string | undefined | null): string => {
        if (!billingType) return "";
        const billingMap: Record<string, string> = {
            yearly: "年费制",
            per_service: "按次计费",
        };
        return billingMap[billingType] || billingType;
    };

    // 获取员工状态文本
    const getStaffStatusText = (status: string): string => {
        const statusMap: Record<string, string> = {
            active: "在职",
            inactive: "离职",
            on_leave: "请假",
        };
        return statusMap[status] || status;
    };

    // 获取车辆类型文本
    const getVehicleTypeText = (type: string): string => {
        const typeMap: Record<string, string> = {
            electric: "电动车",
            fuel: "燃油车",
        };
        return typeMap[type] || type;
    };

    // 获取竞价状态文本
    const getAuctionStatusText = (status: string): string => {
        const statusMap: Record<string, string> = {
            pending: "待开始",
            active: "进行中",
            ended: "已结束",
            cancelled: "已取消",
        };
        return statusMap[status] || status;
    };

    // 获取出价状态文本
    const getBidStatusText = (status: string): string => {
        const statusMap: Record<string, string> = {
            active: "有效",
            outbid: "被超出",
            winning: "中标",
            cancelled: "已取消",
        };
        return statusMap[status] || status;
    };

    // 数据库备份功能
    const backupDatabase = async () => {
        setIsBackingUp(true);
        try {
            const response = await fetch('/api/database/backup');

            if (!response.ok) {
                throw new Error('备份失败');
            }

            // 获取文件内容
            const blob = await response.blob();

            // 生成时间戳用于文件名
            const timestamp = new Date().toISOString().replace(/:/g, "-").replace(/\./g, "-").substring(0, 19);
            const fileName = `appointment_dashboard_backup_${timestamp}.sqlite`;

            // 创建下载链接
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = fileName;

            // 触发下载
            document.body.appendChild(a);
            a.click();

            // 清理
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            console.error('数据库备份失败:', error);
            alert('数据库备份失败，请稍后重试');
        } finally {
            setIsBackingUp(false);
        }
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
            {/* 数据库备份功能 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        数据库备份
                    </CardTitle>
                    <CardDescription>
                        备份整个数据库文件，包含所有系统数据
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                        此功能将生成完整的数据库备份文件，包含所有预约、用户、员工、车辆和竞价数据。
                        建议定期备份以确保数据安全。
                    </p>
                </CardContent>
                <CardFooter>
                    <Button
                        onClick={backupDatabase}
                        disabled={isBackingUp}
                        className="w-full"
                        variant="outline"
                    >
                        {isBackingUp ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                正在备份数据库...
                            </>
                        ) : (
                            <>
                                <Database className="mr-2 h-4 w-4" />
                                备份数据库
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>

            <RadioGroup
                value={selectedExportType}
                onValueChange={(value) => setSelectedExportType(value as ExportType)}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
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
                    />
                    <Label
                        htmlFor="users"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                        <FileSpreadsheet className="mb-3 h-6 w-6" />
                        <span className="text-sm font-medium">用户数据</span>
                    </Label>
                </div>

                <div>
                    <RadioGroupItem
                        value="staff"
                        id="staff"
                        className="peer sr-only"
                    />
                    <Label
                        htmlFor="staff"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                        <FileSpreadsheet className="mb-3 h-6 w-6" />
                        <span className="text-sm font-medium">员工数据</span>
                    </Label>
                </div>

                <div>
                    <RadioGroupItem
                        value="vehicles"
                        id="vehicles"
                        className="peer sr-only"
                    />
                    <Label
                        htmlFor="vehicles"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                        <FileSpreadsheet className="mb-3 h-6 w-6" />
                        <span className="text-sm font-medium">车辆数据</span>
                    </Label>
                </div>

                <div>
                    <RadioGroupItem
                        value="waste-auctions"
                        id="waste-auctions"
                        className="peer sr-only"
                    />
                    <Label
                        htmlFor="waste-auctions"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                        <FileSpreadsheet className="mb-3 h-6 w-6" />
                        <span className="text-sm font-medium">尾料竞价</span>
                    </Label>
                </div>

                <div>
                    <RadioGroupItem
                        value="waste-bids"
                        id="waste-bids"
                        className="peer sr-only"
                    />
                    <Label
                        htmlFor="waste-bids"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                        <FileSpreadsheet className="mb-3 h-6 w-6" />
                        <span className="text-sm font-medium">出价记录</span>
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
                <Card>
                    <CardHeader>
                        <CardTitle>{typeInfo.title}</CardTitle>
                        <CardDescription>{typeInfo.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {renderFieldSelectors()}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                            onClick={exportToExcel}
                            disabled={isLoading || isExporting || currentDataLength === 0}
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
                                    导出到Excel{currentDataLength > 0 ? ` (${currentDataLength}条记录)` : ''}
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </div>
    );
} 