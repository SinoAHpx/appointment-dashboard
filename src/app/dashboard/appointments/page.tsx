"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { AppointmentForm, type AppointmentFormData } from "@/components/appointments/form/AppointmentForm";
import { AppointmentSearch } from "@/components/appointments/AppointmentSearch";
import { UserAppointmentsList } from "@/components/appointments/UserAppointmentsList";
import { AppointmentTabs } from "@/components/appointments/AppointmentTabs";
import {
	type Appointment,
	useAppointmentStore,
	useAuthStore,
} from "@/lib/stores";
import { filterAppointments } from "@/lib/utils/appointments/helpers";
import { Plus, RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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

	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [isRefreshing, setIsRefreshing] = useState(false);

	// 过滤预约数据
	const filteredAppointments = filterAppointments(appointments, searchQuery);

	// 如果用户未登录，重定向到登录页面
	useEffect(() => {
		if (!isAuthenticated) {
			router.push("/login");
		} else {
			fetchAppointments();
		}
	}, [isAuthenticated, router, fetchAppointments]);

	// 处理搜索查询变更
	const handleSearchChange = (query: string) => {
		setSearchQuery(query);
	};

	// 处理刷新预约列表
	const handleRefresh = async () => {
		try {
			setIsRefreshing(true);
			await fetchAppointments();
			toast.success("预约列表已刷新");
		} catch (error) {
			toast.error("刷新预约列表失败");
		} finally {
			setIsRefreshing(false);
		}
	};

	// 处理新建预约提交
	const handleSubmitNewAppointment = async (formData: AppointmentFormData) => {
		try {
			// 由于后端API可能尚未更新，我们可以在这里处理新字段
			// 提交时只保留需要的字段，不需要修改后端API

			// 从 documentTypes 中获取 documentCategory 和 documentType
			let documentCategory = 'paper'; // 默认值
			let documentType = 'confidential'; // 默认值

			// 遍历所有类别找到第一个有选中类型的类别作为主类别
			for (const [category, data] of Object.entries(formData.documentTypes)) {
				if (data.types.length > 0) {
					documentCategory = category;
					documentType = data.types[0]; // 使用第一个选择的类型
					break;
				}
			}

			// 添加缺失的字段
			const enrichedFormData = {
				...formData,
				documentCategory,
				documentType
			};

			const success = await addAppointment(enrichedFormData);
			if (success) {
				toast.success("预约创建成功");
				setIsAddDialogOpen(false);
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
	const handleUpdateAppointment = async (formData: AppointmentFormData) => {
		if (!editingAppointment) return;

		try {
			// 由于后端API可能尚未更新，我们可以在这里处理新字段
			// 提交时只保留需要的字段，不需要修改后端API

			// 从 documentTypes 中获取 documentCategory 和 documentType
			let documentCategory = 'paper'; // 默认值
			let documentType = 'confidential'; // 默认值

			// 遍历所有类别找到第一个有选中类型的类别作为主类别
			for (const [category, data] of Object.entries(formData.documentTypes)) {
				if (data.types.length > 0) {
					documentCategory = category;
					documentType = data.types[0]; // 使用第一个选择的类型
					break;
				}
			}

			// 添加缺失的字段
			const enrichedFormData = {
				...formData,
				documentCategory,
				documentType
			};

			const success = await updateAppointment(
				editingAppointment.id,
				enrichedFormData,
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

	// 处理状态更新
	const handleStatusUpdate = async (appointmentId: string, newStatus: Appointment["status"]) => {
		try {
			const success = await updateAppointmentStatus(appointmentId, newStatus);
			if (success) {
				toast.success(`预约状态已更新`);
			} else {
				toast.error("更新预约状态失败");
			}
		} catch (error) {
			toast.error("更新预约状态失败: " + (error as Error).message);
		}
	};

	if (!isAuthenticated) {
		return null;
	}

	return (
		<div className="space-y-6">

			{/* 搜索框 */}
			<div className="flex justify-between items-center">
				<div className="flex items-center gap-2">
					<AppointmentSearch
						searchQuery={searchQuery}
						onSearchChange={handleSearchChange}
						placeholder={isAdmin() ? "搜索联系人、电话或地址" : "搜索预约记录..."}
					/>
					<Button
						variant="outline"
						size="icon"
						onClick={handleRefresh}
						disabled={isRefreshing}
					>
						<RefreshCcw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
					</Button>
				</div>
				<Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
					<DialogTrigger asChild>
						<Button>
							<Plus className="mr-2 h-4 w-4" />
							新建预约
						</Button>
					</DialogTrigger>
					<DialogContent className="max-w-3xl">
						<DialogHeader>
							<DialogTitle>新建预约</DialogTitle>
							<DialogDescription>
								填写以下信息创建新的预约记录
							</DialogDescription>
						</DialogHeader>
						<AppointmentForm
							isAdmin={isAdmin()}
							onSubmit={handleSubmitNewAppointment}
							submitLabel="创建"
						/>
					</DialogContent>
				</Dialog>
			</div>

			{/* 不同用户角色展示不同的界面 */}
			{isAdmin() ? (
				<AppointmentTabs
					appointments={filteredAppointments}
					isLoading={isLoading}
					onEdit={handleStartEdit}
					onDelete={handleDeleteAppointment}
					onStatusUpdate={handleStatusUpdate}
				/>
			) : (
				<UserAppointmentsList
					appointments={filteredAppointments}
					isLoading={isLoading}
				/>
			)}

			{/* 编辑预约对话框 */}
			{editingAppointment && (
				<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
					<DialogContent className="max-w-3xl">
						<DialogHeader>
							<DialogTitle>编辑预约</DialogTitle>
							<DialogDescription>
								更新预约信息
							</DialogDescription>
						</DialogHeader>
						<AppointmentForm
							isAdmin={isAdmin()}
							initialData={editingAppointment}
							onSubmit={handleUpdateAppointment}
							submitLabel="更新"
						/>
					</DialogContent>
				</Dialog>
			)}
		</div>
	);
}
