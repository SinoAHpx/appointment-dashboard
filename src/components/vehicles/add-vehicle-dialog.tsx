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
import { Droplets, Zap } from "lucide-react";

interface AddVehicleDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    newVehicle: {
        plateNumber: string;
        model: string;
        vehicleType: "electric" | "fuel";
        length: number;
        capacity: number;
        isAvailable: boolean;
        lastMaintenance: string;
    };
    handleNewVehicleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleVehicleTypeChange: (value: "electric" | "fuel") => void;
    handleSubmitNewVehicle: () => Promise<void>;
}

export function AddVehicleDialog({
    isOpen,
    onOpenChange,
    newVehicle,
    handleNewVehicleChange,
    handleVehicleTypeChange,
    handleSubmitNewVehicle,
}: AddVehicleDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>添加车辆</DialogTitle>
                    <DialogDescription>
                        填写以下信息添加新的车辆记录
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="plateNumber">车牌号 *</Label>
                            <Input
                                id="plateNumber"
                                name="plateNumber"
                                value={newVehicle.plateNumber}
                                onChange={handleNewVehicleChange}
                                placeholder="请输入车牌号"
                                required
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="model">车型 *</Label>
                            <Input
                                id="model"
                                name="model"
                                value={newVehicle.model}
                                onChange={handleNewVehicleChange}
                                placeholder="请输入车型"
                                required
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="vehicleType">车辆类型 *</Label>
                            <Select
                                value={newVehicle.vehicleType}
                                onValueChange={(value) => handleVehicleTypeChange(value as "electric" | "fuel")}
                            >
                                <SelectTrigger id="vehicleType" className="w-full">
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
                            <Label htmlFor="capacity">载重量（吨）*</Label>
                            <Input
                                id="capacity"
                                name="capacity"
                                type="number"
                                step="0.1"
                                min="0"
                                value={newVehicle.capacity}
                                onChange={handleNewVehicleChange}
                                required
                                className="w-full"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="length">车长（米）*</Label>
                            <Input
                                id="length"
                                name="length"
                                type="number"
                                step="0.1"
                                min="0"
                                value={newVehicle.length}
                                onChange={handleNewVehicleChange}
                                required
                                className="w-full"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="lastMaintenance">最近一次维护日期</Label>
                        <Input
                            id="lastMaintenance"
                            name="lastMaintenance"
                            type="date"
                            value={newVehicle.lastMaintenance}
                            onChange={handleNewVehicleChange}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            id="isAvailable"
                            name="isAvailable"
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-primary"
                            checked={newVehicle.isAvailable}
                            onChange={handleNewVehicleChange}
                        />
                        <Label htmlFor="isAvailable">可用状态</Label>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">取消</Button>
                    </DialogClose>
                    <Button onClick={handleSubmitNewVehicle}>创建</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 