"use client";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
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
        <div className="bg-white border border-gray-200 w-full overflow-hidden">
            {/* 标题行 */}
            <div className="flex justify-between items-center px-3 py-2 bg-gray-50 border-b border-gray-200">
                <span className="font-medium text-gray-900">预约 #{appointment.appointmentId || appointment.id}</span>
                <Badge variant="outline" className="text-xs bg-white">
                    {statusData.label}
                </Badge>
            </div>

            {/* 表格内容 */}
            <div className="p-3 overflow-x-auto">
                <Table className="w-full table-fixed">
                    <TableBody>
                        <TableRow>
                            <TableCell className="text-gray-500 font-normal w-24 py-1 align-top">时间</TableCell>
                            <TableCell className="py-1 break-words">{formatDateTime(appointment.dateTime)}</TableCell>
                        </TableRow>

                        <TableRow>
                            <TableCell className="text-gray-500 font-normal w-24 py-1 align-top">联系人</TableCell>
                            <TableCell className="py-1 break-words">{appointment.contactName}</TableCell>
                        </TableRow>

                        <TableRow>
                            <TableCell className="text-gray-500 font-normal w-24 py-1 align-top">电话</TableCell>
                            <TableCell className="py-1 break-words">{appointment.contactPhone}</TableCell>
                        </TableRow>

                        <TableRow>
                            <TableCell className="text-gray-500 font-normal w-24 py-1 align-top">地址</TableCell>
                            <TableCell className="py-1 text-xs break-words">{appointment.contactAddress}</TableCell>
                        </TableRow>

                        {/* 文档信息 - 恢复详细处理 */}
                        {(hasPaper || hasElectronic || hasOther) && docTypes ? (
                            <>
                                {hasPaper && (
                                    <TableRow>
                                        <TableCell className="text-gray-500 font-normal w-24 py-1 align-top">纸介质</TableCell>
                                        <TableCell className="py-1 text-xs">
                                            <div className="mb-1">
                                                总计 {Object.values(docTypes.paper.items).reduce((sum: number, item: any) => sum + (item?.count || item || 0), 0)} 个
                                            </div>
                                            <div className="text-gray-600 break-words">
                                                {Object.entries(docTypes.paper.items)
                                                    .filter(([_, item]) => (typeof item === 'number' ? item > 0 : ((item as any)?.count || 0) > 0))
                                                    .map(([type, item]) => {
                                                        const count = typeof item === 'number' ? item : ((item as any)?.count || 0);
                                                        const customName = typeof item === 'object' ? (item as any)?.customName : undefined;
                                                        return `${getTypeDisplayName('paper', type, customName)}(${count})`;
                                                    })
                                                    .join('、')}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}

                                {hasElectronic && (
                                    <TableRow>
                                        <TableCell className="text-gray-500 font-normal w-24 py-1 align-top">磁介质</TableCell>
                                        <TableCell className="py-1 text-xs">
                                            <div className="mb-1">
                                                总计 {Object.values(docTypes.electronic.items).reduce((sum: number, item: any) => sum + (item?.count || item || 0), 0)} 个
                                            </div>
                                            <div className="text-gray-600 break-words">
                                                {Object.entries(docTypes.electronic.items)
                                                    .filter(([_, item]) => (typeof item === 'number' ? item > 0 : ((item as any)?.count || 0) > 0))
                                                    .map(([type, item]) => {
                                                        const count = typeof item === 'number' ? item : ((item as any)?.count || 0);
                                                        const customName = typeof item === 'object' ? (item as any)?.customName : undefined;
                                                        return `${getTypeDisplayName('magnetic', type, customName)}(${count})`;
                                                    })
                                                    .join('、')}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}

                                {hasOther && (
                                    <TableRow>
                                        <TableCell className="text-gray-500 font-normal w-24 py-1 align-top">其他介质</TableCell>
                                        <TableCell className="py-1 text-xs">
                                            <div className="mb-1">
                                                总计 {Object.values(docTypes.other.items).reduce((sum: number, item: any) => sum + (item?.count || item || 0), 0)} 个
                                            </div>
                                            <div className="text-gray-600 break-words">
                                                {Object.entries(docTypes.other.items)
                                                    .filter(([_, item]) => (typeof item === 'number' ? item > 0 : ((item as any)?.count || 0) > 0))
                                                    .map(([type, item]) => {
                                                        const count = typeof item === 'number' ? item : ((item as any)?.count || 0);
                                                        const customName = typeof item === 'object' ? (item as any)?.customName : undefined;
                                                        return `${getTypeDisplayName('other', type, customName)}(${count})`;
                                                    })
                                                    .join('、')}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </>
                        ) : (
                            <TableRow>
                                <TableCell className="text-gray-500 font-normal w-24 py-1 align-top">文档</TableCell>
                                <TableCell className="py-1 break-words">{documentType} {appointment.documentCount} 个</TableCell>
                            </TableRow>
                        )}

                        {/* 指派信息 */}
                        {(assignedStaffInfo && assignedStaffInfo.length > 0) && (
                            <TableRow>
                                <TableCell className="text-gray-500 font-normal w-24 py-1 align-top">人员</TableCell>
                                <TableCell className="py-1 break-words">{assignedStaffInfo.join('、')}</TableCell>
                            </TableRow>
                        )}

                        {(assignedVehiclesInfo && assignedVehiclesInfo.length > 0) && (
                            <TableRow>
                                <TableCell className="text-gray-500 font-normal w-24 py-1 align-top">车辆</TableCell>
                                <TableCell className="py-1 break-words">{assignedVehiclesInfo.join('、')}</TableCell>
                            </TableRow>
                        )}

                        {/* 时间信息 */}
                        {appointment.estimatedCompletionTime && (
                            <TableRow>
                                <TableCell className="text-gray-500 font-normal w-24 py-1 align-top">预计上门</TableCell>
                                <TableCell className="py-1 break-words">{formatDateTime(appointment.estimatedCompletionTime)}</TableCell>
                            </TableRow>
                        )}

                        {/* 备注信息 */}
                        {appointment.notes && (
                            <TableRow>
                                <TableCell className="text-gray-500 font-normal w-24 py-1 align-top">备注</TableCell>
                                <TableCell className="py-1 break-words">{appointment.notes}</TableCell>
                            </TableRow>
                        )}

                        {appointment.processingNotes && (
                            <TableRow>
                                <TableCell className="text-gray-500 font-normal w-24 py-1 align-top">处理备注</TableCell>
                                <TableCell className="py-1 break-words">{appointment.processingNotes}</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
} 