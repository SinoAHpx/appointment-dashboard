'use client'

import { useEffect, useState } from "react";
import { useCheckoutStore } from "@/lib/stores/checkout.store";
import { useForm, FieldPath } from "react-hook-form";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// 动态创建表单模式的函数
function createFormSchema(serviceItems: any[]) {
    const schema: Record<string, any> = {};

    serviceItems.forEach(item => {
        schema[`service_${item.id}`] = z.number().min(0, "价格不能为负数");
    });

    return z.object(schema);
}

// 动态表单类型
type DynamicFormValues = Record<string, number>;

export function CheckoutForm() {
    const [isSaving, setIsSaving] = useState(false);
    const [formReady, setFormReady] = useState(false);
    const {
        pricing,
        activeServiceItems,
        loading,
        error,
        fetchPricing,
        updatePricing,
        fetchServiceItems,
        updateServiceItem
    } = useCheckoutStore();

    // 动态创建表单默认值
    const createDefaultValues = (): DynamicFormValues => {
        const defaults: DynamicFormValues = {};
        activeServiceItems.forEach(item => {
            defaults[`service_${item.id}`] = item.price || 0; // 确保不为 undefined
        });
        return defaults;
    };

    const form = useForm<DynamicFormValues>({
        resolver: zodResolver(activeServiceItems.length > 0 ? createFormSchema(activeServiceItems) : z.object({})),
        defaultValues: createDefaultValues(),
    });

    // 加载初始数据
    useEffect(() => {
        const loadData = async () => {
            await fetchServiceItems(true); // 只获取启用的服务项目
            await fetchPricing(); // 保持向后兼容，也获取传统价格设置
        };
        loadData();
    }, [fetchServiceItems, fetchPricing]);

    // 当服务项目数据加载后重新初始化表单
    useEffect(() => {
        if (!loading && activeServiceItems.length > 0) {
            const newDefaultValues = createDefaultValues();

            // 重新配置表单解析器和默认值
            form.reset(newDefaultValues);

            setFormReady(true);
        } else if (!loading && activeServiceItems.length === 0) {
            setFormReady(true);
        }
    }, [loading, activeServiceItems, form]);

    const onSubmit = async (values: DynamicFormValues) => {
        try {
            setIsSaving(true);

            // 更新所有服务项目的价格
            const updatePromises = activeServiceItems.map(item => {
                const newPrice = values[`service_${item.id}`];
                if (newPrice !== undefined && newPrice !== item.price) {
                    return updateServiceItem(item.id, { price: newPrice });
                }
                return Promise.resolve(true);
            });

            const results = await Promise.all(updatePromises);

            if (results.every(result => result)) {
                toast.success("价格设置已更新");
            } else {
                toast.error("部分价格设置更新失败");
            }
        } catch (error) {
            toast.error("更新价格设置失败");
        } finally {
            setIsSaving(false);
        }
    };

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    if (loading || !formReady) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">加载服务项目中...</span>
            </div>
        );
    }

    if (activeServiceItems.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                暂无启用的服务项目，请先添加服务项目。
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 动态服务项目价格表单 */}
            <Card>
                <CardHeader>
                    <CardTitle>服务项目价格设置</CardTitle>
                    <CardDescription>
                        设置各项服务的价格，这些价格将用于生成报价单。
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {activeServiceItems.map((item) => {
                                    const fieldName = `service_${item.id}` as FieldPath<DynamicFormValues>;

                                    return (
                                        <FormField
                                            key={item.id}
                                            control={form.control}
                                            name={fieldName}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        {item.name}
                                                        <span className="text-sm text-muted-foreground ml-2">
                                                            ({item.unit})
                                                        </span>
                                                    </FormLabel>
                                                    {item.description && (
                                                        <div className="text-xs text-muted-foreground mb-2">
                                                            {item.description}
                                                        </div>
                                                    )}
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            placeholder="0.00"
                                                            value={field.value || 0} // 确保不为 undefined
                                                            onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    );
                                })}
                            </div>

                            <Separator />

                            <Button
                                type="submit"
                                disabled={isSaving || loading}
                                className="w-full md:w-auto"
                            >
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
                </CardContent>
            </Card>

            {/* 向后兼容 - 显示传统价格设置（仅用于展示） */}
            {pricing && (pricing.basicServicePrice || pricing.sortingServicePrice || pricing.packagingServicePrice) && (
                <Card>
                    <CardHeader>
                        <CardTitle>传统价格设置</CardTitle>
                        <CardDescription>
                            旧版本的固定价格设置（仅供参考）
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="flex justify-between">
                                <span>基础服务价格：</span>
                                <span>¥{pricing.basicServicePrice}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>分拣服务价格：</span>
                                <span>¥{pricing.sortingServicePrice}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>装卸服务价格：</span>
                                <span>¥{pricing.packagingServicePrice}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
} 