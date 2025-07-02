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
import { HistoryAppointmentsList } from "@/components/appointments/HistoryAppointmentsList";
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
	const [showHistory, setShowHistory] = useState(false);

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

	// 处理显示历史预约
	const handleShowHistory = () => {
		setShowHistory(true);
	};

	// 处理返回当前预约
	const handleBackToCurrent = () => {
		setShowHistory(false);
	};

	// 处理新建预约提交
	const handleSubmitNewAppointment = async (formData: AppointmentFormData) => {
		try {
			// 计算总文档数量（从新的数据结构中）
			const totalDocumentCount = Object.values(formData.documentTypes).reduce((total, category) => {
				return total + Object.values(category.items).reduce((sum, item) => {
					// 适配新的数据结构：item 现在是对象 { count: number; customName?: string }
					return sum + (item?.count || 0);
				}, 0);
			}, 0);

			// 转换新的文档类型结构为数据库格式
			const documentTypesJson = JSON.stringify({
				paper: {
					items: formData.documentTypes.paper?.items || {}
				},
				electronic: {
					items: formData.documentTypes.magnetic?.items || {}
				},
				other: {
					items: formData.documentTypes.other?.items || {}
				}
			});

			// 从新的documentTypes结构中获取documentCategory和documentType (向后兼容)
			let documentCategory = 'paper'; // 默认值
			let documentType = 'confidential'; // 默认值

			// 遍历所有类别找到第一个有文档的类别作为主类别
			for (const [category, data] of Object.entries(formData.documentTypes)) {
				const hasItems = Object.keys(data.items).length > 0;
				if (hasItems) {
					documentCategory = category;
					documentType = Object.keys(data.items)[0]; // 使用第一个选择的类型
					break;
				}
			}

			// 准备符合AppointmentFormData类型的提交数据
			const submitData = {
				dateTime: formData.dateTime,
				contactName: formData.contactName,
				contactPhone: formData.contactPhone,
				contactAddress: formData.contactAddress,
				documentCount: formData.documentCount || totalDocumentCount,
				documentCategory: documentCategory,
				documentType: documentType,
				documentTypesJson: documentTypesJson,
				notes: formData.notes,
				status: formData.status,
				estimatedCompletionTime: formData.estimatedCompletionTime,
				processingNotes: formData.processingNotes,
				assignedStaff: formData.assignedStaff,
				assignedVehicles: formData.assignedVehicles,
			};

			// 记录重要的数据用于调试
			console.log("创建预约数据:", {
				assignedStaff: formData.assignedStaff,
				assignedVehicles: formData.assignedVehicles,
				documentTypesJson,
				totalDocumentCount
			});

			const success = await addAppointment(submitData);
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
			// 计算总文档数量（从新的数据结构中）
			const totalDocumentCount = Object.values(formData.documentTypes).reduce((total, category) => {
				return total + Object.values(category.items).reduce((sum, item) => {
					// 适配新的数据结构：item 现在是对象 { count: number; customName?: string }
					return sum + (item?.count || 0);
				}, 0);
			}, 0);

			// 转换新的文档类型结构为数据库格式
			const documentTypesJson = JSON.stringify({
				paper: {
					items: formData.documentTypes.paper?.items || {}
				},
				electronic: {
					items: formData.documentTypes.magnetic?.items || {}
				},
				other: {
					items: formData.documentTypes.other?.items || {}
				}
			});

			// 从新的documentTypes结构中获取documentCategory和documentType (向后兼容)
			let documentCategory = 'paper'; // 默认值
			let documentType = 'confidential'; // 默认值

			// 遍历所有类别找到第一个有文档的类别作为主类别
			for (const [category, data] of Object.entries(formData.documentTypes)) {
				const hasItems = Object.keys(data.items).length > 0;
				if (hasItems) {
					documentCategory = category;
					documentType = Object.keys(data.items)[0]; // 使用第一个选择的类型
					break;
				}
			}

			// 准备符合AppointmentFormData类型的提交数据
			const submitData = {
				dateTime: formData.dateTime,
				contactName: formData.contactName,
				contactPhone: formData.contactPhone,
				contactAddress: formData.contactAddress,
				documentCount: formData.documentCount || totalDocumentCount,
				documentCategory: documentCategory,
				documentType: documentType,
				documentTypesJson: documentTypesJson,
				notes: formData.notes,
				status: formData.status,
				estimatedCompletionTime: formData.estimatedCompletionTime,
				processingNotes: formData.processingNotes,
				assignedStaff: formData.assignedStaff,
				assignedVehicles: formData.assignedVehicles,
			};

			// 记录重要的数据用于调试
			console.log("更新预约数据:", {
				appointmentId: editingAppointment.id,
				assignedStaff: formData.assignedStaff,
				assignedVehicles: formData.assignedVehicles,
				documentTypesJson,
				totalDocumentCount
			});

			const success = await updateAppointment(
				editingAppointment.id,
				submitData,
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

	// 如果显示历史预约，渲染历史预约组件
	if (showHistory) {
		if (isAdmin()) {
			// 管理员在历史预约页面使用搜索过滤
			return (
				<HistoryAppointmentsList
					appointments={filteredAppointments}
					isLoading={isLoading}
					onBack={handleBackToCurrent}
				/>
			);
		} else {
			// 普通用户历史预约不使用搜索过滤（内置搜索）
			return (
				<HistoryAppointmentsList
					appointments={appointments}
					isLoading={isLoading}
					onBack={handleBackToCurrent}
				/>
			);
		}
	}

	return (
		<div className="space-y-6">
			{/* 搜索框（只在当前预约页面显示） */}
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
					<DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
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
					onShowHistory={handleShowHistory}
				/>
			)}

			{/* 编辑预约对话框 */}
			{editingAppointment && (
				<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
					<DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
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
