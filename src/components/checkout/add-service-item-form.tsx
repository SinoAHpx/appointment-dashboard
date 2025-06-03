'use client'

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

const formSchema = z.object({
    name: z.string().min(1, "服务项目名称不能为空"),
    unit: z.string().min(1, "计价单位不能为空"),
    price: z.number().min(0, "价格不能为负数"),
    description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function AddServiceItemForm() {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { createServiceItem, loading } = useCheckoutStore();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            unit: "",
            price: 0,
            description: "",
        },
    });

    const onSubmit = async (values: FormValues) => {
        try {
            setIsSubmitting(true);
            const success = await createServiceItem(values);

            if (success) {
                toast.success("服务项目创建成功");
                form.reset({
                    name: "",
                    unit: "",
                    price: 0,
                    description: "",
                });
                setOpen(false);
            } else {
                toast.error("创建服务项目失败");
            }
        } catch (error) {
            toast.error("创建服务项目时发生错误");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    新增服务项目
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>新增服务项目</DialogTitle>
                    <DialogDescription>
                        创建一个新的服务项目，设置名称、计价单位和价格。
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>服务项目名称</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="例如：基础服务、分拣服务"
                                            value={field.value || ""}
                                            onChange={field.onChange}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="unit"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>计价单位</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="例如：元/袋、元/人/天、元/小时"
                                            value={field.value || ""}
                                            onChange={field.onChange}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>价格</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={field.value || 0}
                                            onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>描述（可选）</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="服务项目的详细描述..."
                                            className="resize-none"
                                            value={field.value || ""}
                                            onChange={field.onChange}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end space-x-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                disabled={isSubmitting || loading}
                            >
                                取消
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting || loading}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        创建中...
                                    </>
                                ) : (
                                    "创建服务项目"
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
} 