"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { type Vehicle, useAuthStore, useVehicleStore } from "@/lib/store";
import {
	Calendar,
	Car,
	Check,
	Pencil,
	Plus,
	Search,
	Trash,
	X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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

	// 新建车辆表单状态
	const [newVehicle, setNewVehicle] = useState({
		plateNumber: "",
		model: "",
		capacity: 1,
		isAvailable: true,
		lastMaintenance: "",
	});

	// 编辑车辆表单状态
	const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

	// 每页数量
	const perPage = 10;
	// 总页数
	const totalPages = Math.ceil(
		vehicles.filter(
			(vehicle) =>
				vehicle.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
				vehicle.model.toLowerCase().includes(searchQuery.toLowerCase()),
		).length / perPage,
	);

	// 过滤并分页车辆数据
	const filteredVehicles = vehicles
		.filter(
			(vehicle) =>
				vehicle.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
				vehicle.model.toLowerCase().includes(searchQuery.toLowerCase()),
		)
		.sort((a, b) => a.plateNumber.localeCompare(b.plateNumber))
		.slice((page - 1) * perPage, page * perPage);

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
					: name === "capacity"
						? Number.parseInt(value) || 1
						: value,
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
						: name === "capacity"
							? Number.parseInt(value) || 1
							: value,
			});
		}
	};

	// 处理新建车辆提交
	const handleSubmitNewVehicle = async () => {
		// 表单验证 - 只验证必填字段：车牌号和车型
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

	// 格式化日期
	const formatDate = (dateString?: string) => {
		if (!dateString) return "-";
		const date = new Date(dateString);
		return new Intl.DateTimeFormat("zh-CN", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		}).format(date);
	};

	if (!isAuthenticated) {
		return null;
	}

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold">车辆管理</h1>
				<Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
					<DialogTrigger asChild>
						<Button className="flex items-center gap-1">
							<Plus size={16} />
							<span>添加车辆</span>
						</Button>
					</DialogTrigger>
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
							<div className="flex flex-col gap-2">
								<Label htmlFor="capacity">载重量（吨）*</Label>
								<Input
									id="capacity"
									name="capacity"
									type="number"
									min="1"
									value={newVehicle.capacity}
									onChange={handleNewVehicleChange}
									required
								/>
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
			</div>

			<div className="flex justify-between items-center">
				<div className="relative w-80">
					<Search
						className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
						size={18}
					/>
					<Input
						className="pl-8"
						placeholder="搜索车牌号或车型"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
			</div>

			<Card>
				<CardContent className="pt-6">
					<Table>
						<TableCaption>车辆列表</TableCaption>
						<TableHeader>
							<TableRow>
								<TableHead>车牌号</TableHead>
								<TableHead>车型</TableHead>
								<TableHead>载重量（吨）</TableHead>
								<TableHead>最近维护日期</TableHead>
								<TableHead>状态</TableHead>
								<TableHead className="text-right">操作</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{isLoading ? (
								<TableRow>
									<TableCell colSpan={6} className="text-center py-6">
										加载中...
									</TableCell>
								</TableRow>
							) : filteredVehicles.length === 0 ? (
								<TableRow>
									<TableCell colSpan={6} className="text-center py-6">
										{searchQuery ? "没有找到匹配的车辆" : "暂无车辆记录"}
									</TableCell>
								</TableRow>
							) : (
								filteredVehicles.map((vehicle) => (
									<TableRow key={vehicle.id}>
										<TableCell className="font-medium">
											{vehicle.plateNumber}
										</TableCell>
										<TableCell>{vehicle.model}</TableCell>
										<TableCell>{vehicle.capacity}</TableCell>
										<TableCell>{formatDate(vehicle.lastMaintenance)}</TableCell>
										<TableCell>
											<Badge
												variant={
													vehicle.isAvailable ? "default" : "destructive"
												}
												className="flex items-center gap-1 cursor-pointer"
												onClick={() => handleToggleAvailability(vehicle.id)}
											>
												{vehicle.isAvailable ? (
													<>
														<Check size={12} /> 可用
													</>
												) : (
													<>
														<X size={12} /> 不可用
													</>
												)}
											</Badge>
										</TableCell>
										<TableCell className="text-right">
											<div className="flex justify-end gap-2">
												<Button
													variant="outline"
													size="icon"
													onClick={() => handleStartEdit(vehicle)}
												>
													<Pencil size={16} />
												</Button>
												<Button
													variant="outline"
													size="icon"
													onClick={() => handleDeleteVehicle(vehicle.id)}
												>
													<Trash size={16} />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>

					{totalPages > 1 && (
						<div className="mt-4">
							<Pagination>
								<PaginationContent>
									<PaginationItem>
										<PaginationPrevious
											onClick={() => setPage((p) => Math.max(1, p - 1))}
											isActive={page === 1}
										/>
									</PaginationItem>

									{Array.from({ length: totalPages }).map((_, i) => (
										<PaginationItem key={`vehicle-page-${i}`}>
											<PaginationLink
												onClick={() => setPage(i + 1)}
												isActive={page === i + 1}
											>
												{i + 1}
											</PaginationLink>
										</PaginationItem>
									))}

									<PaginationItem>
										<PaginationNext
											onClick={() =>
												setPage((p) => Math.min(totalPages, p + 1))
											}
											isActive={page === totalPages}
										/>
									</PaginationItem>
								</PaginationContent>
							</Pagination>
						</div>
					)}
				</CardContent>
			</Card>

			{/* 编辑车辆对话框 */}
			<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
				<DialogContent className="sm:max-w-[500px]">
					<DialogHeader>
						<DialogTitle>编辑车辆信息</DialogTitle>
						<DialogDescription>修改车辆信息</DialogDescription>
					</DialogHeader>
					{editingVehicle && (
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
							<div className="flex flex-col gap-2">
								<Label htmlFor="edit-capacity">载重量（吨）*</Label>
								<Input
									id="edit-capacity"
									name="capacity"
									type="number"
									min="1"
									value={editingVehicle.capacity}
									onChange={handleEditVehicleChange}
									required
								/>
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
					)}
					<DialogFooter>
						<DialogClose asChild>
							<Button variant="outline">取消</Button>
						</DialogClose>
						<Button onClick={handleUpdateVehicle}>更新</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
