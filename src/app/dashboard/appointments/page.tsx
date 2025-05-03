"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	type Appointment,
	useAppointmentStore,
	useAuthStore,
} from "@/lib/store";
import {
	Calendar,
	CheckCircle,
	Clock,
	FileText,
	LayoutList,
	MapPin,
	Pencil,
	Phone,
	Plus,
	RotateCcw,
	Search,
	Trash,
	Truck,
	User,
	XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

// 文件袋类型选项
const documentTypes = [
	{ value: "confidential", label: "保密文件袋" },
	{ value: "standard", label: "普通文件袋" },
	{ value: "large", label: "大型文件盒" },
	{ value: "small", label: "小型文件盒" },
];

export default function AppointmentsPage() {
	const { isAuthenticated, isAdmin } = useAuthStore();
	const router = useRouter();
	const {
		appointments,
		isLoading,
		fetchAppointments,
		addAppointment,
		updateAppointment,
		updateAppointmentStatus,
		deleteAppointment,
	} = useAppointmentStore();

	const [page, setPage] = useState(1);
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
	const [searchQuery, setSearchQuery] = useState("");

	// 新建预约表单状态
	const [newAppointment, setNewAppointment] = useState({
		dateTime: "",
		contactName: "",
		contactPhone: "",
		contactAddress: "",
		documentCount: 1,
		documentType: "confidential",
		notes: "",
		status: "pending" as "pending" | "confirmed" | "in_progress" | "completed" | "cancelled",
		estimatedCompletionTime: "",
		processingNotes: "",
	});

	// 每页数量
	const perPage = 10;
	// 总页数
	const totalPages = Math.ceil(
		appointments.filter(
			(appointment) =>
				(appointment.contactName ?? '')
					.toLowerCase()
					.includes(searchQuery.toLowerCase()) ||
				(appointment.contactPhone ?? '').includes(searchQuery) ||
				(appointment.contactAddress ?? '')
					.toLowerCase()
					.includes(searchQuery.toLowerCase()),
		).length / perPage,
	);

	// 过滤并分页预约数据
	const filteredAppointments = appointments
		.filter(
			(appointment) =>
				(appointment.contactName ?? '')
					.toLowerCase()
					.includes(searchQuery.toLowerCase()) ||
				(appointment.contactPhone ?? '').includes(searchQuery) ||
				(appointment.contactAddress ?? '')
					.toLowerCase()
					.includes(searchQuery.toLowerCase()),
		)
		.sort(
			(a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime(),
		)
		.slice((page - 1) * perPage, page * perPage);

	// 如果用户未登录，重定向到登录页面
	useEffect(() => {
		if (!isAuthenticated) {
			router.push("/login");
		} else {
			fetchAppointments();
		}
	}, [isAuthenticated, router, fetchAppointments]);

	// 处理新建预约表单变更
	const handleNewAppointmentChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { name, value } = e.target;
		setNewAppointment((prev) => ({
			...prev,
			[name]: name === "documentCount" ? parseInt(value) || 0 : value,
		}));
	};

	// 处理文件类型选择变更
	const handleDocumentTypeChange = (value: string) => {
		setNewAppointment((prev) => ({
			...prev,
			documentType: value,
		}));
	};

	// 处理编辑预约表单变更
	const handleEditAppointmentChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { name, value } = e.target;
		if (editingAppointment) {
			setEditingAppointment((prev) => ({
				...prev!,
				[name]: name === "documentCount" ? parseInt(value) || 0 : value,
			}));
		}
	};

	// 处理编辑中的文件类型选择变更
	const handleEditDocumentTypeChange = (value: string) => {
		if (editingAppointment) {
			setEditingAppointment((prev) => ({
				...prev!,
				documentType: value,
			}));
		}
	};

	// 处理新建预约提交
	const handleSubmitNewAppointment = async () => {
		// 表单验证
		if (
			!newAppointment.dateTime ||
			!newAppointment.contactName ||
			!newAppointment.contactPhone ||
			!newAppointment.contactAddress
		) {
			toast.error("请填写所有必填项");
			return;
		}

		try {
			const success = await addAppointment(newAppointment);
			if (success) {
				toast.success("预约创建成功");
				setIsAddDialogOpen(false);
				// 重置表单
				setNewAppointment({
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
			} else {
				toast.error("创建预约失败");
			}
		} catch (error) {
			toast.error("创建预约失败: " + (error as Error).message);
		}
	};

	// 开始编辑预约
	const handleStartEdit = (appointment: Appointment) => {
		setEditingAppointment(appointment);
		setIsEditDialogOpen(true);
	};

	// 处理更新预约提交
	const handleUpdateAppointment = async () => {
		if (!editingAppointment) return;

		// 表单验证
		if (
			!editingAppointment.dateTime ||
			!editingAppointment.contactName ||
			!editingAppointment.contactPhone ||
			!editingAppointment.contactAddress
		) {
			toast.error("请填写所有必填项");
			return;
		}

		try {
			const success = await updateAppointment(
				editingAppointment.id,
				editingAppointment,
			);
			if (success) {
				toast.success("预约更新成功");
				setIsEditDialogOpen(false);
				setEditingAppointment(null);
			} else {
				toast.error("更新预约失败");
			}
		} catch (error) {
			toast.error("更新预约失败: " + (error as Error).message);
		}
	};

	// 处理删除预约
	const handleDeleteAppointment = async (id: string) => {
		if (!confirm("确定要删除这个预约吗？")) return;

		try {
			const success = await deleteAppointment(id);
			if (success) {
				toast.success("预约删除成功");
			} else {
				toast.error("删除预约失败");
			}
		} catch (error) {
			toast.error("删除预约失败: " + (error as Error).message);
		}
	};

	// 格式化日期时间
	const formatDateTime = (dateTimeStr: string) => {
		const date = new Date(dateTimeStr);
		return new Intl.DateTimeFormat("zh-CN", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		}).format(date);
	};

	// 处理状态更新
	const handleStatusUpdate = async (appointmentId: string, newStatus: Appointment["status"]) => {
		try {
			const success = await updateAppointmentStatus(appointmentId, newStatus);
			if (success) {
				toast.success(`预约状态已更新为${getStatusLabel(newStatus)}`);
			} else {
				toast.error("更新预约状态失败");
			}
		} catch (error) {
			toast.error("更新预约状态失败: " + (error as Error).message);
		}
	};

	// 获取状态标签
	const getStatusLabel = (status: string) => {
		switch (status) {
			case "pending":
				return "待确认";
			case "confirmed":
				return "已确认";
			case "in_progress":
				return "处理中";
			case "completed":
				return "已完成";
			case "cancelled":
				return "已取消";
			default:
				return status;
		}
	};

	// 获取状态颜色
	const getStatusColor = (status: string) => {
		switch (status) {
			case "pending":
				return "bg-yellow-100 text-yellow-800";
			case "confirmed":
				return "bg-blue-100 text-blue-800";
			case "in_progress":
				return "bg-purple-100 text-purple-800";
			case "completed":
				return "bg-green-100 text-green-800";
			case "cancelled":
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	// 在 TableCell 中渲染状态和操作按钮
	const renderStatusCell = (appointment: Appointment) => {
		if (isAdmin()) {
			return (
				<div className="flex items-center gap-2">
					<span
						className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}
					>
						{getStatusLabel(appointment.status)}
					</span>
					<Popover>
						<PopoverTrigger asChild>
							<Button
								variant="outline"
								size="sm"
								className="ml-2 h-7 px-2 text-xs"
							>
								处理
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-56 p-2">
							<div className="grid gap-1">
								<h4 className="text-sm font-semibold mb-1">更新状态</h4>
								<Button
									variant="ghost"
									size="sm"
									className={`justify-start text-xs ${appointment.status === "pending" ? "bg-secondary" : ""}`}
									onClick={() => handleStatusUpdate(appointment.id, "pending")}
									disabled={appointment.status === "pending"}
								>
									<RotateCcw className="mr-2 h-4 w-4" />
									待确认
								</Button>
								<Button
									variant="ghost"
									size="sm"
									className={`justify-start text-xs ${appointment.status === "confirmed" ? "bg-secondary" : ""}`}
									onClick={() => handleStatusUpdate(appointment.id, "confirmed")}
									disabled={appointment.status === "confirmed"}
								>
									<Clock className="mr-2 h-4 w-4" />
									已确认
								</Button>
								<Button
									variant="ghost"
									size="sm"
									className={`justify-start text-xs ${appointment.status === "in_progress" ? "bg-secondary" : ""}`}
									onClick={() => handleStatusUpdate(appointment.id, "in_progress")}
									disabled={appointment.status === "in_progress"}
								>
									<Truck className="mr-2 h-4 w-4" />
									处理中
								</Button>
								<Button
									variant="ghost"
									size="sm"
									className={`justify-start text-xs ${appointment.status === "completed" ? "bg-secondary" : ""}`}
									onClick={() => handleStatusUpdate(appointment.id, "completed")}
									disabled={appointment.status === "completed"}
								>
									<CheckCircle className="mr-2 h-4 w-4" />
									已完成
								</Button>
								<Button
									variant="ghost"
									size="sm"
									className={`justify-start text-xs ${appointment.status === "cancelled" ? "bg-secondary" : ""}`}
									onClick={() => handleStatusUpdate(appointment.id, "cancelled")}
									disabled={appointment.status === "cancelled"}
								>
									<XCircle className="mr-2 h-4 w-4" />
									已取消
								</Button>
							</div>
						</PopoverContent>
					</Popover>
				</div>
			);
		} else {
			return (
				<span
					className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}
				>
					{getStatusLabel(appointment.status)}
				</span>
			);
		}
	};

	if (!isAuthenticated) {
		return null;
	}

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold">预约管理</h1>
				<Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
					<DialogTrigger asChild>
						<Button className="flex items-center gap-1">
							<Plus size={16} />
							<span>新建预约</span>
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-[500px]">
						<DialogHeader>
							<DialogTitle>新建预约</DialogTitle>
							<DialogDescription>
								填写以下信息创建新的预约记录
							</DialogDescription>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<div className="grid grid-cols-2 gap-4">
								<div className="flex flex-col gap-2">
									<Label htmlFor="dateTime">预约时间 *</Label>
									<Input
										id="dateTime"
										name="dateTime"
										type="datetime-local"
										value={newAppointment.dateTime}
										onChange={handleNewAppointmentChange}
										required
									/>
								</div>
								<div className="flex flex-col gap-2">
									<Label htmlFor="contactName">联系人 *</Label>
									<Input
										id="contactName"
										name="contactName"
										value={newAppointment.contactName}
										onChange={handleNewAppointmentChange}
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
										value={newAppointment.contactPhone}
										onChange={handleNewAppointmentChange}
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
										value={newAppointment.documentCount}
										onChange={handleNewAppointmentChange}
										required
									/>
								</div>
							</div>
							<div className="flex flex-col gap-2">
								<Label htmlFor="documentType">文件类型 *</Label>
								<Select
									value={newAppointment.documentType}
									onValueChange={handleDocumentTypeChange}
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
									value={newAppointment.contactAddress}
									onChange={handleNewAppointmentChange}
									placeholder="请输入联系地址"
									required
								/>
							</div>
							<div className="flex flex-col gap-2">
								<Label htmlFor="notes">备注</Label>
								<Textarea
									id="notes"
									name="notes"
									value={newAppointment.notes}
									onChange={handleNewAppointmentChange}
									placeholder="请输入备注信息"
									rows={3}
								/>
							</div>
						</div>
						<DialogFooter>
							<DialogClose asChild>
								<Button variant="outline">取消</Button>
							</DialogClose>
							<Button onClick={handleSubmitNewAppointment}>创建</Button>
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
						placeholder="搜索联系人、电话或地址"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
			</div>

			<Card>
				<CardContent className="pt-6">
					<Table>
						<TableCaption>预约列表</TableCaption>
						<TableHeader>
							<TableRow>
								<TableHead>预约编号</TableHead>
								<TableHead>预约时间</TableHead>
								<TableHead>联系人</TableHead>
								<TableHead>联系电话</TableHead>
								<TableHead>地址</TableHead>
								<TableHead>文件数量</TableHead>
								<TableHead>文件类型</TableHead>
								<TableHead>状态</TableHead>
								{isAdmin() && (
									<TableHead className="text-right">操作</TableHead>
								)}
							</TableRow>
						</TableHeader>
						<TableBody>
							{isLoading ? (
								<TableRow>
									<TableCell
										colSpan={isAdmin() ? 9 : 8}
										className="text-center py-6"
									>
										加载中...
									</TableCell>
								</TableRow>
							) : filteredAppointments.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={isAdmin() ? 9 : 8}
										className="text-center py-6"
									>
										{searchQuery ? "没有找到匹配的预约" : "暂无预约记录"}
									</TableCell>
								</TableRow>
							) : (
								filteredAppointments.map((appointment) => (
									<TableRow key={appointment.id}>
										<TableCell>
											<Badge variant="outline" className="font-mono font-medium">
												{appointment.appointmentId || `APT-${appointment.id}`}
											</Badge>
										</TableCell>
										<TableCell>{formatDateTime(appointment.dateTime)}</TableCell>
										<TableCell>{appointment.contactName}</TableCell>
										<TableCell>{appointment.contactPhone}</TableCell>
										<TableCell className="max-w-xs truncate">
											{appointment.contactAddress}
										</TableCell>
										<TableCell>{appointment.documentCount}</TableCell>
										<TableCell>
											{documentTypes.find(
												(t) => t.value === appointment.documentType,
											)?.label || appointment.documentType}
										</TableCell>
										<TableCell>
											{renderStatusCell(appointment)}
										</TableCell>
										{isAdmin() && (
											<TableCell className="text-right">
												<div className="flex justify-end gap-2">
													<TooltipProvider>
														<Tooltip>
															<TooltipTrigger asChild>
																<Button
																	variant="outline"
																	size="icon"
																	onClick={() => handleStartEdit(appointment)}
																>
																	<Pencil size={16} />
																</Button>
															</TooltipTrigger>
															<TooltipContent>
																<p>编辑预约</p>
															</TooltipContent>
														</Tooltip>
													</TooltipProvider>
													<TooltipProvider>
														<Tooltip>
															<TooltipTrigger asChild>
																<Button
																	variant="outline"
																	size="icon"
																	onClick={() =>
																		handleDeleteAppointment(appointment.id)
																	}
																>
																	<Trash size={16} />
																</Button>
															</TooltipTrigger>
															<TooltipContent>
																<p>删除预约</p>
															</TooltipContent>
														</Tooltip>
													</TooltipProvider>
												</div>
											</TableCell>
										)}
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
										<PaginationItem key={i}>
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

			{/* 编辑预约对话框 - 只有管理员能访问 */}
			{isAdmin() && (
				<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
					<DialogContent className="sm:max-w-[500px]">
						<DialogHeader>
							<DialogTitle>编辑预约</DialogTitle>
							<DialogDescription>修改预约信息</DialogDescription>
						</DialogHeader>
						{editingAppointment && (
							<div className="grid gap-4 py-4">
								<div className="grid grid-cols-2 gap-4">
									<div className="flex flex-col gap-2">
										<Label htmlFor="edit-dateTime">预约时间 *</Label>
										<Input
											id="edit-dateTime"
											name="dateTime"
											type="datetime-local"
											value={editingAppointment.dateTime}
											onChange={handleEditAppointmentChange}
											required
										/>
									</div>
									<div className="flex flex-col gap-2">
										<Label htmlFor="edit-contactName">联系人 *</Label>
										<Input
											id="edit-contactName"
											name="contactName"
											value={editingAppointment.contactName}
											onChange={handleEditAppointmentChange}
											placeholder="请输入联系人姓名"
											required
										/>
									</div>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div className="flex flex-col gap-2">
										<Label htmlFor="edit-contactPhone">联系电话 *</Label>
										<Input
											id="edit-contactPhone"
											name="contactPhone"
											value={editingAppointment.contactPhone}
											onChange={handleEditAppointmentChange}
											placeholder="请输入联系电话"
											required
										/>
									</div>
									<div className="flex flex-col gap-2">
										<Label htmlFor="edit-documentCount">文件数量 *</Label>
										<Input
											id="edit-documentCount"
											name="documentCount"
											type="number"
											min="1"
											value={editingAppointment.documentCount}
											onChange={handleEditAppointmentChange}
											required
										/>
									</div>
								</div>
								<div className="flex flex-col gap-2">
									<Label htmlFor="edit-documentType">文件类型 *</Label>
									<Select
										value={editingAppointment.documentType}
										onValueChange={handleEditDocumentTypeChange}
									>
										<SelectTrigger id="edit-documentType">
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
									<Label htmlFor="edit-contactAddress">联系地址 *</Label>
									<Input
										id="edit-contactAddress"
										name="contactAddress"
										value={editingAppointment.contactAddress}
										onChange={handleEditAppointmentChange}
										placeholder="请输入联系地址"
										required
									/>
								</div>
								<div className="flex flex-col gap-2">
									<Label htmlFor="edit-status">状态 *</Label>
									<Select
										value={editingAppointment.status}
										onValueChange={(value) =>
											setEditingAppointment({
												...editingAppointment,
												status: value as any,
											})
										}
									>
										<SelectTrigger id="edit-status">
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
									<Label htmlFor="edit-estimatedCompletionTime">预计完成时间</Label>
									<Input
										id="edit-estimatedCompletionTime"
										name="estimatedCompletionTime"
										type="datetime-local"
										value={editingAppointment.estimatedCompletionTime || ""}
										onChange={handleEditAppointmentChange}
									/>
								</div>
								<div className="flex flex-col gap-2">
									<Label htmlFor="edit-processingNotes">处理备注</Label>
									<Textarea
										id="edit-processingNotes"
										name="processingNotes"
										value={editingAppointment.processingNotes || ""}
										onChange={handleEditAppointmentChange}
										placeholder="请输入处理相关的备注信息"
										rows={3}
									/>
								</div>
								<div className="flex flex-col gap-2">
									<Label htmlFor="edit-notes">客户备注</Label>
									<Textarea
										id="edit-notes"
										name="notes"
										value={editingAppointment.notes || ""}
										onChange={handleEditAppointmentChange}
										placeholder="请输入备注信息"
										rows={3}
									/>
								</div>
							</div>
						)}
						<DialogFooter>
							<DialogClose asChild>
								<Button variant="outline">取消</Button>
							</DialogClose>
							<Button onClick={handleUpdateAppointment}>更新</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}
		</div>
	);
}
