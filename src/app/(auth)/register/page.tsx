"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
import { useAuthStore } from "@/lib/stores";
import { toast } from "sonner";
import { Upload, FileImage } from "lucide-react";

const registerSchema = z
	.object({
		username: z.string().min(2, {
			message: "用户名至少需要2个字符",
		}),
		password: z.string().min(6, {
			message: "密码至少需要6个字符",
		}),
		confirmPassword: z.string().min(6, {
			message: "确认密码至少需要6个字符",
		}),
		name: z.string().min(1, {
			message: "请输入真实姓名",
		}),
		phone: z.string().min(11, {
			message: "请输入有效的手机号码",
		}),
		contract: z.any().refine((file) => file instanceof File, {
			message: "请上传合同图片",
		}),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "两次输入的密码不匹配",
		path: ["confirmPassword"],
	});

export default function RegisterPage() {
	const [isLoading, setIsLoading] = useState(false);
	const [contractFile, setContractFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const router = useRouter();

	const form = useForm<z.infer<typeof registerSchema>>({
		resolver: zodResolver(registerSchema),
		defaultValues: {
			username: "",
			password: "",
			confirmPassword: "",
			name: "",
			phone: "",
		},
	});

	// 处理文件上传
	function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		if (file) {
			// 验证文件类型
			if (!file.type.startsWith("image/")) {
				toast.error("请上传图片文件");
				return;
			}

			// 验证文件大小（5MB）
			if (file.size > 5 * 1024 * 1024) {
				toast.error("文件大小不能超过5MB");
				return;
			}

			setContractFile(file);
			form.setValue("contract", file);

			// 创建预览
			const reader = new FileReader();
			reader.onload = (e) => {
				setPreviewUrl(e.target?.result as string);
			};
			reader.readAsDataURL(file);
		}
	}

	async function onSubmit(values: z.infer<typeof registerSchema>) {
		setIsLoading(true);

		try {
			// 第一步：注册用户
			const registerResponse = await fetch("/api/auth/register", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					username: values.username,
					password: values.password,
					name: values.name,
					phone: values.phone,
				}),
			});

			const registerData = await registerResponse.json();

			if (!registerResponse.ok) {
				throw new Error(registerData.error || "注册失败");
			}

			// 第二步：上传合同文件
			if (contractFile && registerData.user) {
				const formData = new FormData();
				formData.append("file", contractFile);
				formData.append("userId", registerData.user.id.toString());

				const uploadResponse = await fetch("/api/contracts/upload", {
					method: "POST",
					body: formData,
				});

				const uploadData = await uploadResponse.json();

				if (!uploadResponse.ok) {
					throw new Error(uploadData.error || "合同上传失败");
				}
			}

			toast.success("注册成功", {
				description: "您的注册申请已提交，请等待管理员审核。审核通过后您将能够正常使用系统。",
			});

			// 跳转到登录页面
			router.push("/login");
		} catch (error) {
			console.error("注册失败:", error);
			toast.error("注册失败", {
				description: error instanceof Error ? error.message : "请稍后再试",
			});
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
			<Card className="w-full max-w-md">
				<CardHeader className="space-y-1">
					<div className="flex justify-center mb-6">
						<Image
							src="/logo.jpeg"
							alt="Logo"
							width={100}
							height={95}
							className="rounded-md"
						/>
					</div>
					<CardTitle className="text-2xl font-bold text-center">
						注册账号
					</CardTitle>
					<CardDescription className="text-center">
						创建一个新账号以使用预约系统。注册后需要管理员审核。
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
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>真实姓名</FormLabel>
										<FormControl>
											<Input placeholder="请输入真实姓名" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="phone"
								render={({ field }) => (
									<FormItem>
										<FormLabel>手机号码</FormLabel>
										<FormControl>
											<Input placeholder="请输入手机号码" {...field} />
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
								name="confirmPassword"
								render={({ field }) => (
									<FormItem>
										<FormLabel>确认密码</FormLabel>
										<FormControl>
											<Input
												type="password"
												placeholder="请再次输入密码"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* 合同上传部分 */}
							<FormField
								control={form.control}
								name="contract"
								render={({ field }) => (
									<FormItem>
										<FormLabel>合同模板</FormLabel>
										<FormControl>
											<div className="space-y-4">
												<div className="flex items-center justify-center w-full">
													<label
														htmlFor="contract-upload"
														className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
													>
														<div className="flex flex-col items-center justify-center pt-5 pb-6">
															{previewUrl ? (
																<FileImage className="w-8 h-8 mb-2 text-green-500" />
															) : (
																<Upload className="w-8 h-8 mb-2 text-gray-500" />
															)}
															<p className="mb-2 text-sm text-gray-500">
																{contractFile
																	? contractFile.name
																	: "点击上传合同图片"}
															</p>
															<p className="text-xs text-gray-500">
																支持 PNG, JPG, JPEG (最大 5MB)
															</p>
														</div>
														<input
															id="contract-upload"
															type="file"
															className="hidden"
															accept="image/*"
															onChange={handleFileChange}
														/>
													</label>
												</div>
												{previewUrl && (
													<div className="mt-4">
														<Image
															src={previewUrl}
															alt="合同预览"
															width={200}
															height={150}
															className="mx-auto rounded-lg border"
														/>
													</div>
												)}
											</div>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<Button type="submit" className="w-full" disabled={isLoading}>
								{isLoading ? "注册中..." : "注册"}
							</Button>
						</form>
					</Form>
				</CardContent>
				<CardFooter className="flex justify-center">
					<p className="text-sm text-gray-600">
						已有账号？{" "}
						<Link
							href="/login"
							className="font-medium text-primary hover:underline"
						>
							立即登录
						</Link>
					</p>
				</CardFooter>
			</Card>
		</div>
	);
}
