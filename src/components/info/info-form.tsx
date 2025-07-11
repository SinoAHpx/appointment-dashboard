"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useSystemInfoStore } from "@/lib/stores/info";

const formSchema = z.object({
    notes: z.string().min(1, "请输入备注信息"),
    company_name: z.string().min(1, "请输入公司名称"),
    company_address: z.string().min(1, "请输入公司地址"),
    company_phone: z.string().min(1, "请输入联系电话"),
    company_email: z.string().email("请输入有效的邮箱地址"),
});

export function InfoForm() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);

    // 使用SystemInfoStore管理状态
    const { info, isLoading, error, fetchInfo, updateInfo, clearError } = useSystemInfoStore();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            notes: "",
            company_name: "",
            company_address: "",
            company_phone: "",
            company_email: "",
        },
    });

    useEffect(() => {
        // 只有当没有数据时才获取，避免重复请求
        if (!info && !isLoading) {
            fetchInfo();
        }
    }, [info, isLoading, fetchInfo]);

    useEffect(() => {
        // 当从store获取到数据时，更新表单
        if (info) {
            form.reset(info);
        }
    }, [info, form]);

    useEffect(() => {
        // 处理获取数据时的错误
        if (error) {
            toast.error(`获取系统信息失败: ${error}`);
        }
    }, [error]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            setSaving(true);
            clearError(); // 清除之前的错误

            const success = await updateInfo(values);

            if (success) {
                toast.success("系统信息更新成功");
                router.refresh();
            } else {
                // updateInfo 方法已经处理了错误，这里只需要显示通用错误消息
                throw new Error("更新失败，请重试");
            }
        } catch (error) {
            console.error("更新系统信息失败:", error);
            toast.error("更新系统信息失败");
        } finally {
            setSaving(false);
        }
    }

    // 加载状态显示
    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-32 w-full" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="flex justify-end">
                    <Skeleton className="h-10 w-24" />
                </div>
            </div>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>备注信息</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="请输入备注信息"
                                    className="min-h-[200px]"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="company_name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>公司名称</FormLabel>
                            <FormControl>
                                <Input placeholder="请输入公司名称" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="company_address"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>公司地址</FormLabel>
                            <FormControl>
                                <Input placeholder="请输入公司地址" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="company_phone"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>联系电话</FormLabel>
                            <FormControl>
                                <Input placeholder="请输入联系电话" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="company_email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>电子邮箱</FormLabel>
                            <FormControl>
                                <Input placeholder="请输入电子邮箱" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end">
                    <Button type="submit" disabled={saving || isLoading}>
                        {saving ? "保存中..." : "保存更改"}
                    </Button>
                </div>
            </form>
        </Form>
    );
} 