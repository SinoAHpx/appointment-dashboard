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
import { AuthGuard } from "@/components/AuthGuard";
import { AdminUser, useAuthStore, useUserStore } from "@/lib/store";
import { format } from "date-fns";
import {
	Mail,
	Pencil,
	Plus,
	Search,
	ShieldAlert,
	Trash,
	User,
	UserCog,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function UsersPage() {
	const { isAuthenticated, isAdmin } = useAuthStore();
	const router = useRouter();
	const {
		users,
		isLoading,
		fetchUsers,
		addUser,
		updateUser,
		deleteUser,
	} = useUserStore();

	const [page, setPage] = useState(1);
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");

	// 新建用户表单状态
	const [newUser, setNewUser] = useState({
		username: "",
		password: "",
		name: "",
		email: "",
		role: "user" as "user" | "admin",
	});

	// 编辑用户表单状态
	const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
	// 是否修改密码
	const [isChangingPassword, setIsChangingPassword] = useState(false);
	const [newPassword, setNewPassword] = useState("");

	// 每页数量
	const perPage = 10;
	// 总页数
	const totalPages = Math.ceil(
		users.filter(
			(user) =>
				user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
				user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
				user.role.toLowerCase().includes(searchQuery.toLowerCase()),
		).length / perPage,
	);

	// 过滤并分页用户数据
	const filteredUsers = users
		.filter(
			(user) =>
				user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
				user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
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
		if (value === "admin" || value === "user") {
			setNewUser((prev) => ({
				...prev,
				role: value as "admin" | "user",
			}));
		}
	};

	// 处理编辑用户角色选择变更
	const handleEditRoleChange = (value: string) => {
		if (value === "admin" || value === "user") {
			if (editingUser) {
				setEditingUser({
					...editingUser,
					role: value as "admin" | "user",
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
					email: "",
					role: "user" as "user" | "admin",
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
				email: editingUser.email,
				role: editingUser.role,
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
		if (!confirm("确定要删除这个用户吗？删除后无法恢复。")) return;

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
								<div className="flex flex-col gap-2">
									<Label htmlFor="email">邮箱</Label>
									<Input
										id="email"
										name="email"
										type="email"
										value={newUser.email}
										onChange={handleNewUserChange}
										placeholder="邮箱地址（可选）"
									/>
								</div>
								<div className="flex flex-col gap-2">
									<Label htmlFor="role">角色 *</Label>
									<Select
										value={newUser.role}
										onValueChange={handleRoleChange}
									>
										<SelectTrigger id="role">
											<SelectValue placeholder="选择角色" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="user">普通用户</SelectItem>
											<SelectItem value="admin">管理员</SelectItem>
										</SelectContent>
									</Select>
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
							placeholder="搜索用户名、姓名、邮箱或角色"
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
									<TableHead>邮箱</TableHead>
									<TableHead>角色</TableHead>
									<TableHead>创建时间</TableHead>
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
								) : filteredUsers.length === 0 ? (
									<TableRow>
										<TableCell colSpan={6} className="text-center py-6">
											{searchQuery ? "没有找到匹配的用户" : "暂无用户记录"}
										</TableCell>
									</TableRow>
								) : (
									filteredUsers.map((user) => (
										<TableRow key={user.id}>
											<TableCell>{user.username}</TableCell>
											<TableCell>{user.name}</TableCell>
											<TableCell>{user.email || "-"}</TableCell>
											<TableCell>
												<div className="flex items-center gap-1">
													{user.role === "admin" ? (
														<>
															<ShieldAlert size={16} className="text-red-500" />
															<span>管理员</span>
														</>
													) : (
														<>
															<User size={16} className="text-blue-500" />
															<span>普通用户</span>
														</>
													)}
												</div>
											</TableCell>
											<TableCell>{formatDate(user.createdAt)}</TableCell>
											<TableCell className="text-right">
												<div className="flex justify-end gap-2">
													<Button
														variant="outline"
														size="icon"
														onClick={() => handleStartEdit(user)}
														disabled={user.id === 1}
														title={user.id === 1 ? "不能编辑管理员账户" : "编辑用户"}
													>
														<Pencil size={16} />
													</Button>
													<Button
														variant="outline"
														size="icon"
														onClick={() => handleDeleteUser(user.id)}
														disabled={user.id === 1}
														title={user.id === 1 ? "不能删除管理员账户" : "删除用户"}
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

								<div className="flex flex-col gap-2">
									<Label htmlFor="edit-email">邮箱</Label>
									<Input
										id="edit-email"
										name="email"
										type="email"
										value={editingUser.email || ""}
										onChange={handleEditUserChange}
										placeholder="邮箱地址（可选）"
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
										</SelectContent>
									</Select>
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
			</div>
		</AuthGuard>
	);
}
