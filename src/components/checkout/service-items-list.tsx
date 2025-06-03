'use client'

import { useEffect, useState } from "react";
import { useCheckoutStore } from "@/lib/stores/checkout.store";
import { ServiceItem, UpdateServiceItemInput } from "@/lib/db/checkout.queries";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Edit, Trash2, Loader2 } from "lucide-react";

const updateFormSchema = z.object({
    name: z.string().min(1, "服务项目名称不能为空"),
    unit: z.string().min(1, "计价单位不能为空"),
    price: z.number().min(0, "价格不能为负数"),
    description: z.string().optional(),
    isActive: z.boolean(),
});

type UpdateFormValues = z.infer<typeof updateFormSchema>;

interface EditDialogProps {
    item: ServiceItem;
    onUpdate: (id: number, data: UpdateServiceItemInput) => Promise<boolean>;
}

function EditDialog({ item, onUpdate }: EditDialogProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<UpdateFormValues>({
        resolver: zodResolver(updateFormSchema),
        defaultValues: {
            name: item.name || "",
            unit: item.unit || "",
            price: item.price || 0,
            description: item.description || "",
            isActive: item.isActive || false,
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                name: item.name || "",
                unit: item.unit || "",
                price: item.price || 0,
                description: item.description || "",
                isActive: item.isActive || false,
            });
        }
    }, [open, item, form]);

    const onSubmit = async (values: UpdateFormValues) => {
        try {
            setIsSubmitting(true);
            const success = await onUpdate(item.id, values);

            if (success) {
                toast.success("服务项目更新成功");
                setOpen(false);
            } else {
                toast.error("更新服务项目失败");
            }
        } catch (error) {
            toast.error("更新服务项目时发生错误");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>编辑服务项目</DialogTitle>
                    <DialogDescription>
                        修改服务项目的名称、计价单位和价格。
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
                                            className="resize-none"
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
                            name="isActive"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                    <div className="space-y-0.5">
                                        <FormLabel>启用状态</FormLabel>
                                        <div className="text-sm text-muted-foreground">
                                            是否在报价表单中显示此服务项目
                                        </div>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value || false}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end space-x-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                disabled={isSubmitting}
                            >
                                取消
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        更新中...
                                    </>
                                ) : (
                                    "更新服务项目"
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export function ServiceItemsList() {
    const {
        serviceItems,
        loading,
        error,
        fetchServiceItems,
        updateServiceItem,
        deleteServiceItem
    } = useCheckoutStore();

    useEffect(() => {
        fetchServiceItems();
    }, [fetchServiceItems]);

    const handleDelete = async (id: number, name: string) => {
        if (confirm(`确定要删除服务项目"${name}"吗？此操作将停用该项目，不会从数据库中删除。`)) {
            const success = await deleteServiceItem(id);
            if (success) {
                toast.success("服务项目已停用");
            } else {
                toast.error("停用服务项目失败");
            }
        }
    };

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>服务项目名称</TableHead>
                            <TableHead>计价单位</TableHead>
                            <TableHead>价格</TableHead>
                            <TableHead>状态</TableHead>
                            <TableHead>描述</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && serviceItems.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center">
                                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                                    <span className="ml-2">加载中...</span>
                                </TableCell>
                            </TableRow>
                        ) : serviceItems.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center">
                                    暂无服务项目
                                </TableCell>
                            </TableRow>
                        ) : (
                            serviceItems.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">
                                        {item.name}
                                    </TableCell>
                                    <TableCell>{item.unit}</TableCell>
                                    <TableCell>¥{item.price}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={item.isActive ? "default" : "secondary"}
                                        >
                                            {item.isActive ? "启用" : "停用"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate">
                                        {item.description || "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end space-x-2">
                                            <EditDialog
                                                item={item}
                                                onUpdate={updateServiceItem}
                                            />
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDelete(item.id, item.name)}
                                                disabled={loading}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
} 