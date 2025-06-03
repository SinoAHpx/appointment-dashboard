import { Suspense } from "react";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { AddServiceItemForm } from "@/components/checkout/add-service-item-form";
import { ServiceItemsList } from "@/components/checkout/service-items-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CheckoutPage() {
    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">报价管理</h1>
            </div>

            <Tabs defaultValue="pricing" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="pricing">价格设置</TabsTrigger>
                    <TabsTrigger value="services">服务项目管理</TabsTrigger>
                </TabsList>

                {/* 价格设置页面 */}
                <TabsContent value="pricing" className="space-y-6">
                    <div className="max-w-6xl mx-auto">
                        <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
                            <CheckoutForm />
                        </Suspense>
                    </div>
                </TabsContent>

                {/* 服务项目管理页面 */}
                <TabsContent value="services" className="space-y-6">
                    <div className="max-w-6xl mx-auto space-y-6">
                        {/* 新增服务项目区域 */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>服务项目管理</CardTitle>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            添加和管理服务项目，设置项目名称、计价单位和价格
                                        </p>
                                    </div>
                                    <AddServiceItemForm />
                                </div>
                            </CardHeader>
                        </Card>

                        {/* 服务项目列表 */}
                        <Card>
                            <CardHeader>
                                <CardTitle>服务项目列表</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    管理所有服务项目的启用状态、价格和详细信息
                                </p>
                            </CardHeader>
                            <CardContent>
                                <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
                                    <ServiceItemsList />
                                </Suspense>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
} 