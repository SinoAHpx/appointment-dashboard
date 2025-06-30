"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuthGuard } from "@/components/AuthGuard";
import { AdminUser, useUserStore, useAuthStore } from "@/lib/stores";
import { ContractManagement } from "@/components/contracts/contract-management";
import { format } from "date-fns";
import {
	Pencil,
	Plus,
	Search,
	ShieldAlert,
	Trash,
	User,
	Edit,
	FileCheck,
	FileX,
	Users,
	FileImage,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { Switch } from "@/components/ui/switch";

export default function UsersPage() {
	const {
		users,
		isLoading,
		fetchUsers,
		addUser,
		updateUser,
		deleteUser,
	} = useUserStore();
	const { user } = useAuthStore();

	const [page, setPage] = useState(1);
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [activeTab, setActiveTab] = useState("users");

	// 新建用户表单状态
	const [newUser, setNewUser] = useState({
		username: "",
		password: "",
		name: "",
		phone: "",
		role: "user" as "user" | "admin" | "waste_disposal_merchant",
		isGovUser: false,
	});

	// 编辑用户表单状态
	const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
	// 是否修改密码
	const [isChangingPassword, setIsChangingPassword] = useState(false);
	const [newPassword, setNewPassword] = useState("");

	// Initial管理员密码修改状态
	const [isInitialAdminPasswordDialogOpen, setIsInitialAdminPasswordDialogOpen] = useState(false);
	const [initialAdminNewPassword, setInitialAdminNewPassword] = useState("");

	// 每页数量
	const perPage = 10;
	// 总页数
	const totalPages = Math.ceil(
		users.filter(
			(user) =>
				user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
				user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(user.phone && user.phone.toLowerCase().includes(searchQuery.toLowerCase())) ||
				user.role.toLowerCase().includes(searchQuery.toLowerCase()),
		).length / perPage,
	);

	// 过滤并分页用户数据
	const filteredUsers = users
		.filter(
			(user) =>
				user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
				user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(user.phone && user.phone.toLowerCase().includes(searchQuery.toLowerCase())) ||
				user.role.toLowerCase().includes(searchQuery.toLowerCase()),
		)
		.sort((a, b) => a.username.localeCompare(b.username))
		.slice((page - 1) * perPage, page * perPage);

	// 加载用户数据
	useEffect(() => {
		fetchUsers();
	}, [fetchUsers]);

	// 处理新建用户表单变更
	const handleNewUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setNewUser((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	// 处理角色选择变更
	const handleRoleChange = (value: string) => {
		if (value === "admin" || value === "user" || value === "waste_disposal_merchant") {
			setNewUser((prev) => ({
				...prev,
				role: value as "admin" | "user" | "waste_disposal_merchant",
			}));
		}
	};

	// 处理编辑用户角色选择变更
	const handleEditRoleChange = (value: string) => {
		if (value === "admin" || value === "user" || value === "waste_disposal_merchant") {
			if (editingUser) {
				setEditingUser({
					...editingUser,
					role: value as "admin" | "user" | "waste_disposal_merchant",
				});
			}
		}
	};

	// 处理编辑用户表单变更
	const handleEditUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		if (editingUser) {
			setEditingUser({
				...editingUser,
				[name]: value,
			});
		}
	};

	// 处理新建用户提交
	const handleSubmitNewUser = async () => {
		// 表单验证
		if (
			!newUser.username ||
			!newUser.password ||
			!newUser.name
		) {
			toast.error("请填写所有必填项");
			return;
		}

		if (newUser.username.length < 3) {
			toast.error("用户名长度不能少于3个字符");
			return;
		}

		if (newUser.password.length < 6) {
			toast.error("密码长度不能少于6个字符");
			return;
		}

		try {
			const success = await addUser(newUser);
			if (success) {
				toast.success("用户创建成功");
				setIsAddDialogOpen(false);
				// 重置表单
				setNewUser({
					username: "",
					password: "",
					name: "",
					phone: "",
					role: "user" as "user" | "admin" | "waste_disposal_merchant",
					isGovUser: false,
				});
			} else {
				toast.error("创建用户失败");
			}
		} catch (error) {
			toast.error(`创建用户失败: ${(error as Error).message}`);
		}
	};

	// 开始编辑用户
	const handleStartEdit = (user: AdminUser) => {
		setEditingUser(user);
		setIsEditDialogOpen(true);
		setIsChangingPassword(false);
		setNewPassword("");
	};

	// 处理更新用户提交
	const handleUpdateUser = async () => {
		if (!editingUser) return;

		// 表单验证
		if (
			!editingUser.username ||
			!editingUser.name
		) {
			toast.error("请填写所有必填项");
			return;
		}

		if (editingUser.username.length < 3) {
			toast.error("用户名长度不能少于3个字符");
			return;
		}

		// 验证密码
		if (isChangingPassword) {
			if (newPassword.length < 6) {
				toast.error("密码长度不能少于6个字符");
				return;
			}
		}

		try {
			// 准备更新数据
			const updateData: Partial<AdminUser> = {
				username: editingUser.username,
				name: editingUser.name,
				phone: editingUser.phone,
				role: editingUser.role,
				isGovUser: editingUser.isGovUser,
			};

			// 如果修改了密码，添加密码字段
			if (isChangingPassword) {
				updateData.password = newPassword;
			}

			const success = await updateUser(editingUser.id, updateData);
			if (success) {
				toast.success("用户更新成功");
				setIsEditDialogOpen(false);
				setEditingUser(null);
				setIsChangingPassword(false);
				setNewPassword("");
			} else {
				toast.error("更新用户失败");
			}
		} catch (error) {
			toast.error(`更新用户失败: ${(error as Error).message}`);
		}
	};

	// 处理删除用户
	const handleDeleteUser = async (id: number) => {
		try {
			const success = await deleteUser(id);
			if (success) {
				toast.success("用户删除成功");
			} else {
				toast.error("删除用户失败");
			}
		} catch (error) {
			toast.error(`删除用户失败: ${(error as Error).message}`);
		}
	};

	// 开始修改Initial管理员密码
	const handleStartInitialAdminPasswordChange = () => {
		setIsInitialAdminPasswordDialogOpen(true);
		setInitialAdminNewPassword("");
	};

	// 处理Initial管理员密码修改
	const handleUpdateInitialAdminPassword = async () => {
		// 表单验证
		if (initialAdminNewPassword.length < 6) {
			toast.error("密码长度不能少于6个字符");
			return;
		}

		try {
			const updateData = {
				password: initialAdminNewPassword,
			};

			const success = await updateUser(1, updateData);
			if (success) {
				toast.success("管理员密码修改成功");
				setIsInitialAdminPasswordDialogOpen(false);
				setInitialAdminNewPassword("");
			} else {
				toast.error("修改密码失败");
			}
		} catch (error) {
			toast.error(`修改密码失败: ${(error as Error).message}`);
		}
	};

	// 格式化日期
	const formatDate = (dateString: string) => {
		try {
			return format(new Date(dateString), "yyyy-MM-dd HH:mm");
		} catch (error) {
			return dateString;
		}
	};

	return (
		<AuthGuard requiredRole="admin">
			<div className="space-y-6">
				<div className="flex justify-between items-center">
					<h1 className="text-2xl font-bold">用户与合同管理</h1>
				</div>

				<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="users" className="flex items-center gap-2">
							<Users className="w-4 h-4" />
							用户管理
						</TabsTrigger>
						<TabsTrigger value="contracts" className="flex items-center gap-2">
							<FileImage className="w-4 h-4" />
							合同管理
						</TabsTrigger>
					</TabsList>

					<TabsContent value="users" className="space-y-6">
						<div className="flex justify-between items-center">
							<h2 className="text-lg font-semibold">用户管理</h2>
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
											创建可以登录系统的新用户
										</DialogDescription>
									</DialogHeader>
									<div className="grid gap-4 py-4">
										<div className="grid grid-cols-2 gap-4">
											<div className="flex flex-col gap-2">
												<Label htmlFor="username">用户名 *</Label>
												<Input
													id="username"
													name="username"
													value={newUser.username}
													onChange={handleNewUserChange}
													placeholder="登录用户名"
													required
												/>
											</div>
											<div className="flex flex-col gap-2">
												<Label htmlFor="name">姓名 *</Label>
												<Input
													id="name"
													name="name"
													value={newUser.name}
													onChange={handleNewUserChange}
													placeholder="用户姓名"
													required
												/>
											</div>
										</div>
										<div className="flex flex-col gap-2">
											<Label htmlFor="password">密码 *</Label>
											<Input
												id="password"
												name="password"
												type="password"
												value={newUser.password}
												onChange={handleNewUserChange}
												placeholder="密码"
												required
											/>
										</div>
										<div className="grid grid-cols-2 gap-4">
											<div className="flex flex-col gap-2">
												<Label htmlFor="phone">手机号</Label>
												<Input
													id="phone"
													name="phone"
													type="tel"
													value={newUser.phone}
													onChange={handleNewUserChange}
													placeholder="手机号码（可选）"
												/>
											</div>
											<div className="flex flex-col gap-2">
												<Label htmlFor="role">角色 *</Label>
												<Select
													value={newUser.role}
													onValueChange={handleRoleChange}
												>
													<SelectTrigger className="w-full" id="role">
														<SelectValue placeholder="选择角色" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="user">普通用户</SelectItem>
														<SelectItem value="admin">管理员</SelectItem>
														<SelectItem value="waste_disposal_merchant">尾料处置商</SelectItem>
													</SelectContent>
												</Select>
											</div>
										</div>
										<div className="flex items-center justify-between">
											<Label htmlFor="isGovUser">是否为政府用户</Label>
											<Switch
												id="isGovUser"
												checked={newUser.isGovUser}
												onCheckedChange={(checked) => setNewUser(prev => ({ ...prev, isGovUser: checked }))}
											/>
										</div>
									</div>
									<DialogFooter>
										<DialogClose asChild>
											<Button variant="outline">取消</Button>
										</DialogClose>
										<Button onClick={handleSubmitNewUser}>创建</Button>
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
									placeholder="搜索用户名、姓名、手机号或角色"
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
											<TableHead>用户名</TableHead>
											<TableHead>姓名</TableHead>
											<TableHead>手机号</TableHead>
											<TableHead>角色</TableHead>
											<TableHead>政府用户</TableHead>
											<TableHead>创建时间</TableHead>
											<TableHead className="text-right">操作</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{isLoading ? (
											<TableRow>
												<TableCell colSpan={7} className="text-center py-6">
													加载中...
												</TableCell>
											</TableRow>
										) : filteredUsers.length === 0 ? (
											<TableRow>
												<TableCell colSpan={7} className="text-center py-6">
													{searchQuery ? "没有找到匹配的用户" : "暂无用户记录"}
												</TableCell>
											</TableRow>
										) : (
											filteredUsers.map((user) => (
												<TableRow key={user.id}>
													<TableCell>{user.username}</TableCell>
													<TableCell>{user.name}</TableCell>
													<TableCell>{user.phone || "-"}</TableCell>
													<TableCell>
														<div className="flex items-center gap-1">
															{user.role === "admin" ? (
																<>
																	<ShieldAlert size={16} className="text-red-500" />
																	<span>管理员</span>
																</>
															) : user.role === "waste_disposal_merchant" ? (
																<>
																	<FileImage size={16} className="text-purple-500" />
																	<span>尾料处置商</span>
																</>
															) : (
																<>
																	<User size={16} className="text-blue-500" />
																	<span>普通用户</span>
																</>
															)}
														</div>
													</TableCell>
													<TableCell>
														<div className="flex items-center gap-1">
															{user.isGovUser ? (
																<>
																	<FileCheck size={16} className="text-green-500" />
																	<span>是</span>
																</>
															) : (
																<>
																	<FileX size={16} className="text-gray-500" />
																	<span>否</span>
																</>
															)}
														</div>
													</TableCell>
													<TableCell>{formatDate(user.createdAt)}</TableCell>
													<TableCell className="text-right">
														<div className="flex justify-end gap-2">
															{user.id === 1 ? (
																// Initial管理员账号只能修改密码
																<Button
																	variant="outline"
																	size="sm"
																	onClick={handleStartInitialAdminPasswordChange}
																	title="修改管理员密码"
																>
																	修改密码
																</Button>
															) : (
																// 其他用户可以完整编辑
																<>
																	<Button
																		variant="outline"
																		size="icon"
																		onClick={() => handleStartEdit(user)}
																		title="编辑用户"
																	>
																		<Edit size={16} />
																	</Button>
																	<ConfirmDeleteDialog
																		title="删除用户"
																		description="确定要删除这个用户吗？删除后无法恢复。"
																		onConfirm={() => handleDeleteUser(user.id)}
																		trigger={<Trash size={16} />}
																		disabled={false}
																	/>
																</>
															)}
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
					</TabsContent>

					<TabsContent value="contracts">
						<ContractManagement />
					</TabsContent>
				</Tabs>

				{/* 编辑用户对话框 */}
				<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
					<DialogContent className="sm:max-w-[500px]">
						<DialogHeader>
							<DialogTitle>编辑用户</DialogTitle>
							<DialogDescription>修改用户信息</DialogDescription>
						</DialogHeader>
						{editingUser && (
							<div className="grid gap-4 py-4">
								<div className="grid grid-cols-2 gap-4">
									<div className="flex flex-col gap-2">
										<Label htmlFor="edit-username">用户名 *</Label>
										<Input
											id="edit-username"
											name="username"
											value={editingUser.username}
											onChange={handleEditUserChange}
											placeholder="登录用户名"
											required
										/>
									</div>
									<div className="flex flex-col gap-2">
										<Label htmlFor="edit-name">姓名 *</Label>
										<Input
											id="edit-name"
											name="name"
											value={editingUser.name}
											onChange={handleEditUserChange}
											placeholder="用户姓名"
											required
										/>
									</div>
								</div>

								<div className="flex flex-col gap-2">
									<div className="flex items-center justify-between">
										<Label htmlFor="edit-password">密码</Label>
										<Button
											variant="outline"
											size="sm"
											onClick={() => setIsChangingPassword(!isChangingPassword)}
										>
											{isChangingPassword ? "取消修改密码" : "修改密码"}
										</Button>
									</div>
									{isChangingPassword && (
										<Input
											id="edit-password"
											name="password"
											type="password"
											value={newPassword}
											onChange={(e) => setNewPassword(e.target.value)}
											placeholder="新密码"
										/>
									)}
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div className="flex flex-col gap-2">
										<Label htmlFor="edit-phone">手机号</Label>
										<Input
											id="edit-phone"
											name="phone"
											type="tel"
											value={editingUser.phone || ""}
											onChange={handleEditUserChange}
											placeholder="手机号码（可选）"
										/>
									</div>
									<div className="flex flex-col gap-2">
										<Label htmlFor="edit-role">角色 *</Label>
										<Select
											value={editingUser.role}
											onValueChange={handleEditRoleChange}
										>
											<SelectTrigger id="edit-role">
												<SelectValue placeholder="选择角色" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="user">普通用户</SelectItem>
												<SelectItem value="admin">管理员</SelectItem>
												<SelectItem value="waste_disposal_merchant">尾料处置商</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>

								<div className="flex items-center justify-between">
									<Label htmlFor="edit-isGovUser">是否为政府用户</Label>
									<Switch
										id="edit-isGovUser"
										checked={editingUser.isGovUser}
										onCheckedChange={(checked) =>
											setEditingUser(prev => prev ? { ...prev, isGovUser: checked } : null)
										}
									/>
								</div>
							</div>
						)}
						<DialogFooter>
							<DialogClose asChild>
								<Button variant="outline">取消</Button>
							</DialogClose>
							<Button onClick={handleUpdateUser}>更新</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* Initial管理员密码修改对话框 */}
				<Dialog open={isInitialAdminPasswordDialogOpen} onOpenChange={setIsInitialAdminPasswordDialogOpen}>
					<DialogContent className="sm:max-w-[400px]">
						<DialogHeader>
							<DialogTitle>
								修改管理员密码
							</DialogTitle>
							<DialogDescription>
								为初始管理员账号设置新密码
							</DialogDescription>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<div className="flex flex-col gap-2">
								<Label htmlFor="initial-admin-password">新密码 *</Label>
								<Input
									id="initial-admin-password"
									type="password"
									value={initialAdminNewPassword}
									onChange={(e) => setInitialAdminNewPassword(e.target.value)}
									placeholder="请输入新密码（至少6个字符）"
									required
								/>
							</div>
						</div>
						<DialogFooter>
							<DialogClose asChild>
								<Button variant="outline">取消</Button>
							</DialogClose>
							<Button onClick={handleUpdateInitialAdminPassword}>
								更新密码
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>
		</AuthGuard>
	);
}
