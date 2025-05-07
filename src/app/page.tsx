"use client";

import { AuthWrapper } from "@/components/auth-wrapper";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
	const { user, logout, isAuthenticated } = useAuthStore();
	const router = useRouter();

	// 添加自动重定向到 dashboard 的逻辑
	useEffect(() => {
		if (isAuthenticated) {
			router.push("/dashboard");
		}
	}, [isAuthenticated, router]);

	const handleLogout = () => {
		logout();
		router.push("/login");
	};

	// 如果已认证，显示加载状态（避免页面闪烁）
	if (isAuthenticated) {
		return null;
	}

	return (
		<AuthWrapper>
			<div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
				<Card className="w-full max-w-md">
					<CardHeader className="space-y-1">
						<CardTitle className="text-2xl font-bold text-center">
							欢迎
						</CardTitle>
						<CardDescription className="text-center">
							您已成功登录预约管理系统
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="rounded-md bg-gray-100 p-4">
							<p className="text-sm font-medium text-gray-600">用户信息</p>
							<p className="mt-2 text-lg font-semibold">{user?.username}</p>
							<p className="text-sm text-gray-500">用户ID: {user?.id}</p>
						</div>
					</CardContent>
					<CardFooter>
						<Button
							variant="destructive"
							className="w-full"
							onClick={handleLogout}
						>
							退出登录
						</Button>
					</CardFooter>
				</Card>
			</div>
		</AuthWrapper>
	);
}
