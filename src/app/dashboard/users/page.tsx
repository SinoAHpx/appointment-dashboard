"use client";

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
import { type CustomerUser, useAuthStore, useCustomerStore } from "@/lib/store";
import {
	Building,
	Mail,
	MapPin,
	Pencil,
	Phone,
	Plus,
	Search,
	Trash,
	User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function UsersPage() {
	const { isAuthenticated } = useAuthStore();
	const router = useRouter();
	const {
		customers,
		isLoading,
		fetchCustomers,
		addCustomer,
		updateCustomer,
		deleteCustomer,
	} = useCustomerStore();

	const [page, setPage] = useState(1);
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");

	// 新建用户表单状态
	const [newCustomer, setNewCustomer] = useState({
		name: "",
		phone: "",
		email: "",
		address: "",
		company: "",
	});

	// 编辑用户表单状态
	const [editingCustomer, setEditingCustomer] = useState<CustomerUser | null>(
		null,
	);

	// 每页数量
	const perPage = 10;
	// 总页数
	const totalPages = Math.ceil(
		customers.filter(
			(customer) =>
				customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				customer.phone.includes(searchQuery) ||
				customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(customer.company &&
					customer.company.toLowerCase().includes(searchQuery.toLowerCase())),
		).length / perPage,
	);

	// 过滤并分页用户数据
	const filteredCustomers = customers
		.filter(
			(customer) =>
				customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				customer.phone.includes(searchQuery) ||
				customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(customer.company &&
					customer.company.toLowerCase().includes(searchQuery.toLowerCase())),
		)
		.sort((a, b) => a.name.localeCompare(b.name))
		.slice((page - 1) * perPage, page * perPage);

	// 如果用户未登录，重定向到登录页面
	useEffect(() => {
		if (!isAuthenticated) {
			router.push("/login");
		} else {
			fetchCustomers();
		}
	}, [isAuthenticated, router, fetchCustomers]);

	// 处理新建用户表单变更
	const handleNewCustomerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setNewCustomer((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	// 处理编辑用户表单变更
	const handleEditCustomerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		if (editingCustomer) {
			setEditingCustomer({
				...editingCustomer,
				[name]: value,
			});
		}
	};

	// 处理新建用户提交
	const handleSubmitNewCustomer = async () => {
		// 表单验证
		if (
			!newCustomer.name ||
			!newCustomer.phone ||
			!newCustomer.email ||
			!newCustomer.address
		) {
			toast.error("请填写所有必填项");
			return;
		}

		try {
			const success = await addCustomer(newCustomer);
			if (success) {
				toast.success("用户创建成功");
				setIsAddDialogOpen(false);
				// 重置表单
				setNewCustomer({
					name: "",
					phone: "",
					email: "",
					address: "",
					company: "",
				});
			} else {
				toast.error("创建用户失败");
			}
		} catch (error) {
			toast.error(`创建用户失败: ${(error as Error).message}`);
		}
	};

	// 开始编辑用户
	const handleStartEdit = (customer: CustomerUser) => {
		setEditingCustomer(customer);
		setIsEditDialogOpen(true);
	};

	// 处理更新用户提交
	const handleUpdateCustomer = async () => {
		if (!editingCustomer) return;

		// 表单验证
		if (
			!editingCustomer.name ||
			!editingCustomer.phone ||
			!editingCustomer.email ||
			!editingCustomer.address
		) {
			toast.error("请填写所有必填项");
			return;
		}

		try {
			const success = await updateCustomer(editingCustomer.id, editingCustomer);
			if (success) {
				toast.success("用户更新成功");
				setIsEditDialogOpen(false);
				setEditingCustomer(null);
			} else {
				toast.error("更新用户失败");
			}
		} catch (error) {
			toast.error(`更新用户失败: ${(error as Error).message}`);
		}
	};

	// 处理删除用户
	const handleDeleteCustomer = async (id: string) => {
		if (!confirm("确定要删除这个用户吗？删除后无法恢复。")) return;

		try {
			const success = await deleteCustomer(id);
			if (success) {
				toast.success("用户删除成功");
			} else {
				toast.error("删除用户失败");
			}
		} catch (error) {
			toast.error(`删除用户失败: ${(error as Error).message}`);
		}
	};

	if (!isAuthenticated) {
		return null;
	}

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold">用户管理</h1>
				<Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
					<DialogTrigger asChild>
						<Button className="flex items-center gap-1">
							<Plus size={16} />
							<span>新建用户</span>
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-[500px]">
						<DialogHeader>
							<DialogTitle>新建用户</DialogTitle>
							<DialogDescription>
								填写以下信息创建新的用户记录
							</DialogDescription>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<div className="grid grid-cols-2 gap-4">
								<div className="flex flex-col gap-2">
									<Label htmlFor="name">姓名 *</Label>
									<Input
										id="name"
										name="name"
										value={newCustomer.name}
										onChange={handleNewCustomerChange}
										placeholder="请输入姓名"
										required
									/>
								</div>
								<div className="flex flex-col gap-2">
									<Label htmlFor="phone">电话 *</Label>
									<Input
										id="phone"
										name="phone"
										value={newCustomer.phone}
										onChange={handleNewCustomerChange}
										placeholder="请输入电话"
										required
									/>
								</div>
							</div>
							<div className="flex flex-col gap-2">
								<Label htmlFor="email">邮箱 *</Label>
								<Input
									id="email"
									name="email"
									type="email"
									value={newCustomer.email}
									onChange={handleNewCustomerChange}
									placeholder="请输入邮箱"
									required
								/>
							</div>
							<div className="flex flex-col gap-2">
								<Label htmlFor="address">地址 *</Label>
								<Input
									id="address"
									name="address"
									value={newCustomer.address}
									onChange={handleNewCustomerChange}
									placeholder="请输入地址"
									required
								/>
							</div>
							<div className="flex flex-col gap-2">
								<Label htmlFor="company">公司</Label>
								<Input
									id="company"
									name="company"
									value={newCustomer.company}
									onChange={handleNewCustomerChange}
									placeholder="请输入公司名称（可选）"
								/>
							</div>
						</div>
						<DialogFooter>
							<DialogClose asChild>
								<Button variant="outline">取消</Button>
							</DialogClose>
							<Button onClick={handleSubmitNewCustomer}>创建</Button>
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
						placeholder="搜索用户姓名、电话、邮箱或公司"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
			</div>

			<Card>
				<CardContent className="pt-6">
					<Table>
						<TableCaption>用户列表</TableCaption>
						<TableHeader>
							<TableRow>
								<TableHead>姓名</TableHead>
								<TableHead>电话</TableHead>
								<TableHead>邮箱</TableHead>
								<TableHead>地址</TableHead>
								<TableHead>公司</TableHead>
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
							) : filteredCustomers.length === 0 ? (
								<TableRow>
									<TableCell colSpan={6} className="text-center py-6">
										{searchQuery ? "没有找到匹配的用户" : "暂无用户记录"}
									</TableCell>
								</TableRow>
							) : (
								filteredCustomers.map((customer) => (
									<TableRow key={customer.id}>
										<TableCell>{customer.name}</TableCell>
										<TableCell>{customer.phone}</TableCell>
										<TableCell>{customer.email}</TableCell>
										<TableCell className="max-w-xs truncate">
											{customer.address}
										</TableCell>
										<TableCell>{customer.company || "-"}</TableCell>
										<TableCell className="text-right">
											<div className="flex justify-end gap-2">
												<Button
													variant="outline"
													size="icon"
													onClick={() => handleStartEdit(customer)}
												>
													<Pencil size={16} />
												</Button>
												<Button
													variant="outline"
													size="icon"
													onClick={() => handleDeleteCustomer(customer.id)}
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
										<PaginationItem key={`page-${i}`}>
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

			{/* 编辑用户对话框 */}
			<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
				<DialogContent className="sm:max-w-[500px]">
					<DialogHeader>
						<DialogTitle>编辑用户</DialogTitle>
						<DialogDescription>修改用户信息</DialogDescription>
					</DialogHeader>
					{editingCustomer && (
						<div className="grid gap-4 py-4">
							<div className="grid grid-cols-2 gap-4">
								<div className="flex flex-col gap-2">
									<Label htmlFor="edit-name">姓名 *</Label>
									<Input
										id="edit-name"
										name="name"
										value={editingCustomer.name}
										onChange={handleEditCustomerChange}
										placeholder="请输入姓名"
										required
									/>
								</div>
								<div className="flex flex-col gap-2">
									<Label htmlFor="edit-phone">电话 *</Label>
									<Input
										id="edit-phone"
										name="phone"
										value={editingCustomer.phone}
										onChange={handleEditCustomerChange}
										placeholder="请输入电话"
										required
									/>
								</div>
							</div>
							<div className="flex flex-col gap-2">
								<Label htmlFor="edit-email">邮箱 *</Label>
								<Input
									id="edit-email"
									name="email"
									type="email"
									value={editingCustomer.email}
									onChange={handleEditCustomerChange}
									placeholder="请输入邮箱"
									required
								/>
							</div>
							<div className="flex flex-col gap-2">
								<Label htmlFor="edit-address">地址 *</Label>
								<Input
									id="edit-address"
									name="address"
									value={editingCustomer.address}
									onChange={handleEditCustomerChange}
									placeholder="请输入地址"
									required
								/>
							</div>
							<div className="flex flex-col gap-2">
								<Label htmlFor="edit-company">公司</Label>
								<Input
									id="edit-company"
									name="company"
									value={editingCustomer.company || ""}
									onChange={handleEditCustomerChange}
									placeholder="请输入公司名称（可选）"
								/>
							</div>
						</div>
					)}
					<DialogFooter>
						<DialogClose asChild>
							<Button variant="outline">取消</Button>
						</DialogClose>
						<Button onClick={handleUpdateCustomer}>更新</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
