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
	PaginationEllipsis,
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
import { type Staff, useAuthStore, useStaffStore } from "@/lib/store";
import { getSmartPaginationPages } from "@/lib/utils";
import {
	Briefcase,
	Check,
	Mail,
	Pencil,
	Phone,
	Plus,
	Search,
	Trash,
	User,
	X,
	Edit,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AuthGuard } from "@/components/AuthGuard";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";

export default function StaffPage() {
	const { isAuthenticated } = useAuthStore();
	const router = useRouter();
	const {
		staffList,
		isLoading,
		fetchStaff,
		addStaff,
		updateStaff,
		deleteStaff,
		toggleAvailability,
	} = useStaffStore();

	const [page, setPage] = useState(1);
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [deleteId, setDeleteId] = useState<string | null>(null);

	// 新建员工表单状态
	const [newStaff, setNewStaff] = useState({
		name: "",
		phone: "",
		idCard: "",
		position: "",
		isAvailable: true,
	});

	// 编辑员工表单状态
	const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

	// 每页数量
	const perPage = 10;
	// 总页数
	const totalPages = Math.ceil(
		staffList.filter(
			(staff) =>
				staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				staff.phone.includes(searchQuery) ||
				staff.idCard.includes(searchQuery) ||
				staff.position.toLowerCase().includes(searchQuery.toLowerCase()),
		).length / perPage,
	);

	// 过滤并分页员工数据
	const filteredStaff = staffList
		.filter(
			(staff) =>
				staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				staff.phone.includes(searchQuery) ||
				staff.idCard.includes(searchQuery) ||
				staff.position.toLowerCase().includes(searchQuery.toLowerCase()),
		)
		.sort((a, b) => a.name.localeCompare(b.name))
		.slice((page - 1) * perPage, page * perPage);

	// 如果用户未登录，重定向到登录页面
	useEffect(() => {
		if (!isAuthenticated) {
			router.push("/login");
		} else {
			fetchStaff();
		}
	}, [isAuthenticated, router, fetchStaff]);

	// 处理新建员工表单变更
	const handleNewStaffChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value, type, checked } = e.target;
		setNewStaff((prev) => ({
			...prev,
			[name]: type === "checkbox" ? checked : value,
		}));
	};

	// 处理编辑员工表单变更
	const handleEditStaffChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value, type, checked } = e.target;
		if (editingStaff) {
			setEditingStaff({
				...editingStaff,
				[name]: type === "checkbox" ? checked : value,
			});
		}
	};

	// 处理新建员工提交
	const handleSubmitNewStaff = async () => {
		// 表单验证 - 验证必填字段：姓名、手机号和身份证
		if (!newStaff.name || !newStaff.phone || !newStaff.idCard) {
			toast.error("请填写必填项：姓名、手机号和身份证");
			return;
		}

		try {
			const success = await addStaff(newStaff);
			if (success) {
				toast.success("员工创建成功");
				setIsAddDialogOpen(false);
				// 重置表单
				setNewStaff({
					name: "",
					phone: "",
					idCard: "",
					position: "",
					isAvailable: true,
				});
			} else {
				toast.error("创建员工失败");
			}
		} catch (error) {
			toast.error(`创建员工失败: ${(error as Error).message}`);
		}
	};

	// 开始编辑员工
	const handleStartEdit = (staff: Staff) => {
		setEditingStaff(staff);
		setIsEditDialogOpen(true);
	};

	// 处理更新员工提交
	const handleUpdateStaff = async () => {
		if (!editingStaff) return;

		// 表单验证 - 验证必填字段：姓名、手机号和身份证
		if (!editingStaff.name || !editingStaff.phone || !editingStaff.idCard) {
			toast.error("请填写必填项：姓名、手机号和身份证");
			return;
		}

		try {
			const success = await updateStaff(editingStaff.id, editingStaff);
			if (success) {
				toast.success("员工信息更新成功");
				setIsEditDialogOpen(false);
				setEditingStaff(null);
			} else {
				toast.error("更新员工信息失败");
			}
		} catch (error) {
			toast.error(`更新员工信息失败: ${(error as Error).message}`);
		}
	};

	// 处理删除员工
	const handleDeleteStaff = async (id: string) => {
		try {
			const success = await deleteStaff(id);
			if (success) {
				toast.success("员工删除成功");
			} else {
				toast.error("删除员工失败");
			}
		} catch (error) {
			toast.error(`删除员工失败: ${(error as Error).message}`);
		}
	};

	// 处理切换员工可用状态
	const handleToggleAvailability = async (id: string) => {
		try {
			const success = await toggleAvailability(id);
			if (success) {
				toast.success("员工状态已更新");
			} else {
				toast.error("更新员工状态失败");
			}
		} catch (error) {
			toast.error(`更新员工状态失败: ${(error as Error).message}`);
		}
	};

	if (!isAuthenticated) {
		return null;
	}

	return (
		<AuthGuard requiredRole="admin">
			<div className="space-y-6">
				<div className="flex justify-between items-center">
					<h1 className="text-2xl font-bold">人员管理</h1>
					<Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
						<DialogTrigger asChild>
							<Button className="flex items-center gap-1">
								<Plus size={16} />
								<span>新增员工</span>
							</Button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-[500px]">
							<DialogHeader>
								<DialogTitle>新增员工</DialogTitle>
								<DialogDescription>
									填写以下信息创建新的员工记录
								</DialogDescription>
							</DialogHeader>
							<div className="grid gap-4 py-4">
								<div className="grid grid-cols-2 gap-4">
									<div className="flex flex-col gap-2">
										<Label htmlFor="name">姓名 *</Label>
										<Input
											id="name"
											name="name"
											value={newStaff.name}
											onChange={handleNewStaffChange}
											placeholder="请输入姓名"
											required
										/>
									</div>
									<div className="flex flex-col gap-2">
										<Label htmlFor="phone">电话 *</Label>
										<Input
											id="phone"
											name="phone"
											value={newStaff.phone}
											onChange={handleNewStaffChange}
											placeholder="请输入电话"
											required
										/>
									</div>
								</div>
								<div className="flex flex-col gap-2">
									<Label htmlFor="idCard">身份证 *</Label>
									<Input
										id="idCard"
										name="idCard"
										value={newStaff.idCard}
										onChange={handleNewStaffChange}
										placeholder="请输入身份证号码"
										required
									/>
								</div>
								<div className="flex flex-col gap-2">
									<Label htmlFor="position">职位</Label>
									<Input
										id="position"
										name="position"
										value={newStaff.position}
										onChange={handleNewStaffChange}
										placeholder="请输入职位"
									/>
								</div>
								<div className="flex items-center gap-2">
									<input
										id="isAvailable"
										name="isAvailable"
										type="checkbox"
										className="h-4 w-4 rounded border-gray-300 text-primary"
										checked={newStaff.isAvailable}
										onChange={handleNewStaffChange}
									/>
									<Label htmlFor="isAvailable">可派遣状态</Label>
								</div>
							</div>
							<DialogFooter>
								<DialogClose asChild>
									<Button variant="outline">取消</Button>
								</DialogClose>
								<Button onClick={handleSubmitNewStaff}>创建</Button>
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
							placeholder="搜索员工姓名、电话、身份证或职位"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
				</div>

				<Card>
					<CardContent className="pt-6">
						<Table>
							<TableCaption>员工列表</TableCaption>
							<TableHeader>
								<TableRow>
									<TableHead>姓名</TableHead>
									<TableHead>电话</TableHead>
									<TableHead>身份证</TableHead>
									<TableHead>职位</TableHead>
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
								) : filteredStaff.length === 0 ? (
									<TableRow>
										<TableCell colSpan={6} className="text-center py-6">
											{searchQuery ? "没有找到匹配的员工" : "暂无员工记录"}
										</TableCell>
									</TableRow>
								) : (
									filteredStaff.map((staff) => (
										<TableRow key={staff.id}>
											<TableCell className="font-medium">{staff.name}</TableCell>
											<TableCell>{staff.phone}</TableCell>
											<TableCell>{staff.idCard}</TableCell>
											<TableCell>{staff.position}</TableCell>
											<TableCell>
												<Badge
													variant={staff.isAvailable ? "default" : "destructive"}
													className="flex items-center gap-1 cursor-pointer"
													onClick={() => handleToggleAvailability(staff.id)}
												>
													{staff.isAvailable ? (
														<>
															<Check size={12} /> 可派遣
														</>
													) : (
														<>
															<X size={12} /> 不可派遣
														</>
													)}
												</Badge>
											</TableCell>
											<TableCell className="text-right">
												<div className="flex justify-end gap-2">
													<Button
														variant="outline"
														size="icon"
														onClick={() => handleStartEdit(staff)}
													>
														<Edit size={16} />
													</Button>
													<ConfirmDeleteDialog
														title="删除员工"
														description="确定要删除这个员工吗？删除后无法恢复。"
														onConfirm={() => handleDeleteStaff(staff.id)}
														trigger={<Trash size={16} />}
													/>
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
												className={page <= 1 ? "pointer-events-none opacity-50" : ""}
											/>
										</PaginationItem>

										{getSmartPaginationPages(page, totalPages).map((item) => (
											<PaginationItem key={item.key}>
												{item.type === 'ellipsis' ? (
													<PaginationEllipsis />
												) : (
													<PaginationLink
														onClick={() => setPage(item.value)}
														isActive={page === item.value}
													>
														{item.value}
													</PaginationLink>
												)}
											</PaginationItem>
										))}

										<PaginationItem>
											<PaginationNext
												onClick={() =>
													setPage((p) => Math.min(totalPages, p + 1))
												}
												className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
											/>
										</PaginationItem>
									</PaginationContent>
								</Pagination>
							</div>
						)}
					</CardContent>
				</Card>

				{/* 编辑员工对话框 */}
				<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
					<DialogContent className="sm:max-w-[500px]">
						<DialogHeader>
							<DialogTitle>编辑员工信息</DialogTitle>
							<DialogDescription>修改员工信息</DialogDescription>
						</DialogHeader>
						{editingStaff && (
							<div className="grid gap-4 py-4">
								<div className="grid grid-cols-2 gap-4">
									<div className="flex flex-col gap-2">
										<Label htmlFor="edit-name">姓名 *</Label>
										<Input
											id="edit-name"
											name="name"
											value={editingStaff.name}
											onChange={handleEditStaffChange}
											placeholder="请输入姓名"
											required
										/>
									</div>
									<div className="flex flex-col gap-2">
										<Label htmlFor="edit-phone">电话 *</Label>
										<Input
											id="edit-phone"
											name="phone"
											value={editingStaff.phone}
											onChange={handleEditStaffChange}
											placeholder="请输入电话"
											required
										/>
									</div>
								</div>
								<div className="flex flex-col gap-2">
									<Label htmlFor="edit-idCard">身份证 *</Label>
									<Input
										id="edit-idCard"
										name="idCard"
										value={editingStaff.idCard}
										onChange={handleEditStaffChange}
										placeholder="请输入身份证号码"
										required
									/>
								</div>
								<div className="flex flex-col gap-2">
									<Label htmlFor="edit-position">职位</Label>
									<Input
										id="edit-position"
										name="position"
										value={editingStaff.position}
										onChange={handleEditStaffChange}
										placeholder="请输入职位"
									/>
								</div>
								<div className="flex items-center gap-2">
									<input
										id="edit-isAvailable"
										name="isAvailable"
										type="checkbox"
										className="h-4 w-4 rounded border-gray-300 text-primary"
										checked={editingStaff.isAvailable}
										onChange={handleEditStaffChange}
									/>
									<Label htmlFor="edit-isAvailable">可派遣状态</Label>
								</div>
							</div>
						)}
						<DialogFooter>
							<DialogClose asChild>
								<Button variant="outline">取消</Button>
							</DialogClose>
							<Button onClick={handleUpdateStaff}>更新</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>
		</AuthGuard>
	);
}
