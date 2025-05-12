"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/components/ui/tabs";
import { type Vehicle, useAuthStore, useVehicleStore } from "@/lib/store";
import { Droplets, Plus, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AuthGuard } from "@/components/AuthGuard";
import {
	AddVehicleDialog,
	EditVehicleDialog,
	SearchBar,
	VehicleTable,
	formatDate,
	getVehicleTypeIcon,
	getVehicleTypeLabel
} from "@/components/vehicles";

export default function VehiclesPage() {
	const { isAuthenticated } = useAuthStore();
	const router = useRouter();
	const {
		vehicles,
		isLoading,
		fetchVehicles,
		addVehicle,
		updateVehicle,
		deleteVehicle,
		toggleAvailability,
	} = useVehicleStore();

	const [page, setPage] = useState(1);
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [activeTab, setActiveTab] = useState("all");

	// 新建车辆表单状态
	const [newVehicle, setNewVehicle] = useState({
		plateNumber: "",
		model: "",
		vehicleType: "fuel" as "electric" | "fuel",
		length: 0,
		capacity: 1,
		isAvailable: true,
		lastMaintenance: "",
	});

	// 编辑车辆表单状态
	const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

	// 每页数量
	const perPage = 10;

	// 获取当前分类下的过滤后车辆列表
	const getFilteredVehicles = () => {
		return vehicles
			.filter(
				(vehicle) =>
					vehicle.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
					vehicle.model.toLowerCase().includes(searchQuery.toLowerCase())
			)
			.filter(vehicle => {
				if (activeTab === "all") return true;
				return vehicle.vehicleType === activeTab;
			})
			.sort((a, b) => a.plateNumber.localeCompare(b.plateNumber))
			.slice((page - 1) * perPage, page * perPage);
	};

	// 总页数
	const totalPages = Math.ceil(
		vehicles.filter(
			(vehicle) =>
				vehicle.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
				vehicle.model.toLowerCase().includes(searchQuery.toLowerCase())
		).filter(vehicle => {
			if (activeTab === "all") return true;
			return vehicle.vehicleType === activeTab;
		}).length / perPage,
	);

	// 过滤并分页车辆数据
	const filteredVehicles = getFilteredVehicles();

	// 如果用户未登录，重定向到登录页面
	useEffect(() => {
		if (!isAuthenticated) {
			router.push("/login");
		} else {
			fetchVehicles();
		}
	}, [isAuthenticated, router, fetchVehicles]);

	// 处理新建车辆表单变更
	const handleNewVehicleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value, type, checked } = e.target;
		setNewVehicle((prev) => ({
			...prev,
			[name]:
				type === "checkbox"
					? checked
					: name === "capacity" || name === "length"
						? parseFloat(value) || 0
						: value,
		}));
	};

	// 处理车辆类型选择
	const handleVehicleTypeChange = (value: "electric" | "fuel") => {
		setNewVehicle(prev => ({
			...prev,
			vehicleType: value
		}));
	};

	// 处理编辑车辆表单变更
	const handleEditVehicleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value, type, checked } = e.target;
		if (editingVehicle) {
			setEditingVehicle({
				...editingVehicle,
				[name]:
					type === "checkbox"
						? checked
						: name === "capacity" || name === "length"
							? parseFloat(value) || 0
							: value,
			});
		}
	};

	// 处理编辑车辆类型选择
	const handleEditVehicleTypeChange = (value: "electric" | "fuel") => {
		if (editingVehicle) {
			setEditingVehicle({
				...editingVehicle,
				vehicleType: value
			});
		}
	};

	// 处理新建车辆提交
	const handleSubmitNewVehicle = async () => {
		// 表单验证 - 验证必填字段：车牌号、车型和车辆类型
		if (!newVehicle.plateNumber || !newVehicle.model) {
			toast.error("请填写必填项：车牌号和车型");
			return;
		}

		try {
			const success = await addVehicle(newVehicle);
			if (success) {
				toast.success("车辆添加成功");
				setIsAddDialogOpen(false);
				// 重置表单
				setNewVehicle({
					plateNumber: "",
					model: "",
					vehicleType: "fuel",
					length: 0,
					capacity: 1,
					isAvailable: true,
					lastMaintenance: "",
				});
			} else {
				toast.error("添加车辆失败");
			}
		} catch (error) {
			toast.error(`添加车辆失败: ${(error as Error).message}`);
		}
	};

	// 开始编辑车辆
	const handleStartEdit = (vehicle: Vehicle) => {
		setEditingVehicle(vehicle);
		setIsEditDialogOpen(true);
	};

	// 处理更新车辆提交
	const handleUpdateVehicle = async () => {
		if (!editingVehicle) return;

		// 表单验证 - 只验证必填字段：车牌号和车型
		if (!editingVehicle.plateNumber || !editingVehicle.model) {
			toast.error("请填写必填项：车牌号和车型");
			return;
		}

		try {
			const success = await updateVehicle(editingVehicle.id, editingVehicle);
			if (success) {
				toast.success("车辆信息更新成功");
				setIsEditDialogOpen(false);
				setEditingVehicle(null);
			} else {
				toast.error("更新车辆信息失败");
			}
		} catch (error) {
			toast.error(`更新车辆信息失败: ${(error as Error).message}`);
		}
	};

	// 处理删除车辆
	const handleDeleteVehicle = async (id: string) => {
		if (!confirm("确定要删除这个车辆吗？删除后无法恢复。")) return;

		try {
			const success = await deleteVehicle(id);
			if (success) {
				toast.success("车辆删除成功");
			} else {
				toast.error("删除车辆失败");
			}
		} catch (error) {
			toast.error(`删除车辆失败: ${(error as Error).message}`);
		}
	};

	// 处理切换车辆可用状态
	const handleToggleAvailability = async (id: string) => {
		try {
			const success = await toggleAvailability(id);
			if (success) {
				toast.success("车辆状态已更新");
			} else {
				toast.error("更新车辆状态失败");
			}
		} catch (error) {
			toast.error(`更新车辆状态失败: ${(error as Error).message}`);
		}
	};

	// 切换标签页
	const handleTabChange = (tabValue: string) => {
		setActiveTab(tabValue);
		setPage(1);
	};

	if (!isAuthenticated) {
		return null;
	}

	return (
		<AuthGuard requiredRole="admin">
			<div className="space-y-6">
				<div className="flex justify-between items-center">
					<h1 className="text-2xl font-bold">车辆管理</h1>
					<Button className="flex items-center gap-1" onClick={() => setIsAddDialogOpen(true)}>
						<Plus size={16} />
						<span>添加车辆</span>
					</Button>
				</div>

				<div className="flex justify-between items-center">
					<SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
				</div>

				<Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange}>
					<TabsList>
						<TabsTrigger value="all">全部车辆</TabsTrigger>
						<TabsTrigger value="electric" className="flex items-center gap-1">
							<Zap size={14} />
							<span>电车</span>
						</TabsTrigger>
						<TabsTrigger value="fuel" className="flex items-center gap-1">
							<Droplets size={14} />
							<span>油车</span>
						</TabsTrigger>
					</TabsList>

					<TabsContent value="all" className="mt-6">
						<Card>
							<CardContent className="pt-6">
								<VehicleTable
									vehicles={filteredVehicles}
									isLoading={isLoading}
									searchQuery={searchQuery}
									formatDate={formatDate}
									getVehicleTypeIcon={getVehicleTypeIcon}
									getVehicleTypeLabel={getVehicleTypeLabel}
									handleToggleAvailability={handleToggleAvailability}
									handleStartEdit={handleStartEdit}
									handleDeleteVehicle={handleDeleteVehicle}
									page={page}
									setPage={setPage}
									totalPages={totalPages}
								/>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="electric" className="mt-6">
						<Card>
							<CardContent className="pt-6">
								<VehicleTable
									vehicles={filteredVehicles}
									isLoading={isLoading}
									searchQuery={searchQuery}
									formatDate={formatDate}
									getVehicleTypeIcon={getVehicleTypeIcon}
									getVehicleTypeLabel={getVehicleTypeLabel}
									handleToggleAvailability={handleToggleAvailability}
									handleStartEdit={handleStartEdit}
									handleDeleteVehicle={handleDeleteVehicle}
									page={page}
									setPage={setPage}
									totalPages={totalPages}
								/>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="fuel" className="mt-6">
						<Card>
							<CardContent className="pt-6">
								<VehicleTable
									vehicles={filteredVehicles}
									isLoading={isLoading}
									searchQuery={searchQuery}
									formatDate={formatDate}
									getVehicleTypeIcon={getVehicleTypeIcon}
									getVehicleTypeLabel={getVehicleTypeLabel}
									handleToggleAvailability={handleToggleAvailability}
									handleStartEdit={handleStartEdit}
									handleDeleteVehicle={handleDeleteVehicle}
									page={page}
									setPage={setPage}
									totalPages={totalPages}
								/>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>

				{/* 添加车辆对话框 */}
				<AddVehicleDialog
					isOpen={isAddDialogOpen}
					onOpenChange={setIsAddDialogOpen}
					newVehicle={newVehicle}
					handleNewVehicleChange={handleNewVehicleChange}
					handleVehicleTypeChange={handleVehicleTypeChange}
					handleSubmitNewVehicle={handleSubmitNewVehicle}
				/>

				{/* 编辑车辆对话框 */}
				<EditVehicleDialog
					isOpen={isEditDialogOpen}
					onOpenChange={setIsEditDialogOpen}
					editingVehicle={editingVehicle}
					handleEditVehicleChange={handleEditVehicleChange}
					handleEditVehicleTypeChange={handleEditVehicleTypeChange}
					handleUpdateVehicle={handleUpdateVehicle}
				/>
			</div>
		</AuthGuard>
	);
}

