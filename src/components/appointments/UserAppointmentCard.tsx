"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { type Appointment } from "@/lib/stores/appointments";
import { documentTypes, formatDateTime, getStatusData } from "@/lib/utils/appointments/helpers";
import { Calendar, CheckCircle, Clock, FileText, LayoutList, MapPin, Phone, RotateCcw, User, XCircle } from "lucide-react";

export function UserAppointmentCard({ appointment }: { appointment: Appointment }) {
    const statusData = getStatusData(appointment.status);
    const documentType = documentTypes.find(t => t.value === appointment.documentType)?.label || appointment.documentType;

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
                    <div className="flex items-center gap-2">
                        <FileText size={16} className="text-gray-500" />
                        <span>文件类型：{documentType}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <LayoutList size={16} className="text-gray-500" />
                        <span>文件数量：{appointment.documentCount}个</span>
                    </div>
                    {appointment.notes && (
                        <div className="flex items-start gap-2 mt-2 pt-2 border-t border-gray-100">
                            <span className="text-gray-500">备注：</span>
                            <p className="text-gray-700">{appointment.notes}</p>
                        </div>
                    )}
                    {appointment.processingNotes && (
                        <div className="flex items-start gap-2 mt-2 pt-2 border-t border-gray-100">
                            <span className="text-gray-500">处理备注：</span>
                            <p className="text-gray-700">{appointment.processingNotes}</p>
                        </div>
                    )}
                    {appointment.estimatedCompletionTime && (
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                            <Clock size={16} className="text-gray-500" />
                            <span>预计完成时间：{formatDateTime(appointment.estimatedCompletionTime)}</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
} 