'use client'

import { useEffect, useState } from "react";
import { useCheckoutStore } from "@/lib/stores/checkout.store";
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
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
    basicServicePrice: z.number().min(0, "价格不能为负数"),
    sortingServicePrice: z.number().min(0, "价格不能为负数"),
    packagingServicePrice: z.number().min(0, "价格不能为负数"),
});

type FormValues = z.infer<typeof formSchema>;

export function CheckoutForm() {
    const [isSaving, setIsSaving] = useState(false);
    const { pricing, loading, error, fetchPricing, updatePricing } = useCheckoutStore();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            basicServicePrice: pricing.basicServicePrice,
            sortingServicePrice: pricing.sortingServicePrice,
            packagingServicePrice: pricing.packagingServicePrice,
        },
    });

    // 加载初始数据
    useEffect(() => {
        fetchPricing();
    }, [fetchPricing]);

    // 当远程数据加载后更新表单
    useEffect(() => {
        if (!loading) {
            form.reset({
                basicServicePrice: pricing.basicServicePrice,
                sortingServicePrice: pricing.sortingServicePrice,
                packagingServicePrice: pricing.packagingServicePrice,
            });
        }
    }, [loading, pricing, form]);

    const onSubmit = async (values: FormValues) => {
        try {
            setIsSaving(true);
            await updatePricing(values);
            toast.success("价格设置已更新");
        } catch (error) {
            toast.error("更新价格设置失败");
        } finally {
            setIsSaving(false);
        }
    };

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                        control={form.control}
                        name="basicServicePrice"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>基础服务价格（元/袋）</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        {...field}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="sortingServicePrice"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>分拣服务价格（元/人/天）</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        {...field}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="packagingServicePrice"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>装卸服务价格（元/人/天）</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        {...field}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Button type="submit" disabled={isSaving || loading}>
                    {isSaving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            保存中...
                        </>
                    ) : (
                        "保存价格设置"
                    )}
                </Button>
            </form>
        </Form>
    );
} 