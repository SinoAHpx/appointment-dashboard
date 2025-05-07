"use client";

import { Button } from "@/components/ui/button";
import {
    DialogClose,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { type Appointment } from "@/lib/stores/appointments";
import { documentTypes } from "@/lib/utils/appointments/helpers";
import { useState, useEffect } from "react";

export interface AppointmentFormData {
    dateTime: string;
    contactName: string;
    contactPhone: string;
    contactAddress: string;
    documentCount: number;
    documentType: string;
    notes: string;
    status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
    estimatedCompletionTime?: string;
    processingNotes?: string;
}

interface AppointmentFormProps {
    isAdmin?: boolean;
    initialData?: Appointment;
    onSubmit: (data: AppointmentFormData) => void;
    submitLabel?: string;
}

export function AppointmentForm({
    isAdmin = false,
    initialData,
    onSubmit,
    submitLabel = "保存",
}: AppointmentFormProps) {
    const [formData, setFormData] = useState<AppointmentFormData>({
        dateTime: "",
        contactName: "",
        contactPhone: "",
        contactAddress: "",
        documentCount: 1,
        documentType: "confidential",
        notes: "",
        status: "pending",
        estimatedCompletionTime: "",
        processingNotes: "",
    });

    // Initialize form with provided data
    useEffect(() => {
        if (initialData) {
            setFormData({
                dateTime: initialData.dateTime || "",
                contactName: initialData.contactName || "",
                contactPhone: initialData.contactPhone || "",
                contactAddress: initialData.contactAddress || "",
                documentCount: initialData.documentCount || 1,
                documentType: initialData.documentType || "confidential",
                notes: initialData.notes || "",
                status: initialData.status || "pending",
                estimatedCompletionTime: initialData.estimatedCompletionTime || "",
                processingNotes: initialData.processingNotes || "",
            });
        }
    }, [initialData]);

    // Handle form changes
    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === "documentCount" ? parseInt(value) || 0 : value,
        }));
    };

    // Handle select changes
    const handleSelectChange = (name: string, value: string) => {
        if (name === "status") {
            setFormData((prev) => ({
                ...prev,
                status: value as AppointmentFormData["status"],
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    // Handle form submission
    const handleSubmit = () => {
        onSubmit(formData);
    };

    // Check if all required fields are filled
    const isFormValid = () => {
        return (
            formData.dateTime &&
            formData.contactName &&
            formData.contactPhone &&
            formData.contactAddress &&
            formData.documentCount > 0
        );
    };

    return (
        <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                    <Label htmlFor="dateTime">预约时间 *</Label>
                    <Input
                        id="dateTime"
                        name="dateTime"
                        type="datetime-local"
                        value={formData.dateTime}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="contactName">联系人 *</Label>
                    <Input
                        id="contactName"
                        name="contactName"
                        value={formData.contactName}
                        onChange={handleInputChange}
                        placeholder="请输入联系人姓名"
                        required
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                    <Label htmlFor="contactPhone">联系电话 *</Label>
                    <Input
                        id="contactPhone"
                        name="contactPhone"
                        value={formData.contactPhone}
                        onChange={handleInputChange}
                        placeholder="请输入联系电话"
                        required
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="documentCount">文件数量 *</Label>
                    <Input
                        id="documentCount"
                        name="documentCount"
                        type="number"
                        min="1"
                        value={formData.documentCount}
                        onChange={handleInputChange}
                        required
                    />
                </div>
            </div>
            <div className="flex flex-col gap-2">
                <Label htmlFor="documentType">文件类型 *</Label>
                <Select
                    value={formData.documentType}
                    onValueChange={(value) => handleSelectChange("documentType", value)}
                >
                    <SelectTrigger id="documentType">
                        <SelectValue placeholder="选择文件类型" />
                    </SelectTrigger>
                    <SelectContent>
                        {documentTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                                {type.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex flex-col gap-2">
                <Label htmlFor="contactAddress">联系地址 *</Label>
                <Input
                    id="contactAddress"
                    name="contactAddress"
                    value={formData.contactAddress}
                    onChange={handleInputChange}
                    placeholder="请输入联系地址"
                    required
                />
            </div>
            <div className="flex flex-col gap-2">
                <Label htmlFor="notes">备注</Label>
                <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="请输入备注信息"
                    rows={3}
                />
            </div>

            {/* Admin-only fields */}
            {isAdmin && (
                <>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="status">状态 *</Label>
                        <Select
                            value={formData.status}
                            onValueChange={(value) => handleSelectChange("status", value)}
                        >
                            <SelectTrigger id="status">
                                <SelectValue placeholder="选择状态" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pending">待确认</SelectItem>
                                <SelectItem value="confirmed">已确认</SelectItem>
                                <SelectItem value="in_progress">处理中</SelectItem>
                                <SelectItem value="completed">已完成</SelectItem>
                                <SelectItem value="cancelled">已取消</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="estimatedCompletionTime">预计完成时间</Label>
                        <Input
                            id="estimatedCompletionTime"
                            name="estimatedCompletionTime"
                            type="datetime-local"
                            value={formData.estimatedCompletionTime || ""}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="processingNotes">处理备注</Label>
                        <Textarea
                            id="processingNotes"
                            name="processingNotes"
                            value={formData.processingNotes || ""}
                            onChange={handleInputChange}
                            placeholder="请输入处理相关的备注信息"
                            rows={3}
                        />
                    </div>
                </>
            )}

            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">取消</Button>
                </DialogClose>
                <Button onClick={handleSubmit} disabled={!isFormValid()}>
                    {submitLabel}
                </Button>
            </DialogFooter>
        </div>
    );
} 