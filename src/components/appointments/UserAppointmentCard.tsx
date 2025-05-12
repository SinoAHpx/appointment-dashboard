"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { type Appointment } from "@/lib/stores/appointments";
import { documentTypes, documentTypesByCategory, formatDateTime, getStatusData } from "@/lib/utils/appointments/helpers";
import { Calendar, CheckCircle, Clock, FileText, LayoutList, MapPin, Phone, RotateCcw, User, XCircle, Users, Car, AlertCircle, Building, Mail, Info, Bookmark, ShieldCheck } from "lucide-react";
import { useStaffStore, useVehicleStore } from "@/lib/stores";
import { useEffect } from "react";
import { UserAppointmentActions } from "./UserAppointmentActions";

export function UserAppointmentCard({ appointment }: { appointment: Appointment }) {
    const statusData = getStatusData(appointment.status);
    const documentType = documentTypes.find(t => t.value === appointment.documentType)?.label || appointment.documentType;

    const { staffList, fetchStaff } = useStaffStore();
    const { vehicles, fetchVehicles } = useVehicleStore();

    // Fetch staff and vehicles data when component mounts
    useEffect(() => {
        if (appointment.assignedStaff?.length || appointment.assignedVehicle) {
            fetchStaff();
            fetchVehicles();
        }
    }, [appointment.assignedStaff, appointment.assignedVehicle, fetchStaff, fetchVehicles]);

    // Get assigned staff names and info
    const assignedStaffInfo = appointment.assignedStaff?.map(staffId => {
        const staff = staffList.find(s => s.id === staffId);
        if (!staff) return null;
        return {
            name: staff.name,
            idCard: staff.idCard,
        };
    }).filter((staff): staff is { name: string; idCard: string; } => staff !== null);

    // Get assigned vehicle info
    const assignedVehicle = vehicles.find(v => v.id === appointment.assignedVehicle);
    const vehicleInfo = assignedVehicle ? `${assignedVehicle.plateNumber} (${assignedVehicle.model})` : '';

    // 解析documentTypesJson数据
    const getDocumentTypesInfo = () => {
        if (!appointment.documentTypesJson) {
            return { docTypes: null, hasPaper: false, hasElectronic: false, hasOther: false };
        }

        try {
            const docTypes = JSON.parse(appointment.documentTypesJson);
            const hasPaper = docTypes.paper?.items?.length > 0 && docTypes.paper?.count > 0;
            const hasElectronic = docTypes.electronic?.items?.length > 0 && docTypes.electronic?.count > 0;
            const hasOther = docTypes.other?.items?.length > 0 && docTypes.other?.count > 0;

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
                                                    <span className="font-medium">纸介质：<Badge variant="outline" className="ml-1 bg-amber-50">{docTypes.paper.count}个</Badge></span>
                                                    <span className="text-sm text-gray-600">
                                                        {docTypes.paper.items.map((item: string) => getTypeDisplayName('paper', item)).join('、')}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {hasElectronic && (
                                            <div className="flex items-start gap-2 bg-white p-1.5 rounded-md shadow-sm">
                                                <FileText size={16} className="text-blue-500 mt-0.5" />
                                                <div className="flex flex-col">
                                                    <span className="font-medium">磁介质：<Badge variant="outline" className="ml-1 bg-blue-50">{docTypes.electronic.count}个</Badge></span>
                                                    <span className="text-sm text-gray-600">
                                                        {docTypes.electronic.items.map((item: string) => getTypeDisplayName('magnetic', item)).join('、')}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {hasOther && (
                                            <div className="flex items-start gap-2 bg-white p-1.5 rounded-md shadow-sm">
                                                <FileText size={16} className="text-purple-500 mt-0.5" />
                                                <div className="flex flex-col">
                                                    <span className="font-medium">其他介质：<Badge variant="outline" className="ml-1 bg-purple-50">{docTypes.other.count}个</Badge></span>
                                                    <span className="text-sm text-gray-600">
                                                        {docTypes.other.items.map((item: string) => getTypeDisplayName('other', item)).join('、')}
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
                        {((appointment.assignedStaff && appointment.assignedStaff.length > 0) || appointment.assignedVehicle) && (
                            <div className="mb-3">
                                <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-1.5">
                                    <Users size={14} className="text-indigo-500" />
                                    <span>处理人员与车辆</span>
                                </h3>
                                <div className="space-y-2">
                                    {/* Show assigned staff if available */}
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

                                    {/* Show assigned vehicle if available */}
                                    {appointment.assignedVehicle && vehicleInfo && (
                                        <div className="bg-blue-50 p-2 rounded-md">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Car size={16} className="text-blue-600" />
                                                <span className="font-medium">派遣车辆</span>
                                            </div>
                                            <div className="bg-white p-1.5 rounded-md text-sm shadow-sm">
                                                {vehicleInfo}
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
                            <ul className="space-y-2">
                                <li className="flex gap-2">
                                    <span className="font-medium">1.</span>
                                    <span>上门分拣服务需由我方评估工作量并与委托方沟通确定人数后，再安排相应分拣工人开展分拣和装包工作；</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-medium">2.</span>
                                    <span>按规定，为起到内部监督作用，分拣或装卸，单次单项服务不得低于2人；</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-medium">3.</span>
                                    <span>未选择分拣服务，默认已按销毁标准分类完毕。上门装车时，如发现待销物品分类不合规，则现场退回；</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-medium">4.</span>
                                    <span>未选择装卸服务，则现场装车、卸载环节自行负责，不提供相应帮助。</span>
                                </li>
                            </ul>
                        </div>

                        {/* 公司信息 */}
                        <div className="mt-auto pt-3 border-t border-gray-200">
                            <div className="font-medium text-gray-700 mb-1">公司信息</div>
                            <div className="space-y-1.5 text-xs text-gray-600">
                                <div className="flex items-center gap-2">
                                    <Building size={14} className="text-gray-500" />
                                    <span>立品科技数据销毁服务中心</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin size={14} className="text-gray-500" />
                                    <span>地址：上海市浦东新区张江高科技园区博云路2号浦软大厦102室</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone size={14} className="text-gray-500" />
                                    <span>电话：021-50806767</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail size={14} className="text-gray-500" />
                                    <span>邮箱：service@datarecovery.com.cn</span>
                                </div>
                            </div>
                        </div>
                    </div>

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