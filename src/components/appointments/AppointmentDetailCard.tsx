"use client";

import { Badge } from "@/components/ui/badge";
import { type Appointment } from "@/lib/stores/appointments";
import { documentTypes, documentTypesByCategory, formatDateTime, getStatusData } from "@/lib/utils/appointments/helpers";
import { useStaffStore, useVehicleStore } from "@/lib/stores";
import { useEffect } from "react";

export function AppointmentDetailCard({ appointment }: { appointment: Appointment }) {
    const statusData = getStatusData(appointment.status);
    const documentType = documentTypes.find(t => t.value === appointment.documentType)?.label || appointment.documentType;

    const { staffList, fetchStaff } = useStaffStore();
    const { vehicles, fetchVehicles } = useVehicleStore();

    // 获取员工和车辆数据
    useEffect(() => {
        if (appointment.assignedStaff?.length || appointment.assignedVehicles?.length) {
            fetchStaff();
            fetchVehicles();
        }
    }, [appointment.assignedStaff, appointment.assignedVehicles, fetchStaff, fetchVehicles]);

    // 获取指派员工信息
    const assignedStaffInfo = appointment.assignedStaff?.map(staffId => {
        const staff = staffList.find(s => s.id === String(staffId));
        if (!staff) return null;
        return staff.name;
    }).filter((name): name is string => name !== null);

    // 获取指派车辆信息
    const assignedVehiclesInfo = appointment.assignedVehicles?.map(vehicleId => {
        const vehicle = vehicles.find(v => v.id === String(vehicleId));
        if (!vehicle) return null;
        return `${vehicle.plateNumber}(${vehicle.model})`;
    }).filter((info): info is string => info !== null);

    // 解析文档类型数据
    const getDocumentTypesInfo = () => {
        if (!appointment.documentTypesJson) {
            return { docTypes: null, hasPaper: false, hasElectronic: false, hasOther: false };
        }

        try {
            const docTypes = JSON.parse(appointment.documentTypesJson);

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

    // 获取文档类型的显示名称
    const getTypeDisplayName = (category: string, typeValue: string, customName?: string) => {
        if (customName) {
            return customName;
        }
        const typeObj = documentTypesByCategory[category as keyof typeof documentTypesByCategory]?.find(t => t.value === typeValue);
        return typeObj?.label || typeValue;
    };

    return (
        <div className="bg-white border border-gray-200">
            {/* 标题行 */}
            <div className="flex justify-between items-center px-3 py-2 bg-gray-50 border-b border-gray-200">
                <span className="font-medium text-gray-900">预约 #{appointment.appointmentId || appointment.id}</span>
                <Badge variant="outline" className="text-xs bg-white">
                    {statusData.label}
                </Badge>
            </div>

            {/* 信息内容 */}
            <div className="p-3">
                <div className="space-y-1 text-sm">
                    <div className="grid grid-cols-4 gap-2">
                        <span className="text-gray-500">时间</span>
                        <span className="col-span-3">{formatDateTime(appointment.dateTime)}</span>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                        <span className="text-gray-500">联系人</span>
                        <span className="col-span-3">{appointment.contactName}</span>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                        <span className="text-gray-500">电话</span>
                        <span className="col-span-3">{appointment.contactPhone}</span>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                        <span className="text-gray-500">地址</span>
                        <span className="col-span-3 text-xs">{appointment.contactAddress}</span>
                    </div>

                    {/* 文档信息 - 恢复详细处理 */}
                    {(hasPaper || hasElectronic || hasOther) && docTypes ? (
                        <>
                            {hasPaper && (
                                <div className="grid grid-cols-4 gap-2">
                                    <span className="text-gray-500">纸介质</span>
                                    <div className="col-span-3 text-xs">
                                        <div className="mb-1">
                                            总计 {Object.values(docTypes.paper.items).reduce((sum: number, item: any) => sum + (item?.count || item || 0), 0)} 个
                                        </div>
                                        <div className="text-gray-600">
                                            {Object.entries(docTypes.paper.items)
                                                .filter(([_, item]) => (typeof item === 'number' ? item > 0 : ((item as any)?.count || 0) > 0))
                                                .map(([type, item]) => {
                                                    const count = typeof item === 'number' ? item : ((item as any)?.count || 0);
                                                    const customName = typeof item === 'object' ? (item as any)?.customName : undefined;
                                                    return `${getTypeDisplayName('paper', type, customName)}(${count})`;
                                                })
                                                .join('、')}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {hasElectronic && (
                                <div className="grid grid-cols-4 gap-2">
                                    <span className="text-gray-500">磁介质</span>
                                    <div className="col-span-3 text-xs">
                                        <div className="mb-1">
                                            总计 {Object.values(docTypes.electronic.items).reduce((sum: number, item: any) => sum + (item?.count || item || 0), 0)} 个
                                        </div>
                                        <div className="text-gray-600">
                                            {Object.entries(docTypes.electronic.items)
                                                .filter(([_, item]) => (typeof item === 'number' ? item > 0 : ((item as any)?.count || 0) > 0))
                                                .map(([type, item]) => {
                                                    const count = typeof item === 'number' ? item : ((item as any)?.count || 0);
                                                    const customName = typeof item === 'object' ? (item as any)?.customName : undefined;
                                                    return `${getTypeDisplayName('magnetic', type, customName)}(${count})`;
                                                })
                                                .join('、')}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {hasOther && (
                                <div className="grid grid-cols-4 gap-2">
                                    <span className="text-gray-500">其他介质</span>
                                    <div className="col-span-3 text-xs">
                                        <div className="mb-1">
                                            总计 {Object.values(docTypes.other.items).reduce((sum: number, item: any) => sum + (item?.count || item || 0), 0)} 个
                                        </div>
                                        <div className="text-gray-600">
                                            {Object.entries(docTypes.other.items)
                                                .filter(([_, item]) => (typeof item === 'number' ? item > 0 : ((item as any)?.count || 0) > 0))
                                                .map(([type, item]) => {
                                                    const count = typeof item === 'number' ? item : ((item as any)?.count || 0);
                                                    const customName = typeof item === 'object' ? (item as any)?.customName : undefined;
                                                    return `${getTypeDisplayName('other', type, customName)}(${count})`;
                                                })
                                                .join('、')}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="grid grid-cols-4 gap-2">
                            <span className="text-gray-500">文档</span>
                            <span className="col-span-3">{documentType} {appointment.documentCount} 个</span>
                        </div>
                    )}

                    {/* 指派信息 */}
                    {(assignedStaffInfo && assignedStaffInfo.length > 0) && (
                        <div className="grid grid-cols-4 gap-2">
                            <span className="text-gray-500">人员</span>
                            <span className="col-span-3">{assignedStaffInfo.join('、')}</span>
                        </div>
                    )}

                    {(assignedVehiclesInfo && assignedVehiclesInfo.length > 0) && (
                        <div className="grid grid-cols-4 gap-2">
                            <span className="text-gray-500">车辆</span>
                            <span className="col-span-3">{assignedVehiclesInfo.join('、')}</span>
                        </div>
                    )}

                    {/* 时间信息 */}
                    {appointment.estimatedCompletionTime && (
                        <div className="grid grid-cols-4 gap-2">
                            <span className="text-gray-500">预计上门</span>
                            <span className="col-span-3">{formatDateTime(appointment.estimatedCompletionTime)}</span>
                        </div>
                    )}

                    {/* 备注信息 */}
                    {appointment.notes && (
                        <div className="grid grid-cols-4 gap-2">
                            <span className="text-gray-500">备注</span>
                            <span className="col-span-3">{appointment.notes}</span>
                        </div>
                    )}

                    {appointment.processingNotes && (
                        <div className="grid grid-cols-4 gap-2">
                            <span className="text-gray-500">处理备注</span>
                            <span className="col-span-3">{appointment.processingNotes}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 