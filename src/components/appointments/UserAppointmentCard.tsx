"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { type Appointment } from "@/lib/stores/appointments";
import { documentTypes, documentTypesByCategory, formatDateTime, getStatusData } from "@/lib/utils/appointments/helpers";
import { Calendar, CheckCircle, Clock, FileText, LayoutList, MapPin, Phone, RotateCcw, User, XCircle, Users, Car, AlertCircle, Building, Mail, Info, Bookmark, ShieldCheck } from "lucide-react";
import { useStaffStore, useVehicleStore } from "@/lib/stores";
import { useEffect } from "react";
import { UserAppointmentActions } from "./UserAppointmentActions";
import { useSystemInfoStore } from "@/lib/stores/info";

export function UserAppointmentCard({ appointment }: { appointment: Appointment }) {
    const statusData = getStatusData(appointment.status);
    const documentType = documentTypes.find(t => t.value === appointment.documentType)?.label || appointment.documentType;

    const { staffList, fetchStaff } = useStaffStore();
    const { vehicles, fetchVehicles } = useVehicleStore();
    const { info, fetchInfo, isLoading, error } = useSystemInfoStore();

    // 获取员工和车辆数据
    useEffect(() => {
        if (appointment.assignedStaff?.length || appointment.assignedVehicles?.length) {
            fetchStaff();
            fetchVehicles();
        }
    }, [appointment.assignedStaff, appointment.assignedVehicles, fetchStaff, fetchVehicles]);

    // 获取系统信息
    useEffect(() => {
        console.log("UserAppointmentCard: 开始获取系统信息");
        fetchInfo();
    }, [fetchInfo]);

    // 调试系统信息状态
    useEffect(() => {
        console.log("UserAppointmentCard: 系统信息状态变化", { info });
    }, [info]);

    // 获取分配的员工信息
    const assignedStaffInfo = appointment.assignedStaff?.map(staffId => {
        const staff = staffList.find(s => s.id === String(staffId));
        if (!staff) return null;
        return {
            name: staff.name,
            idCard: staff.idCard,
        };
    }).filter((staff): staff is { name: string; idCard: string; } => staff !== null);

    // 获取分配的车辆信息
    const assignedVehiclesInfo = appointment.assignedVehicles?.map(vehicleId => {
        const vehicle = vehicles.find(v => v.id === String(vehicleId));
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

            // 新数据结构：items 是对象，每个值是 { count: number, customName?: string }
            const hasPaper = docTypes.paper?.items && Object.keys(docTypes.paper.items).length > 0 &&
                Object.values(docTypes.paper.items).some((item: any) => (item?.count || item || 0) > 0);
            const hasElectronic = docTypes.electronic?.items && Object.keys(docTypes.electronic.items).length > 0 &&
                Object.values(docTypes.electronic.items).some((item: any) => (item?.count || item || 0) > 0);
            const hasOther = docTypes.other?.items && Object.keys(docTypes.other.items).length > 0 &&
                Object.values(docTypes.other.items).some((item: any) => (item?.count || item || 0) > 0);

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

    // 获取文档类型的显示名称，支持自定义名称
    const getTypeDisplayName = (category: string, typeValue: string, customName?: string) => {
        // 如果有自定义名称，直接使用
        if (customName) {
            return customName;
        }

        // 否则查找预定义的类型名称
        const typeObj = documentTypesByCategory[category as keyof typeof documentTypesByCategory]?.find(t => t.value === typeValue);
        return typeObj?.label || typeValue;
    };

    // 根据图标名称返回对应的组件
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-[95%] mx-auto">
            {/* 主要信息列 */}
            <div className="relative">
                {/* 信息内容区域 - 使用卡片式设计 */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 relative">
                    {/* 标题区域 - 原来的CardHeader内容 */}
                    <div className="flex justify-between items-center p-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                        <div className="flex items-center gap-2">
                            <Bookmark className="text-blue-600" size={20} />
                            <h1 className="text-xl font-bold text-gray-800">
                                我的预约详情
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
                            <div className="grid grid-cols-2 gap-2 pl-1">
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
                                {/* 显示文件类型信息 */}
                                {(hasPaper || hasElectronic || hasOther) && docTypes ? (
                                    <div className="grid gap-2">
                                        {hasPaper && (
                                            <div className="flex items-start gap-2 bg-white p-1.5 rounded-md shadow-sm">
                                                <FileText size={16} className="text-amber-500 mt-0.5" />
                                                <div className="flex flex-col">
                                                    <span className="font-medium">纸介质：<Badge variant="outline" className="ml-1 bg-amber-50">
                                                        {Object.values(docTypes.paper.items).reduce((sum: number, item: any) => sum + (item?.count || item || 0), 0)}个
                                                    </Badge></span>
                                                    <span className="text-sm text-gray-600">
                                                        {Object.entries(docTypes.paper.items)
                                                            .filter(([_, item]) => (typeof item === 'number' ? item > 0 : ((item as any)?.count || 0) > 0))
                                                            .map(([type, item]) => {
                                                                const count = typeof item === 'number' ? item : ((item as any)?.count || 0);
                                                                const customName = typeof item === 'object' ? (item as any)?.customName : undefined;
                                                                return `${getTypeDisplayName('paper', type, customName)}(${count})`;
                                                            })
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
                                                        {Object.values(docTypes.electronic.items).reduce((sum: number, item: any) => sum + (item?.count || item || 0), 0)}个
                                                    </Badge></span>
                                                    <span className="text-sm text-gray-600">
                                                        {Object.entries(docTypes.electronic.items)
                                                            .filter(([_, item]) => (typeof item === 'number' ? item > 0 : ((item as any)?.count || 0) > 0))
                                                            .map(([type, item]) => {
                                                                const count = typeof item === 'number' ? item : ((item as any)?.count || 0);
                                                                const customName = typeof item === 'object' ? (item as any)?.customName : undefined;
                                                                return `${getTypeDisplayName('magnetic', type, customName)}(${count})`;
                                                            })
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
                                                        {Object.values(docTypes.other.items).reduce((sum: number, item: any) => sum + (item?.count || item || 0), 0)}个
                                                    </Badge></span>
                                                    <span className="text-sm text-gray-600">
                                                        {Object.entries(docTypes.other.items)
                                                            .filter(([_, item]) => (typeof item === 'number' ? item > 0 : ((item as any)?.count || 0) > 0))
                                                            .map(([type, item]) => {
                                                                const count = typeof item === 'number' ? item : ((item as any)?.count || 0);
                                                                const customName = typeof item === 'object' ? (item as any)?.customName : undefined;
                                                                return `${getTypeDisplayName('other', type, customName)}(${count})`;
                                                            })
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
                                    <Users size={14} className="text-indigo-500" />
                                    <span>处理人员与车辆</span>
                                </h3>
                                <div className="space-y-2">
                                    {/* 显示分配的员工 */}
                                    {appointment.assignedStaff && appointment.assignedStaff.length > 0 && assignedStaffInfo && (
                                        <div className="bg-indigo-50 p-2 rounded-md">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Users size={16} className="text-indigo-600" />
                                                <span className="font-medium">处理人员</span>
                                            </div>
                                            <div className="space-y-1 pl-1">
                                                {assignedStaffInfo.map((staff, index) => (
                                                    <div key={index} className="bg-white p-1.5 rounded-md text-sm flex items-center justify-between shadow-sm">
                                                        <span className="font-medium">{staff.name}</span>
                                                        <span className="text-xs text-gray-500 font-mono">{staff.idCard}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* 显示分配的车辆 */}
                                    {appointment.assignedVehicles && appointment.assignedVehicles.length > 0 && assignedVehiclesInfo && assignedVehiclesInfo.length > 0 && (
                                        <div className="bg-blue-50 p-2 rounded-md">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Car size={16} className="text-blue-600" />
                                                <span className="font-medium">派遣车辆</span>
                                                {assignedVehiclesInfo.length > 1 && (
                                                    <Badge variant="outline" className="ml-auto bg-blue-100 text-blue-800">
                                                        {assignedVehiclesInfo.length}辆
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="space-y-1 pl-1">
                                                {assignedVehiclesInfo.map((vehicle, index) => (
                                                    <div key={index} className="bg-white p-1.5 rounded-md text-sm flex items-center justify-between shadow-sm">
                                                        <span className="font-medium">{vehicle.plateNumber}</span>
                                                        <span className="text-xs text-gray-500">{vehicle.model}</span>
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

            {/* 右侧服务说明 */}
            <div className="flex flex-col h-full">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 h-full flex flex-col">
                    {/* 标题区域 - 保持与左侧一致的样式 */}
                    <div className="flex items-center p-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                        <AlertCircle size={16} className="text-amber-500 mr-2" />
                        <span className="font-medium text-gray-800">服务须知与公司信息</span>
                    </div>

                    <div className="p-3 flex flex-col flex-grow">
                        <div className="space-y-2 text-sm text-gray-700 mb-3">
                            <p className="font-medium text-gray-700 mb-1">重要事项：</p>
                            {isLoading ? (
                                <div className="text-gray-500">正在加载系统信息...</div>
                            ) : error ? (
                                <div className="text-red-500">加载系统信息失败: {error}</div>
                            ) : info?.notes ? (
                                <div className="max-h-[200px] overflow-y-auto pr-2 space-y-2">
                                    {info.notes.split('\n').map((note, index) => (
                                        <div key={index} className="flex gap-2">
                                            <span className="font-medium">{index + 1}.</span>
                                            <span>{note}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-gray-500">暂无系统信息</div>
                            )}
                        </div>

                        {/* 公司信息 */}
                        <div className="mt-auto pt-3 border-t border-gray-200">
                            <div className="font-medium text-gray-700 mb-1">公司信息</div>
                            {isLoading ? (
                                <div className="text-gray-500 text-xs">正在加载公司信息...</div>
                            ) : error ? (
                                <div className="text-red-500 text-xs">加载公司信息失败</div>
                            ) : info ? (
                                <div className="space-y-1.5 text-xs text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <Building size={14} className="text-gray-500" />
                                        <span>{info.company_name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin size={14} className="text-gray-500" />
                                        <span>地址：{info.company_address}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone size={14} className="text-gray-500" />
                                        <span>电话：{info.company_phone}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Mail size={14} className="text-gray-500" />
                                        <span>邮箱：{info.company_email}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-gray-500 text-xs">暂无公司信息</div>
                            )}
                        </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="mt-auto p-3 pt-2 border-t border-gray-100">
                        <div className="flex justify-end">
                            <UserAppointmentActions appointment={appointment} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 