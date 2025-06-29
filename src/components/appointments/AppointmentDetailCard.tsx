"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { type Appointment } from "@/lib/stores/appointments";
import { documentTypes, documentTypesByCategory, formatDateTime, getStatusData } from "@/lib/utils/appointments/helpers";
import { Calendar, CheckCircle, Clock, FileText, LayoutList, MapPin, Phone, RotateCcw, User, XCircle, Users, Car, AlertCircle, Building, Mail, Info, Bookmark, ShieldCheck } from "lucide-react";
import { useStaffStore, useVehicleStore } from "@/lib/stores";
import { useEffect } from "react";

export function AppointmentDetailCard({ appointment }: { appointment: Appointment }) {
    const statusData = getStatusData(appointment.status);
    const documentType = documentTypes.find(t => t.value === appointment.documentType)?.label || appointment.documentType;

    const { staffList, fetchStaff } = useStaffStore();
    const { vehicles, fetchVehicles } = useVehicleStore();

    // Fetch staff and vehicles data when component mounts
    useEffect(() => {
        if (appointment.assignedStaff?.length || appointment.assignedVehicles?.length) {
            fetchStaff();
            fetchVehicles();
        }
    }, [appointment.assignedStaff, appointment.assignedVehicles, fetchStaff, fetchVehicles]);

    // Get assigned staff names and info
    const assignedStaffInfo = appointment.assignedStaff?.map(staffId => {
        const staff = staffList.find(s => s.id === staffId);
        if (!staff) return null;
        return {
            name: staff.name,
            idCard: staff.idCard,
        };
    }).filter((staff): staff is { name: string; idCard: string; } => staff !== null);

    // Get assigned vehicles info
    const assignedVehiclesInfo = appointment.assignedVehicles?.map(vehicleId => {
        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (!vehicle) return null;
        return {
            plateNumber: vehicle.plateNumber,
            model: vehicle.model
        };
    }).filter((vehicle): vehicle is { plateNumber: string; model: string; } => vehicle !== null);

    // 解析documentTypesJson数据
    const getDocumentTypesInfo = () => {
        if (!appointment.documentTypesJson) {
            return { docTypes: null, hasPaper: false, hasElectronic: false, hasOther: false };
        }

        try {
            const docTypes = JSON.parse(appointment.documentTypesJson);

            // 新数据结构：items 是对象，需要检查对象中是否有键且值大于0
            const hasPaper = docTypes.paper?.items && Object.keys(docTypes.paper.items).length > 0 &&
                Object.values(docTypes.paper.items).some((count: any) => count > 0);
            const hasElectronic = docTypes.electronic?.items && Object.keys(docTypes.electronic.items).length > 0 &&
                Object.values(docTypes.electronic.items).some((count: any) => count > 0);
            const hasOther = docTypes.other?.items && Object.keys(docTypes.other.items).length > 0 &&
                Object.values(docTypes.other.items).some((count: any) => count > 0);

            return {
                docTypes,
                hasPaper,
                hasElectronic,
                hasOther
            };
        } catch (error) {
            console.error("解析文档类型数据出错:", error);
            return { docTypes: null, hasPaper: false, hasElectronic: false, hasOther: false };
        }
    };

    const { docTypes, hasPaper, hasElectronic, hasOther } = getDocumentTypesInfo();

    // 获取文档类型的显示名称
    const getTypeDisplayName = (category: string, typeValue: string) => {
        const typeObj = documentTypesByCategory[category as keyof typeof documentTypesByCategory]?.find(t => t.value === typeValue);
        return typeObj?.label || typeValue;
    };

    // Map icon names to components
    const getIconComponent = (iconName: string) => {
        switch (iconName) {
            case "clock":
                return <Clock size={16} className="text-yellow-600" />;
            case "check-circle":
                return <CheckCircle size={16} className="text-blue-600" />;
            case "rotate-ccw":
                return <RotateCcw size={16} className="text-purple-600" />;
            case "x-circle":
                return <XCircle size={16} className="text-red-600" />;
            default:
                return <Clock size={16} className="text-gray-600" />;
        }
    };

    return (
        <div className="w-full max-w-full mx-auto">
            {/* 主要信息内容 - 只保留左侧部分 */}
            <div className="relative">
                {/* 信息内容区域 - 使用卡片式设计 */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 relative">
                    {/* 标题区域 */}
                    <div className="flex justify-between items-center p-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                        <div className="flex items-center gap-2">
                            <Bookmark className="text-blue-600" size={20} />
                            <h1 className="text-xl font-bold text-gray-800">
                                {appointment.appointmentId || `APT-${appointment.id}`}
                            </h1>
                        </div>
                        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusData.color} shadow-sm`}>
                            {getIconComponent(statusData.icon)}
                            <span>{statusData.label}</span>
                        </div>
                    </div>

                    <div className="p-3">
                        {/* 基本信息组 */}
                        <div className="mb-3">
                            <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-1.5">
                                <Info size={14} className="text-blue-500" />
                                <span>预约基本信息</span>
                            </h3>
                            <div className="grid grid-cols-1 gap-2 pl-1">
                                <div className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded-md transition-colors group">
                                    <Calendar size={18} className="text-blue-500 group-hover:scale-110 transition-transform" />
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-500">预约时间</span>
                                        <span className="font-medium">{formatDateTime(appointment.dateTime)}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded-md transition-colors group">
                                    <User size={18} className="text-blue-500 group-hover:scale-110 transition-transform" />
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-500">联系人</span>
                                        <span className="font-medium">{appointment.contactName}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded-md transition-colors group">
                                    <Phone size={18} className="text-blue-500 group-hover:scale-110 transition-transform" />
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-500">联系电话</span>
                                        <span className="font-medium">{appointment.contactPhone}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded-md transition-colors group">
                                    <MapPin size={18} className="text-blue-500 group-hover:scale-110 transition-transform" />
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-500">联系地址</span>
                                        <span className="font-medium">{appointment.contactAddress}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 文件信息组 */}
                        <div className="mb-3">
                            <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-1.5">
                                <ShieldCheck size={14} className="text-green-500" />
                                <span>文件与数量信息</span>
                            </h3>
                            <div className="bg-gray-50 p-2 rounded-md">
                                {/* 显示新的文件类型信息 */}
                                {(hasPaper || hasElectronic || hasOther) && docTypes ? (
                                    <div className="grid gap-2">
                                        {hasPaper && (
                                            <div className="flex items-start gap-2 bg-white p-1.5 rounded-md shadow-sm">
                                                <FileText size={16} className="text-amber-500 mt-0.5" />
                                                <div className="flex flex-col">
                                                    <span className="font-medium">纸介质：<Badge variant="outline" className="ml-1 bg-amber-50">
                                                        {Object.values(docTypes.paper.items).reduce((sum: number, count: any) => sum + count, 0)}个
                                                    </Badge></span>
                                                    <span className="text-sm text-gray-600">
                                                        {Object.entries(docTypes.paper.items)
                                                            .filter(([_, count]) => count > 0)
                                                            .map(([type, count]) => `${getTypeDisplayName('paper', type)}(${count})`)
                                                            .join('、')}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {hasElectronic && (
                                            <div className="flex items-start gap-2 bg-white p-1.5 rounded-md shadow-sm">
                                                <FileText size={16} className="text-blue-500 mt-0.5" />
                                                <div className="flex flex-col">
                                                    <span className="font-medium">磁介质：<Badge variant="outline" className="ml-1 bg-blue-50">
                                                        {Object.values(docTypes.electronic.items).reduce((sum: number, count: any) => sum + count, 0)}个
                                                    </Badge></span>
                                                    <span className="text-sm text-gray-600">
                                                        {Object.entries(docTypes.electronic.items)
                                                            .filter(([_, count]) => count > 0)
                                                            .map(([type, count]) => `${getTypeDisplayName('magnetic', type)}(${count})`)
                                                            .join('、')}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {hasOther && (
                                            <div className="flex items-start gap-2 bg-white p-1.5 rounded-md shadow-sm">
                                                <FileText size={16} className="text-purple-500 mt-0.5" />
                                                <div className="flex flex-col">
                                                    <span className="font-medium">其他介质：<Badge variant="outline" className="ml-1 bg-purple-50">
                                                        {Object.values(docTypes.other.items).reduce((sum: number, count: any) => sum + count, 0)}个
                                                    </Badge></span>
                                                    <span className="text-sm text-gray-600">
                                                        {Object.entries(docTypes.other.items)
                                                            .filter(([_, count]) => count > 0)
                                                            .map(([type, count]) => `${getTypeDisplayName('other', type)}(${count})`)
                                                            .join('、')}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    // 向后兼容，显示旧的文件类型信息
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 bg-white p-1.5 rounded-md shadow-sm">
                                            <FileText size={16} className="text-gray-500" />
                                            <span>文件类型：<span className="font-medium">{documentType}</span></span>
                                        </div>
                                        <div className="flex items-center justify-between bg-white p-1.5 rounded-md shadow-sm">
                                            <div className="flex items-center gap-2">
                                                <LayoutList size={16} className="text-gray-500" />
                                                <span>文件数量：</span>
                                            </div>
                                            <Badge className="bg-blue-600">{appointment.documentCount}个</Badge>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 处理信息组 */}
                        {((appointment.assignedStaff && appointment.assignedStaff.length > 0) || (appointment.assignedVehicles && appointment.assignedVehicles.length > 0)) && (
                            <div className="mb-3">
                                <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-1.5">
                                    <Users className="h-4 w-4" /> 处理人员与车辆
                                </h3>
                                <div className="space-y-2">
                                    {/* Show assigned staff if available */}
                                    {appointment.assignedStaff && assignedStaffInfo && assignedStaffInfo.length > 0 && (
                                        <div className="bg-blue-50 p-2 rounded-md">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Users className="h-4 w-4 text-blue-500" />
                                                <span className="text-sm font-medium text-blue-700">指派人员</span>
                                            </div>
                                            <div className="bg-white p-1.5 rounded-md text-sm shadow-sm space-y-1">
                                                {assignedStaffInfo.map((staff, index) => (
                                                    <div key={index} className="flex items-center justify-between">
                                                        <span className="font-medium">{staff.name}</span>
                                                        <span className="text-gray-500 text-xs">身份证: {staff.idCard}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Show assigned vehicles if available */}
                                    {appointment.assignedVehicles && assignedVehiclesInfo && assignedVehiclesInfo.length > 0 && (
                                        <div className="bg-blue-50 p-2 rounded-md">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Car className="h-4 w-4 text-blue-500" />
                                                <span className="text-sm font-medium text-blue-700">派遣车辆</span>
                                            </div>
                                            <div className="bg-white p-1.5 rounded-md text-sm shadow-sm">
                                                {assignedVehiclesInfo.map((vehicle, index) => (
                                                    <div key={index} className="flex items-center justify-between">
                                                        <span className="font-medium">{vehicle.plateNumber} ({vehicle.model})</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 备注信息组 */}
                        {(appointment.notes || appointment.processingNotes || appointment.estimatedCompletionTime) && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-1.5">
                                    <Info size={14} className="text-gray-500" />
                                    <span>备注与补充信息</span>
                                </h3>
                                <div className="space-y-2 pl-1">
                                    {appointment.estimatedCompletionTime && (
                                        <div className="flex items-center gap-2 p-1.5 bg-yellow-50 rounded-md">
                                            <Clock size={16} className="text-yellow-600" />
                                            <div className="flex flex-col">
                                                <span className="text-xs text-gray-500">预计上门时间</span>
                                                <span className="font-medium">{formatDateTime(appointment.estimatedCompletionTime)}</span>
                                            </div>
                                        </div>
                                    )}

                                    {appointment.notes && (
                                        <div className="flex items-start gap-2 p-1.5 bg-gray-50 rounded-md">
                                            <span className="text-gray-500 mt-0.5">备注：</span>
                                            <p className="text-gray-700">{appointment.notes}</p>
                                        </div>
                                    )}

                                    {appointment.processingNotes && (
                                        <div className="flex items-start gap-2 p-1.5 bg-gray-50 rounded-md">
                                            <span className="text-gray-500 mt-0.5">处理备注：</span>
                                            <p className="text-gray-700">{appointment.processingNotes}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
} 