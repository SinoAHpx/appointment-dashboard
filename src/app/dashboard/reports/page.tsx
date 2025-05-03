"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
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
import {
	type ReportFilters,
	useAppointmentStore,
	useAuthStore,
	useReportStore,
	useStaffStore,
	useVehicleStore,
} from "@/lib/store";
import {
	Calendar,
	Download,
	FileDown,
	FileSpreadsheet,
	Filter,
	RefreshCcw,
	Search,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function ReportsPage() {
	const { isAuthenticated } = useAuthStore();
	const router = useRouter();
	const { reportData, isLoading, fetchReportData, exportToCSV, exportToExcel } =
		useReportStore();
	const { staffList } = useStaffStore();
	const { vehicles } = useVehicleStore();

	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(10);
	const [filters, setFilters] = useState<ReportFilters>({
		startDate: "",
		endDate: "",
		status: "",
		staffId: "",
		vehicleId: "",
	});

	// 状态选项
	const statusOptions = [
		{ value: "all", label: "全部状态" },
		{ value: "pending", label: "待确认" },
		{ value: "confirmed", label: "已确认" },
		{ value: "completed", label: "已完成" },
		{ value: "cancelled", label: "已取消" },
	];

	// 如果用户未登录，重定向到登录页面
	useEffect(() => {
		if (!isAuthenticated) {
			router.push("/login");
		} else {
			// 初始加载数据
			handleSearch();
		}
	}, [isAuthenticated, router]);

	// 获取总页数
	const getTotalPages = () => {
		if (!reportData?.appointments) return 1;
		return Math.ceil(reportData.appointments.length / perPage);
	};

	// 获取当前页数据
	const getCurrentPageData = () => {
		if (!reportData?.appointments) return [];
		const startIndex = (page - 1) * perPage;
		return reportData.appointments.slice(startIndex, startIndex + perPage);
	};

	// 处理筛选表单变更
	const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFilters((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	// 处理下拉选择变更
	const handleSelectChange = (name: string, value: string) => {
		setFilters((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	// 执行搜索
	const handleSearch = async () => {
		try {
			await fetchReportData(filters);
			setPage(1); // 重置到第一页
		} catch (error) {
			toast.error(`查询失败: ${(error as Error).message}`);
		}
	};

	// 重置过滤器
	const handleReset = () => {
		setFilters({
			startDate: "",
			endDate: "",
			status: "",
			staffId: "",
			vehicleId: "",
		});
		// 重置后自动查询
		fetchReportData({});
	};

	// 导出为CSV
	const handleExportCSV = async () => {
		try {
			const success = await exportToCSV(filters);
			if (success) {
				toast.success("CSV导出成功");
			} else {
				toast.error("CSV导出失败");
			}
		} catch (error) {
			toast.error(`CSV导出失败: ${(error as Error).message}`);
		}
	};

	// 导出为Excel
	const handleExportExcel = async () => {
		try {
			const success = await exportToExcel(filters);
			if (success) {
				toast.success("Excel导出成功");
			} else {
				toast.error("Excel导出失败");
			}
		} catch (error) {
			toast.error(`Excel导出失败: ${(error as Error).message}`);
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

	// 获取状态标签
	const getStatusLabel = (status: string) => {
		switch (status) {
			case "pending":
				return "待确认";
			case "confirmed":
				return "已确认";
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
			case "completed":
				return "bg-green-100 text-green-800";
			case "cancelled":
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	if (!isAuthenticated) {
		return null;
	}

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold">数据查询与导出</h1>
				<div className="flex gap-2">
					<Button
						variant="outline"
						className="flex items-center gap-1"
						onClick={handleExportCSV}
						disabled={isLoading || !reportData?.appointments?.length}
					>
						<FileDown size={16} />
						<span>导出CSV</span>
					</Button>
					<Button
						className="flex items-center gap-1"
						onClick={handleExportExcel}
						disabled={isLoading || !reportData?.appointments?.length}
					>
						<FileSpreadsheet size={16} />
						<span>导出Excel</span>
					</Button>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>筛选条件</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						<div className="flex flex-col gap-2">
							<Label htmlFor="startDate">开始日期</Label>
							<Input
								id="startDate"
								name="startDate"
								type="date"
								value={filters.startDate}
								onChange={handleFilterChange}
							/>
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor="endDate">结束日期</Label>
							<Input
								id="endDate"
								name="endDate"
								type="date"
								value={filters.endDate}
								onChange={handleFilterChange}
							/>
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor="status">状态</Label>
							<Select
								value={filters.status}
								onValueChange={(value) => handleSelectChange("status", value)}
							>
								<SelectTrigger id="status">
									<SelectValue placeholder="选择状态" />
								</SelectTrigger>
								<SelectContent>
									{statusOptions.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor="staffId">人员</Label>
							<Select
								value={filters.staffId}
								onValueChange={(value) => handleSelectChange("staffId", value)}
							>
								<SelectTrigger id="staffId">
									<SelectValue placeholder="选择人员" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">全部人员</SelectItem>
									{staffList.map((staff) => (
										<SelectItem key={staff.id} value={staff.id}>
											{staff.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor="vehicleId">车辆</Label>
							<Select
								value={filters.vehicleId}
								onValueChange={(value) =>
									handleSelectChange("vehicleId", value)
								}
							>
								<SelectTrigger id="vehicleId">
									<SelectValue placeholder="选择车辆" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">全部车辆</SelectItem>
									{vehicles.map((vehicle) => (
										<SelectItem key={vehicle.id} value={vehicle.id}>
											{vehicle.plateNumber} ({vehicle.model})
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="flex items-end gap-2">
							<Button
								className="flex items-center gap-1"
								onClick={handleSearch}
								disabled={isLoading}
							>
								<Search size={16} />
								<span>查询</span>
							</Button>
							<Button
								variant="outline"
								className="flex items-center gap-1"
								onClick={handleReset}
								disabled={isLoading}
							>
								<RefreshCcw size={16} />
								<span>重置</span>
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{reportData && (
				<Card>
					<CardHeader>
						<CardTitle>查询结果</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
							<Card>
								<CardContent className="pt-6">
									<div className="text-center">
										<p className="text-sm text-gray-500">总预约数</p>
										<h3 className="text-3xl font-bold mt-1">
											{reportData.totalAppointments}
										</h3>
									</div>
								</CardContent>
							</Card>
							<Card>
								<CardContent className="pt-6">
									<div className="text-center">
										<p className="text-sm text-gray-500">已完成</p>
										<h3 className="text-3xl font-bold mt-1 text-green-600">
											{reportData.completedAppointments}
										</h3>
									</div>
								</CardContent>
							</Card>
							<Card>
								<CardContent className="pt-6">
									<div className="text-center">
										<p className="text-sm text-gray-500">待确认/已确认</p>
										<h3 className="text-3xl font-bold mt-1 text-blue-600">
											{reportData.pendingAppointments}
										</h3>
									</div>
								</CardContent>
							</Card>
							<Card>
								<CardContent className="pt-6">
									<div className="text-center">
										<p className="text-sm text-gray-500">已取消</p>
										<h3 className="text-3xl font-bold mt-1 text-red-600">
											{reportData.cancelledAppointments}
										</h3>
									</div>
								</CardContent>
							</Card>
						</div>

						<Table>
							<TableCaption>
								预约数据 - 共 {reportData.appointments.length} 条记录
							</TableCaption>
							<TableHeader>
								<TableRow>
									<TableHead>预约时间</TableHead>
									<TableHead>联系人</TableHead>
									<TableHead>联系电话</TableHead>
									<TableHead>地址</TableHead>
									<TableHead>文件数量</TableHead>
									<TableHead>状态</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{isLoading ? (
									<TableRow>
										<TableCell colSpan={6} className="text-center py-6">
											加载中...
										</TableCell>
									</TableRow>
								) : getCurrentPageData().length === 0 ? (
									<TableRow>
										<TableCell colSpan={6} className="text-center py-6">
											没有找到匹配的记录
										</TableCell>
									</TableRow>
								) : (
									getCurrentPageData().map((appointment) => (
										<TableRow key={appointment.id}>
											<TableCell>
												{formatDateTime(appointment.dateTime)}
											</TableCell>
											<TableCell>{appointment.contactName}</TableCell>
											<TableCell>{appointment.contactPhone}</TableCell>
											<TableCell className="max-w-xs truncate">
												{appointment.contactAddress}
											</TableCell>
											<TableCell>{appointment.documentCount}</TableCell>
											<TableCell>
												<span
													className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}
												>
													{getStatusLabel(appointment.status)}
												</span>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>

						{getTotalPages() > 1 && (
							<div className="mt-4 flex justify-between items-center">
								<div>
									<Select
										value={String(perPage)}
										onValueChange={(value) => {
											setPerPage(Number(value));
											setPage(1); // 重置到第一页
										}}
									>
										<SelectTrigger className="w-[120px]">
											<SelectValue placeholder="每页显示" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="10">每页 10 条</SelectItem>
											<SelectItem value="20">每页 20 条</SelectItem>
											<SelectItem value="50">每页 50 条</SelectItem>
											<SelectItem value="100">每页 100 条</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<Pagination>
									<PaginationContent>
										<PaginationItem>
											<PaginationPrevious
												onClick={() => setPage((p) => Math.max(1, p - 1))}
												isActive={page === 1}
											/>
										</PaginationItem>

										{Array.from({ length: getTotalPages() })
											.map((_, i) => (
												<PaginationItem key={`page-${i}`}>
													<PaginationLink
														onClick={() => setPage(i + 1)}
														isActive={page === i + 1}
													>
														{i + 1}
													</PaginationLink>
												</PaginationItem>
											))
											.slice(
												Math.max(0, page - 3),
												Math.min(getTotalPages(), page + 2),
											)}

										<PaginationItem>
											<PaginationNext
												onClick={() =>
													setPage((p) => Math.min(getTotalPages(), p + 1))
												}
												isActive={false}
											/>
										</PaginationItem>
									</PaginationContent>
								</Pagination>
							</div>
						)}
					</CardContent>
				</Card>
			)}
		</div>
	);
}
