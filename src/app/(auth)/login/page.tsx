"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
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
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/lib/store";
import { InfoIcon } from "lucide-react";
import { toast } from "sonner";

const loginSchema = z.object({
	username: z.string().min(2, {
		message: "用户名至少需要2个字符",
	}),
	password: z.string().min(6, {
		message: "密码至少需要6个字符",
	}),
});

export default function LoginPage() {
	const [isLoading, setIsLoading] = useState(false);
	const { login } = useAuthStore();
	const router = useRouter();

	const form = useForm<z.infer<typeof loginSchema>>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			username: "",
			password: "",
		},
	});

	async function onSubmit(values: z.infer<typeof loginSchema>) {
		setIsLoading(true);

		try {
			const success = await login(values.username, values.password);

			if (success) {
				toast("登录成功", {
					description: `欢迎回来，${values.username}`,
				});

				// 获取URL参数中的回调地址
				const searchParams = new URLSearchParams(window.location.search);
				const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

				// 增加足够的延时确保状态和cookie都已更新
				setTimeout(() => {
					try {
						// 添加特殊参数避免中间件重定向循环
						const redirectUrl = new URL(
							callbackUrl.startsWith('/') ? callbackUrl : `/${callbackUrl}`,
							window.location.origin
						);
						redirectUrl.searchParams.set('bypassAuthCheck', 'true');

						// 使用路由器导航，而不是强制刷新页面
						router.push(redirectUrl.pathname + redirectUrl.search);

						// 几秒后移除特殊参数，使用history.replaceState以避免刷新
						setTimeout(() => {
							const cleanUrl = new URL(window.location.href);
							cleanUrl.searchParams.delete('bypassAuthCheck');
							window.history.replaceState({}, '', cleanUrl.toString());
						}, 1000);
					} catch (error) {
						console.error('重定向失败:', error);
						// 如果自定义URL有问题，回退到dashboard
						router.push('/dashboard');
					}
				}, 800); // 延长等待时间确保cookie已设置
			} else {
				toast("登录失败", {
					description: "用户名或密码不正确",
				});
			}
		} catch (error) {
			toast(`登录失败：${error}`, {});
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
			<Card className="w-full max-w-md">
				<CardHeader className="space-y-1">
					<div className="flex justify-center mb-2">
						<Image
							src="/logo.jpeg"
							alt="Logo"
							width={200}
							height={180}
							className="rounded-md"
						/>
					</div>
					<CardTitle className="text-2xl font-bold text-center">
						欢迎登录
					</CardTitle>
					<CardDescription className="text-center">
						请输入您的用户名和密码
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
							<FormField
								control={form.control}
								name="username"
								render={({ field }) => (
									<FormItem>
										<FormLabel>用户名</FormLabel>
										<FormControl>
											<Input placeholder="请输入用户名" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="password"
								render={({ field }) => (
									<FormItem>
										<FormLabel>密码</FormLabel>
										<FormControl>
											<Input
												type="password"
												placeholder="请输入密码"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<Button type="submit" className="w-full" disabled={isLoading}>
								{isLoading ? "登录中..." : "登录"}
							</Button>
						</form>
					</Form>
				</CardContent>
				<CardFooter className="flex justify-center">
					<p className="text-sm text-gray-600">
						还没有账号？{" "}
						<Link
							href="/register"
							className="font-medium text-primary hover:underline"
						>
							立即注册
						</Link>
					</p>
				</CardFooter>
			</Card>
		</div>
	);
}
