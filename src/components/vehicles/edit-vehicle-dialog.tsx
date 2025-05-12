import React from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
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
import { type Vehicle } from "@/lib/store";
import { Droplets, Zap } from "lucide-react";

interface EditVehicleDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    editingVehicle: Vehicle | null;
    handleEditVehicleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleEditVehicleTypeChange: (value: "electric" | "fuel") => void;
    handleUpdateVehicle: () => Promise<void>;
}

export function EditVehicleDialog({
    isOpen,
    onOpenChange,
    editingVehicle,
    handleEditVehicleChange,
    handleEditVehicleTypeChange,
    handleUpdateVehicle,
}: EditVehicleDialogProps) {
    if (!editingVehicle) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>编辑车辆信息</DialogTitle>
                    <DialogDescription>修改车辆信息</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="edit-plateNumber">车牌号 *</Label>
                            <Input
                                id="edit-plateNumber"
                                name="plateNumber"
                                value={editingVehicle.plateNumber}
                                onChange={handleEditVehicleChange}
                                placeholder="请输入车牌号"
                                required
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="edit-model">车型 *</Label>
                            <Input
                                id="edit-model"
                                name="model"
                                value={editingVehicle.model}
                                onChange={handleEditVehicleChange}
                                placeholder="请输入车型"
                                required
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="edit-vehicleType">车辆类型 *</Label>
                            <Select
                                value={editingVehicle.vehicleType}
                                onValueChange={(value) => handleEditVehicleTypeChange(value as "electric" | "fuel")}
                            >
                                <SelectTrigger id="edit-vehicleType">
                                    <SelectValue placeholder="选择车辆类型" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="electric">
                                        <div className="flex items-center gap-2">
                                            <Zap size={16} className="text-blue-500" />
                                            <span>电车</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="fuel">
                                        <div className="flex items-center gap-2">
                                            <Droplets size={16} className="text-green-500" />
                                            <span>油车</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="edit-capacity">载重量（吨）*</Label>
                            <Input
                                id="edit-capacity"
                                name="capacity"
                                type="number"
                                step="0.1"
                                min="0"
                                value={editingVehicle.capacity}
                                onChange={handleEditVehicleChange}
                                required
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="edit-length">车长（米）*</Label>
                            <Input
                                id="edit-length"
                                name="length"
                                type="number"
                                step="0.1"
                                min="0"
                                value={editingVehicle.length}
                                onChange={handleEditVehicleChange}
                                required
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="edit-lastMaintenance">最近一次维护日期</Label>
                        <Input
                            id="edit-lastMaintenance"
                            name="lastMaintenance"
                            type="date"
                            value={editingVehicle.lastMaintenance || ""}
                            onChange={handleEditVehicleChange}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            id="edit-isAvailable"
                            name="isAvailable"
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-primary"
                            checked={editingVehicle.isAvailable}
                            onChange={handleEditVehicleChange}
                        />
                        <Label htmlFor="edit-isAvailable">可用状态</Label>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">取消</Button>
                    </DialogClose>
                    <Button onClick={handleUpdateVehicle}>更新</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 