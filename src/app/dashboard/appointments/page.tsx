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
import { AdminAppointmentTable } from "@/components/appointments/AdminAppointmentTable";
import { AppointmentForm, type AppointmentFormData } from "@/components/appointments/AppointmentForm";
import { AppointmentSearch } from "@/components/appointments/AppointmentSearch";
import { UserAppointmentsList } from "@/components/appointments/UserAppointmentsList";
import {
	type Appointment,
	useAppointmentStore,
	useAuthStore,
} from "@/lib/stores";
import { filterAppointments } from "@/lib/utils/appointments/helpers";
import { Plus } from "lucide-react";
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

	const [page, setPage] = useState(1);
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
	const [searchQuery, setSearchQuery] = useState("");

	// 每页数量
	const perPage = 10;

	// 过滤预约数据
	const filteredAppointments = filterAppointments(appointments, searchQuery);

	// 总页数
	const totalPages = Math.ceil(filteredAppointments.length / perPage);

	// 分页数据
	const paginatedAppointments = filteredAppointments
		.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
		.slice((page - 1) * perPage, page * perPage);

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
		setPage(1); // 重置到第一页
	};

	// 处理清除搜索
	const handleClearSearch = () => {
		setSearchQuery("");
	};

	// 处理新建预约提交
	const handleSubmitNewAppointment = async (formData: AppointmentFormData) => {
		try {
			const success = await addAppointment(formData);
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
			const success = await updateAppointment(
				editingAppointment.id,
				formData,
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

	// 处理页面变更
	const handlePageChange = (newPage: number) => {
		setPage(newPage);
	};

	if (!isAuthenticated) {
		return null;
	}

	return (
		<div className="space-y-6">
			{/* <div className="flex justify-between items-center">
				<h2 className="text-2xl font-bold tracking-tight">
					{isAdmin() ? "预约管理" : "我的预约"}
				</h2>
				
			</div> */}

			{/* 搜索框 */}
			<div className="flex justify-between items-center">
				<AppointmentSearch
					searchQuery={searchQuery}
					onSearchChange={handleSearchChange}
					placeholder={isAdmin() ? "搜索联系人、电话或地址" : "搜索预约记录..."}
				/>
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
				<AdminAppointmentTable
					appointments={paginatedAppointments}
					isLoading={isLoading}
					page={page}
					totalPages={totalPages}
					onPageChange={handlePageChange}
					onEdit={handleStartEdit}
					onDelete={handleDeleteAppointment}
					onStatusUpdate={handleStatusUpdate}
				/>
			) : (
				<UserAppointmentsList
					appointments={paginatedAppointments}
					isLoading={isLoading}
					searchQuery={searchQuery}
					page={page}
					totalPages={totalPages}
					onPageChange={handlePageChange}
					onClearSearch={handleClearSearch}
				/>
			)}

			{/* 编辑预约对话框 */}
			<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
				<DialogContent className="max-w-3xl">
					<DialogHeader>
						<DialogTitle>编辑预约</DialogTitle>
						<DialogDescription>修改预约信息</DialogDescription>
					</DialogHeader>
					{editingAppointment && (
						<AppointmentForm
							isAdmin={isAdmin()}
							initialData={editingAppointment}
							onSubmit={handleUpdateAppointment}
							submitLabel="更新"
						/>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
