"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { type Appointment } from "@/lib/stores/appointments";
import { documentTypes, documentTypesByCategory, formatDateTime, getStatusData } from "@/lib/utils/appointments/helpers";
import { Calendar, CheckCircle, Clock, FileText, LayoutList, MapPin, Phone, RotateCcw, User, XCircle, Users, Car, AlertCircle } from "lucide-react";
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
        <Card className="mb-4 overflow-hidden">
            <CardHeader className="py-2 flex justify-between items-center">
                <div className="flex flex-1 justify-between items-center">
                    <h1 className="text-xl font-bold">
                        {appointment.appointmentId || `APT-${appointment.id}`}
                    </h1>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusData.color}`}>
                        {getIconComponent(statusData.icon)}
                        <span>{statusData.label}</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 主要信息列 */}
                    <div className="grid gap-3">
                        <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-gray-500" />
                            <span>预约时间：{formatDateTime(appointment.dateTime)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <User size={16} className="text-gray-500" />
                            <span>联系人：{appointment.contactName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Phone size={16} className="text-gray-500" />
                            <span>联系电话：{appointment.contactPhone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin size={16} className="text-gray-500" />
                            <span>联系地址：{appointment.contactAddress}</span>
                        </div>

                        {/* 显示新的文件类型信息 */}
                        {(hasPaper || hasElectronic || hasOther) && docTypes ? (
                            <div className="grid gap-2">
                                {hasPaper && (
                                    <div className="flex items-start gap-2">
                                        <FileText size={16} className="text-gray-500 mt-0.5" />
                                        <div className="flex flex-col">
                                            <span className="font-medium">纸介质：{docTypes.paper.count}个</span>
                                            <span className="text-sm text-gray-600">
                                                {docTypes.paper.items.map((item: string) => getTypeDisplayName('paper', item)).join('、')}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {hasElectronic && (
                                    <div className="flex items-start gap-2">
                                        <FileText size={16} className="text-gray-500 mt-0.5" />
                                        <div className="flex flex-col">
                                            <span className="font-medium">磁介质：{docTypes.electronic.count}个</span>
                                            <span className="text-sm text-gray-600">
                                                {docTypes.electronic.items.map((item: string) => getTypeDisplayName('magnetic', item)).join('、')}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {hasOther && (
                                    <div className="flex items-start gap-2">
                                        <FileText size={16} className="text-gray-500 mt-0.5" />
                                        <div className="flex flex-col">
                                            <span className="font-medium">其他介质：{docTypes.other.count}个</span>
                                            <span className="text-sm text-gray-600">
                                                {docTypes.other.items.map((item: string) => getTypeDisplayName('other', item)).join('、')}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // 向后兼容，显示旧的文件类型信息
                            <div className="flex items-center gap-2">
                                <FileText size={16} className="text-gray-500" />
                                <span>文件类型：{documentType}</span>
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <LayoutList size={16} className="text-gray-500" />
                            <span>文件数量：{appointment.documentCount}个</span>
                        </div>

                        {/* Show assigned staff if available */}
                        {appointment.assignedStaff && appointment.assignedStaff.length > 0 && assignedStaffInfo && (
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <Users size={16} className="text-gray-500" />
                                    <span className="font-medium">处理人员：</span>
                                </div>
                                <div className="ml-6 space-y-1">
                                    {assignedStaffInfo.map((staff, index) => (
                                        <div key={index} className="text-sm text-gray-600">
                                            <span>{staff.name}</span>
                                            <span className="mx-2">|</span>
                                            <span className="font-mono">{staff.idCard}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Show assigned vehicle if available */}
                        {appointment.assignedVehicle && vehicleInfo && (
                            <div className="flex items-center gap-2">
                                <Car size={16} className="text-gray-500" />
                                <span>派遣车辆：{vehicleInfo}</span>
                            </div>
                        )}

                        {appointment.notes && (
                            <div className="flex items-start gap-2">
                                <span className="text-gray-500">备注：</span>
                                <p className="text-gray-700">{appointment.notes}</p>
                            </div>
                        )}
                        {appointment.processingNotes && (
                            <div className="flex items-start gap-2">
                                <span className="text-gray-500">处理备注：</span>
                                <p className="text-gray-700">{appointment.processingNotes}</p>
                            </div>
                        )}
                        {appointment.estimatedCompletionTime && (
                            <div className="flex items-center gap-2">
                                <Clock size={16} className="text-gray-500" />
                                <span>预计完成时间：{formatDateTime(appointment.estimatedCompletionTime)}</span>
                            </div>
                        )}
                    </div>

                    {/* 右侧服务说明 */}
                    <div className="bg-gray-50 p-4 rounded-md h-fit">
                        <div className="flex items-center gap-2 mb-3">
                            <AlertCircle size={16} className="text-amber-500" />
                            <span className="font-medium text-gray-800">服务须知</span>
                        </div>
                        <ul className="space-y-3 text-sm text-gray-700">
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
                </div>

                {/* 添加操作按钮区域 */}
                <div className="flex justify-end mt-4 pt-4">
                    <UserAppointmentActions appointment={appointment} />
                </div>
            </CardContent>
        </Card>
    );
} 