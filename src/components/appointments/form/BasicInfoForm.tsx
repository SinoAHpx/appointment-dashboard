"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DocumentTypesSelector, type DocumentTypesData } from "./DocumentTypesSelector";
import { AddressCascader } from "@/components/ui/address-cascader";
import { beijingAddressData } from "@/lib/utils/beijing-address-data";

interface BasicInfoFormProps {
    dateTime: string;
    contactName: string;
    contactPhone: string;
    contactAddress: string;
    contactAddressDetails: string[];
    documentTypes: DocumentTypesData;
    notes: string;
    onDateTimeChange: (value: string) => void;
    onContactNameChange: (value: string) => void;
    onContactPhoneChange: (value: string) => void;
    onContactAddressChange: (value: string) => void;
    onContactAddressDetailsChange: (value: string[]) => void;
    onDocumentTypesChange: (value: DocumentTypesData) => void;
    onNotesChange: (value: string) => void;
}

export function BasicInfoForm({
    dateTime,
    contactName,
    contactPhone,
    contactAddress,
    contactAddressDetails,
    documentTypes,
    notes,
    onDateTimeChange,
    onContactNameChange,
    onContactPhoneChange,
    onContactAddressChange,
    onContactAddressDetailsChange,
    onDocumentTypesChange,
    onNotesChange,
}: BasicInfoFormProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 左栏：基本信息 */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                    基本信息
                </h3>

                <div className="space-y-4">
                    <div>
                        <Label htmlFor="dateTime">预约时间 *</Label>
                        <Input
                            id="dateTime"
                            type="datetime-local"
                            value={dateTime}
                            onChange={(e) => onDateTimeChange(e.target.value)}
                            className="mt-1"
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="contactName">联系人姓名 *</Label>
                        <Input
                            id="contactName"
                            type="text"
                            value={contactName}
                            onChange={(e) => onContactNameChange(e.target.value)}
                            placeholder="请输入联系人姓名"
                            className="mt-1"
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="contactPhone">联系电话 *</Label>
                        <Input
                            id="contactPhone"
                            type="tel"
                            value={contactPhone}
                            onChange={(e) => onContactPhoneChange(e.target.value)}
                            placeholder="请输入联系电话"
                            className="mt-1"
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="contactAddress">联系地址 *</Label>
                        <AddressCascader
                            value={contactAddressDetails}
                            onChange={onContactAddressDetailsChange}
                            options={beijingAddressData}
                            placeholder="请选择地址"
                            className="mt-1"
                        />
                        <Input
                            id="contactAddress"
                            type="text"
                            value={contactAddress}
                            onChange={(e) => onContactAddressChange(e.target.value)}
                            placeholder="详细地址（街道门牌号等）"
                            className="mt-2"
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="notes">备注</Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => onNotesChange(e.target.value)}
                            placeholder="请输入备注信息（可选）"
                            className="mt-1"
                            rows={3}
                        />
                    </div>
                </div>
            </div>

            {/* 右栏：文档类型选择 */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                    文档类型与数量
                </h3>

                <DocumentTypesSelector
                    value={documentTypes}
                    onChange={onDocumentTypesChange}
                />
            </div>
        </div>
    );
} 