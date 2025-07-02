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
import { Captcha } from "@/components/ui/captcha";
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
	captcha: z.string().min(4, {
		message: "请输入4位验证码",
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
			captcha: "",
		},
	});

	async function onSubmit(values: z.infer<typeof loginSchema>) {
		setIsLoading(true);

		try {
			// 发送包含验证码的登录请求
			const response = await fetch('/api/auth', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					username: values.username,
					password: values.password,
					captcha: values.captcha,
				}),
			});

			const result = await response.json();

			if (result.success && result.user) {
				// 1. 更新Zustand中的用户状态
				useAuthStore.getState().setUser(result.user);

				toast("登录成功", {
					description: `欢迎回来，${result.user.username}`,
				});

				// 2. 获取回调URL，如果没有则默认为/dashboard
				const searchParams = new URLSearchParams(window.location.search);
				const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

				// 3. 使用router.push进行干净的重定向
				// AuthGuard将处理新页面的授权检查
				router.push(callbackUrl);
			} else {
				toast("登录失败", {
					description: result.message || "用户名或密码不正确",
				});

				// 如果是验证码错误，清空验证码输入并刷新验证码
				if (result.message?.includes('验证码')) {
					form.setValue('captcha', '');
					// 延迟一点点时间，让表单清空后再刷新验证码
					setTimeout(() => {
						// 触发验证码刷新
						const refreshElement = document.querySelector('[data-refresh-captcha]') as HTMLElement;
						if (refreshElement) {
							refreshElement.click();
						}
					}, 100);
				}
			}
		} catch (error) {
			toast(`登录失败：${error}`, {});
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
			<Card className="w-full max-w-4xl overflow-hidden">
				<div className="flex min-h-[600px]">
					{/* 左侧Logo区域 */}
					<div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-center lg:p-8">
						<div className="max-w-sm">
							<Image
								src="/logo.jpeg"
								alt="Logo"
								width={300}
								height={270}
								className="rounded-lg"
							/>
						</div>
					</div>

					{/* 右侧登录表单区域 */}
					<div className="flex flex-1 flex-col justify-between lg:p-8 p-6">
						{/* 表单主体区域 - 垂直居中 */}
						<div className="flex flex-col justify-center flex-1">
							<CardHeader className="space-y-1 px-0 pt-0">
								{/* 在小屏幕上显示logo */}
								<div className="flex justify-center mb-4 lg:hidden">
									<Image
										src="/logo.jpeg"
										alt="Logo"
										width={150}
										height={135}
										className="rounded-md"
									/>
								</div>
								<CardTitle className="text-2xl font-bold text-center lg:text-left">
									欢迎登录
								</CardTitle>
								<CardDescription className="text-center lg:text-left">
									请输入您的用户名和密码
								</CardDescription>
							</CardHeader>
							<CardContent className="px-0">
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
										<FormField
											control={form.control}
											name="captcha"
											render={({ field }) => (
												<FormItem>
													<FormLabel>验证码</FormLabel>
													<div className="flex items-center space-x-2">
														<FormControl>
															<Input
																placeholder="请输入验证码"
																maxLength={4}
																className="uppercase flex-1"
																{...field}
																onChange={(e) => {
																	// 自动转换为大写
																	const value = e.target.value.toUpperCase();
																	field.onChange(value);
																}}
															/>
														</FormControl>
														<div className="w-[120px]">
															<Captcha />
														</div>
													</div>
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
						</div>

						{/* 注册链接 - 固定在底部 */}
						<CardFooter className="px-0 pb-0 mt-6">
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
					</div>
				</div>
			</Card>
		</div>
	);
}
