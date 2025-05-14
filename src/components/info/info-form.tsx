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
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const formSchema = z.object({
    notes: z.string().min(1, "请输入备注信息"),
    company_name: z.string().min(1, "请输入公司名称"),
    company_address: z.string().min(1, "请输入公司地址"),
    company_phone: z.string().min(1, "请输入联系电话"),
    company_email: z.string().email("请输入有效的邮箱地址"),
});

export function InfoForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

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
        // 获取初始数据
        fetch("/api/info")
            .then((res) => res.json())
            .then((data) => {
                if (data) {
                    form.reset(data);
                }
            })
            .catch((error) => {
                console.error("获取系统信息失败:", error);
                toast.error("获取系统信息失败");
            });
    }, [form]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            setLoading(true);
            const response = await fetch("/api/info", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                throw new Error("更新失败");
            }

            toast.success("系统信息更新成功");
            router.refresh();
        } catch (error) {
            console.error("更新系统信息失败:", error);
            toast.error("更新系统信息失败");
        } finally {
            setLoading(false);
        }
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
                    <Button type="submit" disabled={loading}>
                        {loading ? "保存中..." : "保存更改"}
                    </Button>
                </div>
            </form>
        </Form>
    );
} 