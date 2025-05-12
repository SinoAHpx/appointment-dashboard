"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DocumentTypesSelector, type DocumentTypesData } from "./DocumentTypesSelector";

interface BasicInfoFormProps {
    dateTime: string;
    contactName: string;
    contactPhone: string;
    contactAddress: string;
    documentTypes: DocumentTypesData;
    notes: string;
    onDateTimeChange: (value: string) => void;
    onContactNameChange: (value: string) => void;
    onContactPhoneChange: (value: string) => void;
    onContactAddressChange: (value: string) => void;
    onDocumentTypesChange: (value: DocumentTypesData) => void;
    onNotesChange: (value: string) => void;
}

export function BasicInfoForm({
    dateTime,
    contactName,
    contactPhone,
    contactAddress,
    documentTypes,
    notes,
    onDateTimeChange,
    onContactNameChange,
    onContactPhoneChange,
    onContactAddressChange,
    onDocumentTypesChange,
    onNotesChange
}: BasicInfoFormProps) {
    return (
        <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="dateTime">预约时间 *</Label>
                    <Input
                        id="dateTime"
                        name="dateTime"
                        type="datetime-local"
                        value={dateTime}
                        onChange={(e) => onDateTimeChange(e.target.value)}
                        required
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="contactName">联系人 *</Label>
                    <Input
                        id="contactName"
                        name="contactName"
                        value={contactName}
                        onChange={(e) => onContactNameChange(e.target.value)}
                        placeholder="请输入联系人姓名"
                        required
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="contactPhone">联系电话 *</Label>
                    <Input
                        id="contactPhone"
                        name="contactPhone"
                        value={contactPhone}
                        onChange={(e) => onContactPhoneChange(e.target.value)}
                        placeholder="请输入联系电话"
                        required
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="contactAddress">联系地址 *</Label>
                    <Input
                        id="contactAddress"
                        name="contactAddress"
                        value={contactAddress}
                        onChange={(e) => onContactAddressChange(e.target.value)}
                        placeholder="请输入联系地址"
                        required
                    />
                </div>
            </div>

            {/* 文件类型选择部分 */}
            <DocumentTypesSelector
                value={documentTypes}
                onChange={onDocumentTypesChange}
            />

            {/* 备注字段 */}
            <div className="flex flex-col gap-1.5">
                <Label htmlFor="notes">备注</Label>
                <Textarea
                    id="notes"
                    name="notes"
                    value={notes}
                    onChange={(e) => onNotesChange(e.target.value)}
                    placeholder="请输入备注信息"
                    rows={3}
                />
            </div>
        </div>
    );
} 